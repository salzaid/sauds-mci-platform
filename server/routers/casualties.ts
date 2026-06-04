import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { casualties, casualtyEvents, triageAssessments, incidents } from "../../drizzle/schema";
import { eq, desc, and, asc } from "drizzle-orm";

const triageCategories = ["IMMEDIATE","DELAYED","MINIMAL","EXPECTANT","DECEASED","UNKNOWN"] as const;
const eventTypes = ["TAGGED","ARRIVED_CCP","LOADED_TRANSPORT","ARRIVED_FACILITY","IN_RESUSCITATION","TO_IMAGING","TO_OR","TO_ICU","TO_WARD","DISCHARGED","TRANSFERRED","DECEASED","REASSESSED","IDENTITY_CONFIRMED"] as const;
const dispositions = ["AT_SCENE","IN_TRANSPORT","AT_FACILITY","DISCHARGED","TRANSFERRED","DECEASED"] as const;

export const casualtiesRouter = router({
  list: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      triageCategory: z.enum(triageCategories).optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(casualties.incidentId, input.incidentId)];
      if (input.triageCategory) conditions.push(eq(casualties.currentTriageCategory, input.triageCategory));
      const rows = await db.select().from(casualties)
        .where(and(...conditions))
        .orderBy(desc(casualties.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return rows;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [casualty] = await db.select().from(casualties).where(eq(casualties.id, input.id)).limit(1);
      if (!casualty) throw new TRPCError({ code: "NOT_FOUND" });
      return casualty;
    }),

  create: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      tagSerial: z.string().optional(),
      estimatedAge: z.number().optional(),
      sex: z.enum(["MALE","FEMALE","UNKNOWN"]).default("UNKNOWN"),
      nationality: z.string().optional(),
      locationGps: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Get incident code for provisional ID
      const [incident] = await db.select().from(incidents).where(eq(incidents.id, input.incidentId)).limit(1);
      if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
      // Count existing casualties for tag number
      const existing = await db.select().from(casualties).where(eq(casualties.incidentId, input.incidentId));
      const tagNum = String(existing.length + 1).padStart(4, "0");
      const provisionalId = `${incident.incidentCode}-T${tagNum}`;
      await db.insert(casualties).values({
        incidentId: input.incidentId,
        provisionalId,
        tagSerial: input.tagSerial,
        estimatedAge: input.estimatedAge,
        sex: input.sex,
        nationality: input.nationality,
        locationGps: input.locationGps,
        triagingClinicianId: ctx.user.id,
        notes: input.notes,
        currentTriageCategory: "UNKNOWN",
        disposition: "AT_SCENE",
      });
      const [created] = await db.select().from(casualties).where(eq(casualties.provisionalId, provisionalId)).limit(1);
      // Auto-create TAGGED event
      await db.insert(casualtyEvents).values({
        casualtyId: created.id,
        incidentId: input.incidentId,
        eventType: "TAGGED",
        validTime: new Date(),
        clinicianId: ctx.user.id,
        locationDescription: input.locationGps,
        notes: "Initial registration",
      });
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      currentTriageCategory: z.enum(triageCategories).optional(),
      currentLocation: z.string().optional(),
      currentFacilityId: z.number().optional(),
      disposition: z.enum(dispositions).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...updates } = input;
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(filteredUpdates).length > 0) {
        await db.update(casualties).set(filteredUpdates as any).where(eq(casualties.id, id));
      }
      const [updated] = await db.select().from(casualties).where(eq(casualties.id, id)).limit(1);
      return updated;
    }),

  addEvent: protectedProcedure
    .input(z.object({
      casualtyId: z.number(),
      incidentId: z.number(),
      eventType: z.enum(eventTypes),
      validTime: z.date().optional(),
      facilityId: z.number().optional(),
      transportId: z.number().optional(),
      locationDescription: z.string().optional(),
      triageCategory: z.enum(triageCategories).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(casualtyEvents).values({
        casualtyId: input.casualtyId,
        incidentId: input.incidentId,
        eventType: input.eventType,
        validTime: input.validTime ?? new Date(),
        clinicianId: ctx.user.id,
        facilityId: input.facilityId,
        transportId: input.transportId,
        locationDescription: input.locationDescription,
        triageCategory: input.triageCategory,
        notes: input.notes,
      });
      // Update casualty disposition based on event type
      const dispositionMap: Partial<Record<typeof eventTypes[number], typeof dispositions[number]>> = {
        LOADED_TRANSPORT: "IN_TRANSPORT",
        ARRIVED_FACILITY: "AT_FACILITY",
        DISCHARGED: "DISCHARGED",
        TRANSFERRED: "TRANSFERRED",
        DECEASED: "DECEASED",
      };
      const newDisposition = dispositionMap[input.eventType];
      if (newDisposition) {
        await db.update(casualties).set({
          disposition: newDisposition,
          currentFacilityId: input.facilityId,
          currentTriageCategory: input.triageCategory ?? undefined,
        } as any).where(eq(casualties.id, input.casualtyId));
      }
      return { success: true };
    }),

  getTimeline: protectedProcedure
    .input(z.object({ casualtyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const events = await db.select().from(casualtyEvents)
        .where(eq(casualtyEvents.casualtyId, input.casualtyId))
        .orderBy(asc(casualtyEvents.validTime));
      return events;
    }),

  getTriageHistory: protectedProcedure
    .input(z.object({ casualtyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const assessments = await db.select().from(triageAssessments)
        .where(eq(triageAssessments.casualtyId, input.casualtyId))
        .orderBy(asc(triageAssessments.assessedAt));
      return assessments;
    }),

  addTriage: protectedProcedure
    .input(z.object({
      casualtyId: z.number(),
      incidentId: z.number(),
      algorithm: z.enum(["SALT","START","JUMPSTART"]),
      category: z.enum(["IMMEDIATE","DELAYED","MINIMAL","EXPECTANT","DECEASED"]),
      respiratoryRate: z.number().optional(),
      pulsePresent: z.boolean().optional(),
      capRefillSec: z.number().optional(),
      mentalStatus: z.enum(["ALERT","VERBAL","PAIN","UNRESPONSIVE","FOLLOWS_COMMANDS","NONE"]).optional(),
      canWalk: z.boolean().optional(),
      tourniquet: z.boolean().default(false),
      airwayOpened: z.boolean().default(false),
      needleDecompression: z.boolean().default(false),
      autoinjector: z.boolean().default(false),
      otherIntervention: z.string().optional(),
      locationGps: z.string().optional(),
      notes: z.string().optional(),
      isReassessment: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Count prior assessments
      const prior = await db.select().from(triageAssessments).where(eq(triageAssessments.casualtyId, input.casualtyId));
      await db.insert(triageAssessments).values({
        casualtyId: input.casualtyId,
        incidentId: input.incidentId,
        algorithm: input.algorithm,
        category: input.category,
        respiratoryRate: input.respiratoryRate,
        pulsePresent: input.pulsePresent,
        capRefillSec: input.capRefillSec ? String(input.capRefillSec) as any : null,
        mentalStatus: input.mentalStatus,
        canWalk: input.canWalk,
        tourniquet: input.tourniquet,
        airwayOpened: input.airwayOpened,
        needleDecompression: input.needleDecompression,
        autoinjector: input.autoinjector,
        otherIntervention: input.otherIntervention,
        assessedById: ctx.user.id,
        locationGps: input.locationGps,
        assessedAt: new Date(),
        isReassessment: input.isReassessment || prior.length > 0,
        reassessmentCount: prior.length,
        notes: input.notes,
      });
      // Update casualty triage category
      await db.update(casualties).set({
        currentTriageCategory: input.category,
      } as any).where(eq(casualties.id, input.casualtyId));
      return { success: true };
    }),

  confirmIdentity: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      nationalId: z.string().optional(),
      dateOfBirth: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(casualties).set({
        firstName: input.firstName,
        lastName: input.lastName,
        nationalId: input.nationalId,
        dateOfBirth: input.dateOfBirth,
        identityConfirmed: true,
        identityMergedAt: new Date(),
        identityMergedById: ctx.user.id,
      } as any).where(eq(casualties.id, input.id));
      const [casualty] = await db.select().from(casualties).where(eq(casualties.id, input.id)).limit(1);
      // Add identity confirmed event
      await db.insert(casualtyEvents).values({
        casualtyId: input.id,
        incidentId: casualty.incidentId,
        eventType: "IDENTITY_CONFIRMED",
        validTime: new Date(),
        clinicianId: ctx.user.id,
        notes: `Identity confirmed: ${input.firstName} ${input.lastName}`,
      });
      return casualty;
    }),
});
