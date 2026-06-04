import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { incidents, casualties, orCases, resources, transports, commsMessages, facilities } from "../../drizzle/schema";
import { eq, and, count, sql, desc, ne } from "drizzle-orm";

export const dashboardRouter = router({
  // Global overview across all active incidents
  overview: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [activeIncidents] = await db.select({ count: count() }).from(incidents)
        .where(sql`status IN ('ACTIVATED','ESCALATED')`);

      const [totalCasualties] = await db.select({ count: count() }).from(casualties);

      const [immediateCount] = await db.select({ count: count() }).from(casualties)
        .where(eq(casualties.currentTriageCategory, "IMMEDIATE"));

      const [orActive] = await db.select({ count: count() }).from(orCases)
        .where(sql`status IN ('IN_OR_PREP','INDUCTION','INCISION','CLOSURE')`);

      const [orPending] = await db.select({ count: count() }).from(orCases)
        .where(sql`status IN ('PROPOSED','SCHEDULED')`);

      return {
        activeIncidents: Number(activeIncidents?.count ?? 0),
        totalCasualties: Number(totalCasualties?.count ?? 0),
        immediateCount: Number(immediateCount?.count ?? 0),
        orActive: Number(orActive?.count ?? 0),
        orPending: Number(orPending?.count ?? 0),
        asOf: new Date(),
      };
    }),

  // Per-incident detailed dashboard
  incidentDashboard: protectedProcedure
    .input(z.object({ incidentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const id = input.incidentId;

      // Triage tally
      const tallyRows = await db.select({
        category: casualties.currentTriageCategory,
        count: count(),
      }).from(casualties).where(eq(casualties.incidentId, id)).groupBy(casualties.currentTriageCategory);

      const triage: Record<string, number> = {
        IMMEDIATE: 0, DELAYED: 0, MINIMAL: 0, EXPECTANT: 0, DECEASED: 0, UNKNOWN: 0,
      };
      for (const r of tallyRows) triage[r.category] = Number(r.count);

      // Disposition tally
      const dispRows = await db.select({
        disposition: casualties.disposition,
        count: count(),
      }).from(casualties).where(eq(casualties.incidentId, id)).groupBy(casualties.disposition);
      const disposition: Record<string, number> = {};
      for (const r of dispRows) disposition[r.disposition] = Number(r.count);

      // OR status
      const orRows = await db.select({
        status: orCases.status,
        count: count(),
      }).from(orCases).where(eq(orCases.incidentId, id)).groupBy(orCases.status);
      const or: Record<string, number> = {};
      for (const r of orRows) or[r.status] = Number(r.count);

      // Transport queue
      const [transportQueue] = await db.select({ count: count() }).from(transports)
        .where(and(eq(transports.incidentId, id), sql`status IN ('DISPATCHED','EN_ROUTE','AT_SCENE','LOADED')`));

      // Unacknowledged comms
      const [unackComms] = await db.select({ count: count() }).from(commsMessages)
        .where(and(eq(commsMessages.incidentId, id), sql`acknowledgedAt IS NULL AND priority IN ('URGENT','FLASH')`));

      return {
        incidentId: id,
        asOf: new Date(),
        triage,
        disposition,
        orQueue: or,
        transportQueue: Number(transportQueue?.count ?? 0),
        urgentComms: Number(unackComms?.count ?? 0),
      };
    }),

  // Resource summary per facility
  resourceSummary: protectedProcedure
    .input(z.object({ facilityId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = input.facilityId ? [eq(resources.facilityId, input.facilityId)] : [];
      const rows = await db.select().from(resources)
        .where(conditions.length ? and(...conditions) : undefined);
      // Group by type
      const byType: Record<string, { total: number; inUse: number; available: number; inMaintenance: number }> = {};
      for (const r of rows) {
        if (!byType[r.type]) byType[r.type] = { total: 0, inUse: 0, available: 0, inMaintenance: 0 };
        byType[r.type].total += r.total;
        byType[r.type].inUse += r.inUse;
        byType[r.type].available += r.available;
        byType[r.type].inMaintenance += r.inMaintenance;
      }
      return { byType, raw: rows };
    }),

  // AAR KPIs for a closed incident
  aarKpis: protectedProcedure
    .input(z.object({ incidentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const id = input.incidentId;

      const [incident] = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
      if (!incident) throw new TRPCError({ code: "NOT_FOUND" });

      const [totalCasualties] = await db.select({ count: count() }).from(casualties).where(eq(casualties.incidentId, id));
      const [deceased] = await db.select({ count: count() }).from(casualties)
        .where(and(eq(casualties.incidentId, id), eq(casualties.currentTriageCategory, "DECEASED")));
      const [discharged] = await db.select({ count: count() }).from(casualties)
        .where(and(eq(casualties.incidentId, id), eq(casualties.disposition, "DISCHARGED")));
      const [orCompleted] = await db.select({ count: count() }).from(orCases)
        .where(and(eq(orCases.incidentId, id), eq(orCases.status, "COMPLETE")));
      const [identityConfirmed] = await db.select({ count: count() }).from(casualties)
        .where(and(eq(casualties.incidentId, id), eq(casualties.identityConfirmed, true)));

      const durationHours = incident.closedAt
        ? Math.round((incident.closedAt.getTime() - incident.activatedAt.getTime()) / 3600000)
        : null;

      return {
        incidentId: id,
        incidentName: incident.name,
        incidentCode: incident.incidentCode,
        activatedAt: incident.activatedAt,
        closedAt: incident.closedAt,
        durationHours,
        totalCasualties: Number(totalCasualties?.count ?? 0),
        deceased: Number(deceased?.count ?? 0),
        discharged: Number(discharged?.count ?? 0),
        orCompleted: Number(orCompleted?.count ?? 0),
        identityConfirmed: Number(identityConfirmed?.count ?? 0),
        mortalityRate: totalCasualties?.count
          ? Math.round((Number(deceased?.count ?? 0) / Number(totalCasualties.count)) * 100)
          : 0,
      };
    }),
});
