import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, facilities, auditLogs } from "../../drizzle/schema";
import { eq, desc, like, or } from "drizzle-orm";

const roles = ["superadmin","admin","incident_commander","clinician","triage_officer","logistics","viewer"] as const;

function requireAdmin(role: string) {
  if (role !== "superadmin" && role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

export const adminRouter = router({
  // ── Users ──────────────────────────────────────────────────────────────────
  listUsers: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      let query = db.select().from(users);
      if (input.search) {
        query = query.where(
          or(
            like(users.name, `%${input.search}%`),
            like(users.email, `%${input.search}%`)
          )
        ) as any;
      }
      return query.orderBy(desc(users.createdAt)).limit(input.limit).offset(input.offset);
    }),

  createUser: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(256),
      email: z.string().email(),
      role: z.enum(roles).default("viewer"),
      facilityId: z.number().optional(),
      jobTitle: z.string().max(128).optional(),
      phone: z.string().max(32).optional(),
      preferredLang: z.enum(["en","ar"]).default("en"),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only superadmins can create users directly." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Check for duplicate email
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists." });
      }
      // Generate a deterministic openId for manually-created users
      const { nanoid } = await import("nanoid");
      const openId = `manual-${nanoid(24)}`;
      await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        loginMethod: "manual",
        role: input.role,
        facilityId: input.facilityId,
        jobTitle: input.jobTitle,
        phone: input.phone,
        preferredLang: input.preferredLang,
        isActive: true,
        lastSignedIn: new Date(),
      });
      const [created] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      return created;
    }),

  updateUser: protectedProcedure
    .input(z.object({
      id: z.number(),
      role: z.enum(roles).optional(),
      facilityId: z.number().nullable().optional(),
      jobTitle: z.string().optional(),
      phone: z.string().optional(),
      isActive: z.boolean().optional(),
      preferredLang: z.enum(["en","ar"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...updates } = input;
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      );
      await db.update(users).set(filteredUpdates as any).where(eq(users.id, id));
      const [updated] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return updated;
    }),

  // ── Facilities ─────────────────────────────────────────────────────────────
  listFacilities: protectedProcedure
    .input(z.object({
      includeInactive: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      let query = db.select().from(facilities);
      if (!input.includeInactive) {
        query = query.where(eq(facilities.isActive, true)) as any;
      }
      return query.orderBy(facilities.name);
    }),

  createFacility: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(256),
      nameAr: z.string().max(256).optional(),
      code: z.string().min(2).max(32),
      type: z.enum(["hospital","field_hospital","clinic","command_center"]).default("hospital"),
      address: z.string().optional(),
      city: z.string().optional(),
      lat: z.string().optional(),
      lon: z.string().optional(),
      phone: z.string().optional(),
      traumaLevel: z.enum(["I","II","III","IV","V"]).optional(),
      totalBeds: z.number().min(0).default(0),
      icuBeds: z.number().min(0).default(0),
      orRooms: z.number().min(0).default(0),
      ventilators: z.number().min(0).default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(facilities).values(input as any);
      const [created] = await db.select().from(facilities).where(eq(facilities.code, input.code)).limit(1);
      return created;
    }),

  updateFacility: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      nameAr: z.string().optional(),
      totalBeds: z.number().optional(),
      icuBeds: z.number().optional(),
      orRooms: z.number().optional(),
      ventilators: z.number().optional(),
      isActive: z.boolean().optional(),
      traumaLevel: z.enum(["I","II","III","IV","V"]).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...updates } = input;
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      );
      await db.update(facilities).set(filteredUpdates as any).where(eq(facilities.id, id));
      const [updated] = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1);
      return updated;
    }),

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  listAuditLogs: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),
});
