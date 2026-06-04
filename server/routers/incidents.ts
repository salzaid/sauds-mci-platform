import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { incidents, casualties, casualtyEvents, orCases, commsMessages } from "../../drizzle/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const incidentTypes = ["MASS_CASUALTY","HAZMAT","NATURAL_DISASTER","ACTIVE_SHOOTER","CHEMICAL","RADIATION","BIOLOGICAL","EXPLOSION","FIRE","FLOOD","OTHER"] as const;
const incidentStatuses = ["ACTIVATED","ESCALATED","DEACTIVATED","CLOSED"] as const;
const severities = ["LOW","MODERATE","HIGH","CATASTROPHIC"] as const;

export const incidentsRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.enum(incidentStatuses).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const conditions = input.status ? [eq(incidents.status, input.status)] : [];
      const rows = await db.select().from(incidents)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(incidents.activatedAt))
        .limit(input.limit)
        .offset(input.offset);
      return rows;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [incident] = await db.select().from(incidents).where(eq(incidents.id, input.id)).limit(1);
      if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
      return incident;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(512),
      nameAr: z.string().max(512).optional(),
      type: z.enum(incidentTypes),
      severity: z.enum(severities).default("MODERATE"),
      locationLat: z.string().optional(),
      locationLon: z.string().optional(),
      locationDescription: z.string().optional(),
      estimatedCasualties: z.number().min(0).default(0),
      facilityId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const year = new Date().getFullYear();
      const code = `MCI-${year}-${nanoid(6).toUpperCase()}`;
      await db.insert(incidents).values({
        incidentCode: code,
        name: input.name,
        nameAr: input.nameAr,
        type: input.type,
        severity: input.severity,
        locationLat: input.locationLat ? input.locationLat as any : null,
        locationLon: input.locationLon ? input.locationLon as any : null,
        locationDescription: input.locationDescription,
        estimatedCasualties: input.estimatedCasualties,
        commandingOfficerId: ctx.user.id,
        facilityId: input.facilityId,
        notes: input.notes,
        status: "ACTIVATED",
        activatedAt: new Date(),
      });
      const [created] = await db.select().from(incidents).where(eq(incidents.incidentCode, code)).limit(1);
      return created;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(incidentStatuses),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const updates: Record<string, unknown> = { status: input.status };
      if (input.status === "DEACTIVATED") updates.deactivatedAt = new Date();
      if (input.status === "CLOSED") updates.closedAt = new Date();
      await db.update(incidents).set(updates as any).where(eq(incidents.id, input.id));
      const [updated] = await db.select().from(incidents).where(eq(incidents.id, input.id)).limit(1);
      return updated;
    }),

  getBoard: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [incident] = await db.select().from(incidents).where(eq(incidents.id, input.id)).limit(1);
      if (!incident) throw new TRPCError({ code: "NOT_FOUND" });

      // Triage tally
      const tallyRows = await db.select({
        category: casualties.currentTriageCategory,
        count: count(),
      }).from(casualties)
        .where(eq(casualties.incidentId, input.id))
        .groupBy(casualties.currentTriageCategory);

      const tally: Record<string, number> = {
        IMMEDIATE: 0, DELAYED: 0, MINIMAL: 0, EXPECTANT: 0, DECEASED: 0, UNKNOWN: 0,
      };
      for (const row of tallyRows) {
        tally[row.category] = Number(row.count);
      }

      // Total casualties
      const [totalRow] = await db.select({ count: count() }).from(casualties).where(eq(casualties.incidentId, input.id));
      
      // Transport queue
      const [transportRow] = await db.select({ count: count() }).from(casualties)
        .where(and(eq(casualties.incidentId, input.id), eq(casualties.disposition, "IN_TRANSPORT")));

      // OR queue
      const [orRow] = await db.select({ count: count() }).from(orCases)
        .where(and(eq(orCases.incidentId, input.id), sql`status NOT IN ('COMPLETE','CANCELLED','ABORTED')`));

      return {
        incident,
        asOf: new Date(),
        triageTally: tally,
        totalCasualties: Number(totalRow?.count ?? 0),
        transportQueue: Number(transportRow?.count ?? 0),
        orQueue: Number(orRow?.count ?? 0),
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(incidents).where(eq(incidents.id, input.id));
      return { success: true };
    }),
});
