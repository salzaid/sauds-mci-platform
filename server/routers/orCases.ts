import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { orCases } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const orStatuses = ["PROPOSED","SCHEDULED","IN_OR_PREP","INDUCTION","INCISION","CLOSURE","IN_PACU","OUT_PACU","COMPLETE","CANCELLED","ABORTED"] as const;

// Valid state transitions
const validTransitions: Record<string, string[]> = {
  PROPOSED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["IN_OR_PREP", "CANCELLED"],
  IN_OR_PREP: ["INDUCTION", "ABORTED"],
  INDUCTION: ["INCISION", "ABORTED"],
  INCISION: ["CLOSURE", "ABORTED"],
  CLOSURE: ["IN_PACU"],
  IN_PACU: ["OUT_PACU"],
  OUT_PACU: ["COMPLETE"],
};

export const orCasesRouter = router({
  list: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      status: z.enum(orStatuses).optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(orCases.incidentId, input.incidentId)];
      if (input.status) conditions.push(eq(orCases.status, input.status));
      const rows = await db.select().from(orCases)
        .where(and(...conditions))
        .orderBy(desc(orCases.priority), desc(orCases.createdAt))
        .limit(input.limit);
      return rows;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [orCase] = await db.select().from(orCases).where(eq(orCases.id, input.id)).limit(1);
      if (!orCase) throw new TRPCError({ code: "NOT_FOUND" });
      return orCase;
    }),

  create: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      casualtyId: z.number(),
      facilityId: z.number(),
      procedureType: z.string().optional(),
      priority: z.number().min(1).max(100).default(50),
      isDamageControl: z.boolean().default(false),
      estimatedDurationMin: z.number().optional(),
      bloodType: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const caseCode = `OR-${nanoid(8).toUpperCase()}`;
      await db.insert(orCases).values({
        ...input,
        caseCode,
        status: "PROPOSED",
      });
      const [created] = await db.select().from(orCases).where(eq(orCases.caseCode, caseCode)).limit(1);
      return created;
    }),

  transition: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(orStatuses),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [current] = await db.select().from(orCases).where(eq(orCases.id, input.id)).limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND" });
      const allowed = validTransitions[current.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot transition from ${current.status} to ${input.status}` });
      }
      const updates: Record<string, unknown> = { status: input.status };
      if (input.status === "INCISION") updates.incisionAt = new Date();
      if (input.status === "CLOSURE") updates.closureAt = new Date();
      if (input.notes) updates.notes = input.notes;
      await db.update(orCases).set(updates as any).where(eq(orCases.id, input.id));
      const [updated] = await db.select().from(orCases).where(eq(orCases.id, input.id)).limit(1);
      return updated;
    }),

  updateBloodProducts: protectedProcedure
    .input(z.object({
      id: z.number(),
      mtpActivated: z.boolean().optional(),
      rbcUnitsUsed: z.number().optional(),
      ffpUnitsUsed: z.number().optional(),
      plateletsUsed: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...updates } = input;
      await db.update(orCases).set(updates as any).where(eq(orCases.id, id));
      const [updated] = await db.select().from(orCases).where(eq(orCases.id, id)).limit(1);
      return updated;
    }),
});
