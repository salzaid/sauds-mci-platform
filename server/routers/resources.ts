import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { resources } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const resourceTypes = ["VENTILATOR","ICU_BED","HDU_BED","WARD_BED","OR_ROOM","BLOOD_O_POS","BLOOD_O_NEG","BLOOD_A_POS","BLOOD_A_NEG","BLOOD_B_POS","BLOOD_B_NEG","BLOOD_AB_POS","BLOOD_AB_NEG","PPE_UNIVERSAL","PPE_DROPLET","PPE_AIRBORNE","PPE_CBRN","TXA","ATROPINE","PRALIDOXIME","DIALYSIS_STATION","CT_SCANNER","CARM","MRI","ECMO"] as const;

export const resourcesRouter = router({
  list: protectedProcedure
    .input(z.object({
      facilityId: z.number().optional(),
      type: z.enum(resourceTypes).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [];
      if (input.facilityId) conditions.push(eq(resources.facilityId, input.facilityId));
      if (input.type) conditions.push(eq(resources.type, input.type));
      const rows = await db.select().from(resources)
        .where(conditions.length ? and(...conditions) : undefined);
      return rows;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      facilityId: z.number(),
      type: z.enum(resourceTypes),
      name: z.string(),
      total: z.number().min(0),
      inUse: z.number().min(0),
      available: z.number().min(0),
      inMaintenance: z.number().min(0).default(0),
      unit: z.string().default("unit"),
      lowThreshold: z.number().min(0).default(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.id) {
        await db.update(resources).set({ ...input, updatedById: ctx.user.id } as any).where(eq(resources.id, input.id));
        const [updated] = await db.select().from(resources).where(eq(resources.id, input.id)).limit(1);
        return updated;
      } else {
        await db.insert(resources).values({ ...input, updatedById: ctx.user.id } as any);
        const rows = await db.select().from(resources)
          .where(and(eq(resources.facilityId, input.facilityId), eq(resources.type, input.type)));
        return rows[rows.length - 1];
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(resources).where(eq(resources.id, input.id));
      return { success: true };
    }),
});
