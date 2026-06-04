import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { icsForms } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const formTypes = ["HICS_201","HICS_202","HICS_203","HICS_204","HICS_205A","HICS_213","HICS_214","HICS_254"] as const;
const formStatuses = ["DRAFT","SUBMITTED","ACKNOWLEDGED","SUPERSEDED"] as const;

export const icsFormsRouter = router({
  list: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      formType: z.enum(formTypes).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(icsForms.incidentId, input.incidentId)];
      if (input.formType) conditions.push(eq(icsForms.formType, input.formType));
      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
      return db.select().from(icsForms).where(whereClause).orderBy(desc(icsForms.createdAt));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [form] = await db.select().from(icsForms).where(eq(icsForms.id, input.id)).limit(1);
      if (!form) throw new TRPCError({ code: "NOT_FOUND" });
      return form;
    }),

  save: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      incidentId: z.number(),
      formType: z.enum(formTypes),
      formData: z.any(),
      status: z.enum(formStatuses).default("DRAFT"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.id) {
        await db.update(icsForms).set({
          formData: input.formData,
          status: input.status,
        } as any).where(eq(icsForms.id, input.id));
        const [updated] = await db.select().from(icsForms).where(eq(icsForms.id, input.id)).limit(1);
        return updated;
      } else {
        await db.insert(icsForms).values({
          incidentId: input.incidentId,
          formType: input.formType,
          formData: input.formData,
          submittedById: ctx.user.id,
          status: input.status,
          version: 1,
        });
        const rows = await db.select().from(icsForms)
          .where(and(eq(icsForms.incidentId, input.incidentId), eq(icsForms.formType, input.formType)))
          .orderBy(desc(icsForms.createdAt)).limit(1);
        return rows[0];
      }
    }),

  acknowledge: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(icsForms).set({
        status: "ACKNOWLEDGED",
        acknowledgedById: ctx.user.id,
        acknowledgedAt: new Date(),
      } as any).where(eq(icsForms.id, input.id));
      const [updated] = await db.select().from(icsForms).where(eq(icsForms.id, input.id)).limit(1);
      return updated;
    }),
});
