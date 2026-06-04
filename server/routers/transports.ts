import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { transports } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

const transportTypes = ["AMBULANCE","HELICOPTER","FIXED_WING","BUS","OTHER"] as const;
const transportStatuses = ["AVAILABLE","DISPATCHED","EN_ROUTE","AT_SCENE","LOADED","RETURNING","OUT_OF_SERVICE"] as const;

export const transportsRouter = router({
  list: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      status: z.enum(transportStatuses).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(transports.incidentId, input.incidentId)];
      if (input.status) conditions.push(eq(transports.status, input.status));
      return db.select().from(transports).where(and(...conditions)).orderBy(desc(transports.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      type: z.enum(transportTypes),
      originFacilityId: z.number().optional(),
      destinationFacilityId: z.number().optional(),
      driverName: z.string().optional(),
      etaMinutes: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const transportCode = `TRN-${nanoid(8).toUpperCase()}`;
      await db.insert(transports).values({
        ...input,
        transportCode,
        status: "AVAILABLE",
        attendingClinicianId: ctx.user.id,
      });
      const [created] = await db.select().from(transports).where(eq(transports.transportCode, transportCode)).limit(1);
      return created;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(transportStatuses),
      etaMinutes: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const updates: Record<string, unknown> = { status: input.status };
      if (input.status === "DISPATCHED") updates.dispatchedAt = new Date();
      if (input.status === "LOADED") updates.arrivedAt = new Date();
      if (input.etaMinutes !== undefined) updates.etaMinutes = input.etaMinutes;
      if (input.notes) updates.notes = input.notes;
      await db.update(transports).set(updates as any).where(eq(transports.id, input.id));
      const [updated] = await db.select().from(transports).where(eq(transports.id, input.id)).limit(1);
      return updated;
    }),
});
