import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { emtMdsReports } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const emtMdsRouter = router({
  list: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      facilityId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(emtMdsReports.incidentId, input.incidentId)];
      if (input.facilityId) conditions.push(eq(emtMdsReports.facilityId, input.facilityId));
      return db.select().from(emtMdsReports).where(and(...conditions)).orderBy(desc(emtMdsReports.reportDate));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [report] = await db.select().from(emtMdsReports).where(eq(emtMdsReports.id, input.id)).limit(1);
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });
      return report;
    }),

  save: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      incidentId: z.number(),
      facilityId: z.number(),
      reportDate: z.date(),
      reportData: z.any(),
      status: z.enum(["DRAFT","SUBMITTED","EXPORTED"]).default("DRAFT"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.id) {
        await db.update(emtMdsReports).set({
          reportData: input.reportData,
          status: input.status,
        } as any).where(eq(emtMdsReports.id, input.id));
        const [updated] = await db.select().from(emtMdsReports).where(eq(emtMdsReports.id, input.id)).limit(1);
        return updated;
      } else {
        await db.insert(emtMdsReports).values({
          incidentId: input.incidentId,
          facilityId: input.facilityId,
          reportDate: input.reportDate,
          reportData: input.reportData,
          submittedById: ctx.user.id,
          status: input.status,
        });
        const rows = await db.select().from(emtMdsReports)
          .where(eq(emtMdsReports.incidentId, input.incidentId))
          .orderBy(desc(emtMdsReports.createdAt)).limit(1);
        return rows[0];
      }
    }),
});
