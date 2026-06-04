/**
 * Demo Router — public read-only access to all platform data.
 * Used exclusively by the /demo/* routes for GitHub showcase.
 * No authentication required. All mutations are disabled.
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  incidents, casualties, casualtyEvents, triageAssessments,
  orCases, resources, transports, icsForms, emtMdsReports,
  commsMessages, facilities, users
} from "../../drizzle/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

export const demoRouter = router({
  // ── Overview ──────────────────────────────────────────────────────────────
  overview: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [activeIncidents] = await db.select({ count: count() }).from(incidents).where(sql`status IN ('ACTIVATED','ESCALATED')`);
    const [totalCasualties] = await db.select({ count: count() }).from(casualties);
    const [immediateCount] = await db.select({ count: count() }).from(casualties).where(eq(casualties.currentTriageCategory, "IMMEDIATE"));
    const [orActive] = await db.select({ count: count() }).from(orCases).where(sql`status IN ('IN_OR_PREP','INDUCTION','INCISION','CLOSURE')`);
    const [orPending] = await db.select({ count: count() }).from(orCases).where(sql`status IN ('PROPOSED','SCHEDULED')`);
    return {
      activeIncidents: Number(activeIncidents?.count ?? 0),
      totalCasualties: Number(totalCasualties?.count ?? 0),
      immediateCount: Number(immediateCount?.count ?? 0),
      orActive: Number(orActive?.count ?? 0),
      orPending: Number(orPending?.count ?? 0),
      asOf: new Date(),
    };
  }),

  // ── Incidents ─────────────────────────────────────────────────────────────
  listIncidents: publicProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = input.status ? [eq(incidents.status, input.status as any)] : [];
      return db.select().from(incidents)
        .where(conditions.length ? conditions[0] : undefined)
        .orderBy(desc(incidents.activatedAt)).limit(input.limit);
    }),

  getIncident: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [incident] = await db.select().from(incidents).where(eq(incidents.id, input.id)).limit(1);
      if (!incident) throw new TRPCError({ code: "NOT_FOUND" });
      return incident;
    }),

  getIncidentBoard: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [incident] = await db.select().from(incidents).where(eq(incidents.id, input.id)).limit(1);
      if (!incident) throw new TRPCError({ code: "NOT_FOUND" });
      const tallyRows = await db.select({ category: casualties.currentTriageCategory, count: count() }).from(casualties).where(eq(casualties.incidentId, input.id)).groupBy(casualties.currentTriageCategory);
      const tally: Record<string, number> = { IMMEDIATE: 0, DELAYED: 0, MINIMAL: 0, EXPECTANT: 0, DECEASED: 0, UNKNOWN: 0 };
      for (const r of tallyRows) tally[r.category] = Number(r.count);
      const [totalRow] = await db.select({ count: count() }).from(casualties).where(eq(casualties.incidentId, input.id));
      const [transportRow] = await db.select({ count: count() }).from(casualties).where(and(eq(casualties.incidentId, input.id), eq(casualties.disposition, "IN_TRANSPORT")));
      const [orRow] = await db.select({ count: count() }).from(orCases).where(and(eq(orCases.incidentId, input.id), sql`status NOT IN ('COMPLETE','CANCELLED','ABORTED')`));
      return { incident, asOf: new Date(), triageTally: tally, totalCasualties: Number(totalRow?.count ?? 0), transportQueue: Number(transportRow?.count ?? 0), orQueue: Number(orRow?.count ?? 0) };
    }),

  // ── Casualties ────────────────────────────────────────────────────────────
  listCasualties: publicProcedure
    .input(z.object({ incidentId: z.number(), triageCategory: z.string().optional(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(casualties.incidentId, input.incidentId)];
      if (input.triageCategory) conditions.push(eq(casualties.currentTriageCategory, input.triageCategory as any));
      return db.select().from(casualties).where(and(...conditions)).orderBy(desc(casualties.createdAt)).limit(input.limit);
    }),

  getCasualty: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [c] = await db.select().from(casualties).where(eq(casualties.id, input.id)).limit(1);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  getCasualtyTimeline: publicProcedure
    .input(z.object({ casualtyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(casualtyEvents).where(eq(casualtyEvents.casualtyId, input.casualtyId)).orderBy(casualtyEvents.validTime);
    }),

  getCasualtyTriage: publicProcedure
    .input(z.object({ casualtyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(triageAssessments).where(eq(triageAssessments.casualtyId, input.casualtyId)).orderBy(triageAssessments.assessedAt);
    }),

  // ── OR Cases ──────────────────────────────────────────────────────────────
  listOrCases: publicProcedure
    .input(z.object({ incidentId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(orCases).where(eq(orCases.incidentId, input.incidentId)).orderBy(desc(orCases.priority), desc(orCases.createdAt)).limit(input.limit);
    }),

  // ── Resources ─────────────────────────────────────────────────────────────
  listResources: publicProcedure
    .input(z.object({ facilityId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = input.facilityId ? [eq(resources.facilityId, input.facilityId)] : [];
      return db.select().from(resources).where(conditions.length ? conditions[0] : undefined);
    }),

  resourceSummary: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select().from(resources);
    const byType: Record<string, { total: number; inUse: number; available: number; inMaintenance: number }> = {};
    for (const r of rows) {
      if (!byType[r.type]) byType[r.type] = { total: 0, inUse: 0, available: 0, inMaintenance: 0 };
      byType[r.type].total += r.total; byType[r.type].inUse += r.inUse;
      byType[r.type].available += r.available; byType[r.type].inMaintenance += r.inMaintenance;
    }
    return { byType, raw: rows };
  }),

  // ── Transports ────────────────────────────────────────────────────────────
  listTransports: publicProcedure
    .input(z.object({ incidentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(transports).where(eq(transports.incidentId, input.incidentId)).orderBy(desc(transports.createdAt));
    }),

  // ── ICS Forms ─────────────────────────────────────────────────────────────
  listIcsForms: publicProcedure
    .input(z.object({ incidentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(icsForms).where(eq(icsForms.incidentId, input.incidentId)).orderBy(desc(icsForms.createdAt));
    }),

  // ── EMT MDS ───────────────────────────────────────────────────────────────
  listEmtMds: publicProcedure
    .input(z.object({ incidentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(emtMdsReports).where(eq(emtMdsReports.incidentId, input.incidentId)).orderBy(desc(emtMdsReports.reportDate));
    }),

  // ── Communications ────────────────────────────────────────────────────────
  listComms: publicProcedure
    .input(z.object({ incidentId: z.number(), channel: z.string().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(commsMessages.incidentId, input.incidentId)];
      if (input.channel) conditions.push(eq(commsMessages.channel, input.channel as any));
      return db.select().from(commsMessages).where(and(...conditions)).orderBy(desc(commsMessages.createdAt)).limit(input.limit);
    }),

  // ── Facilities ────────────────────────────────────────────────────────────
  listFacilities: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(facilities).where(eq(facilities.isActive, true)).orderBy(facilities.name);
  }),

  // ── AAR KPIs ──────────────────────────────────────────────────────────────
  aarKpis: publicProcedure
    .input(z.object({ incidentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [incident] = await db.select().from(incidents).where(eq(incidents.id, input.incidentId)).limit(1);
      if (!incident) throw new TRPCError({ code: "NOT_FOUND" });
      const [totalCasualties] = await db.select({ count: count() }).from(casualties).where(eq(casualties.incidentId, input.incidentId));
      const [deceased] = await db.select({ count: count() }).from(casualties).where(and(eq(casualties.incidentId, input.incidentId), eq(casualties.currentTriageCategory, "DECEASED")));
      const [discharged] = await db.select({ count: count() }).from(casualties).where(and(eq(casualties.incidentId, input.incidentId), eq(casualties.disposition, "DISCHARGED")));
      const [orCompleted] = await db.select({ count: count() }).from(orCases).where(and(eq(orCases.incidentId, input.incidentId), eq(orCases.status, "COMPLETE")));
      const [identityConfirmed] = await db.select({ count: count() }).from(casualties).where(and(eq(casualties.incidentId, input.incidentId), eq(casualties.identityConfirmed, true)));
      const durationHours = incident.closedAt ? Math.round((incident.closedAt.getTime() - incident.activatedAt.getTime()) / 3600000) : null;
      const total = Number(totalCasualties?.count ?? 0);
      const dead = Number(deceased?.count ?? 0);
      return {
        incidentId: input.incidentId, incidentName: incident.name, incidentCode: incident.incidentCode,
        activatedAt: incident.activatedAt, closedAt: incident.closedAt, durationHours,
        totalCasualties: total, deceased: dead, discharged: Number(discharged?.count ?? 0),
        orCompleted: Number(orCompleted?.count ?? 0), identityConfirmed: Number(identityConfirmed?.count ?? 0),
        mortalityRate: total > 0 ? Math.round((dead / total) * 100) : 0,
      };
    }),

  // ── Incident dashboard ────────────────────────────────────────────────────
  incidentDashboard: publicProcedure
    .input(z.object({ incidentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const id = input.incidentId;
      const tallyRows = await db.select({ category: casualties.currentTriageCategory, count: count() }).from(casualties).where(eq(casualties.incidentId, id)).groupBy(casualties.currentTriageCategory);
      const triage: Record<string, number> = { IMMEDIATE: 0, DELAYED: 0, MINIMAL: 0, EXPECTANT: 0, DECEASED: 0, UNKNOWN: 0 };
      for (const r of tallyRows) triage[r.category] = Number(r.count);
      const dispRows = await db.select({ disposition: casualties.disposition, count: count() }).from(casualties).where(eq(casualties.incidentId, id)).groupBy(casualties.disposition);
      const disposition: Record<string, number> = {};
      for (const r of dispRows) disposition[r.disposition] = Number(r.count);
      const orRows = await db.select({ status: orCases.status, count: count() }).from(orCases).where(eq(orCases.incidentId, id)).groupBy(orCases.status);
      const or: Record<string, number> = {};
      for (const r of orRows) or[r.status] = Number(r.count);
      const [transportQueue] = await db.select({ count: count() }).from(transports).where(and(eq(transports.incidentId, id), sql`status IN ('DISPATCHED','EN_ROUTE','AT_SCENE','LOADED')`));
      const [unackComms] = await db.select({ count: count() }).from(commsMessages).where(and(eq(commsMessages.incidentId, id), sql`acknowledgedAt IS NULL AND priority IN ('URGENT','FLASH')`));
      return { incidentId: id, asOf: new Date(), triage, disposition, orQueue: or, transportQueue: Number(transportQueue?.count ?? 0), urgentComms: Number(unackComms?.count ?? 0) };
    }),
});
