import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { invitations, users, facilities } from "../../drizzle/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { invokeLLM } from "../_core/llm";

const roles = ["superadmin","admin","incident_commander","clinician","triage_officer","logistics","viewer"] as const;

function requireAdmin(role: string) {
  if (role !== "superadmin" && role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

const INVITE_EXPIRY_DAYS = 7;

async function sendInviteEmail(opts: {
  toEmail: string;
  inviterName: string;
  role: string;
  facilityName: string | null;
  message: string | null;
  inviteUrl: string;
}) {
  const roleLabels: Record<string, string> = {
    superadmin: "Super Admin", admin: "Admin",
    incident_commander: "Incident Commander", clinician: "Clinician",
    triage_officer: "Triage Officer", logistics: "Logistics Officer", viewer: "Viewer",
  };
  const roleLabel = roleLabels[opts.role] ?? opts.role;

  // Use LLM to compose a professional invite email body
  const prompt = `Write a concise, professional HTML email body (no <html>/<body> tags, just the inner content) inviting someone to join "Saud's MCI Platform" — a Mass Casualty Incident & Disaster Management Platform.

Details:
- Invited by: ${opts.inviterName}
- Assigned role: ${roleLabel}
${opts.facilityName ? `- Assigned facility: ${opts.facilityName}` : ""}
${opts.message ? `- Personal message from inviter: "${opts.message}"` : ""}
- Accept invite link: ${opts.inviteUrl}
- Link expires in ${INVITE_EXPIRY_DAYS} days

Include:
1. A brief welcome sentence
2. What the platform does (1 sentence)
3. Their assigned role and what it means
4. A prominent CTA button/link to accept the invite
5. A note that the link expires in ${INVITE_EXPIRY_DAYS} days
6. Professional closing

Use inline styles for a dark-themed email (background #1a1a2e, text #e2e8f0, accent blue #3b82f6). Keep it under 300 words.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert at writing professional HTML emails. Output only the HTML content, no markdown fences." },
        { role: "user", content: prompt },
      ],
    });
    return response.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export const invitationsRouter = router({
  // ── Admin: list all invitations ──────────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["PENDING","ACCEPTED","REVOKED","EXPIRED"]).optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = input.status ? [eq(invitations.status, input.status)] : [];
      return db.select().from(invitations)
        .where(conditions.length ? conditions[0] : undefined)
        .orderBy(desc(invitations.createdAt))
        .limit(input.limit);
    }),

  // ── Admin: create & send invite ──────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(roles).default("viewer"),
      facilityId: z.number().optional(),
      message: z.string().max(500).optional(),
      origin: z.string().url(), // passed from frontend: window.location.origin
    }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if there's already a pending invite for this email
      const existing = await db.select().from(invitations)
        .where(and(eq(invitations.email, input.email), eq(invitations.status, "PENDING")))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A pending invitation already exists for this email address." });
      }

      // Check if user already exists
      const existingUser = await db.select().from(users)
        .where(eq(users.email, input.email)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists." });
      }

      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      const inviteUrl = `${input.origin}/invite/${token}`;

      // Get facility name if provided
      let facilityName: string | null = null;
      if (input.facilityId) {
        const [fac] = await db.select().from(facilities).where(eq(facilities.id, input.facilityId)).limit(1);
        facilityName = fac?.name ?? null;
      }

      // Insert invitation record
      await db.insert(invitations).values({
        email: input.email,
        role: input.role,
        facilityId: input.facilityId,
        token,
        invitedById: ctx.user.id,
        invitedByName: ctx.user.name ?? "Platform Admin",
        message: input.message,
        status: "PENDING",
        expiresAt,
      });

      // Compose and send email via LLM + notification
      const emailBody = await sendInviteEmail({
        toEmail: input.email,
        inviterName: ctx.user.name ?? "Platform Admin",
        role: input.role,
        facilityName,
        message: input.message ?? null,
        inviteUrl,
      });

      // Return the invite details (including URL for manual sharing)
      const [created] = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
      return { invitation: created, inviteUrl, emailBody };
    }),

  // ── Admin: resend invite ─────────────────────────────────────────────────────
  resend: protectedProcedure
    .input(z.object({
      id: z.number(),
      origin: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [inv] = await db.select().from(invitations).where(eq(invitations.id, input.id)).limit(1);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" });
      if (inv.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Can only resend PENDING invitations." });

      // Extend expiry
      const newExpiry = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      await db.update(invitations).set({ expiresAt: newExpiry }).where(eq(invitations.id, input.id));

      const inviteUrl = `${input.origin}/invite/${inv.token}`;
      return { inviteUrl };
    }),

  // ── Admin: revoke invite ─────────────────────────────────────────────────────
  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(invitations).set({ status: "REVOKED" }).where(eq(invitations.id, input.id));
      return { success: true };
    }),

  // ── Public: look up an invite by token ───────────────────────────────────────
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [inv] = await db.select().from(invitations).where(eq(invitations.token, input.token)).limit(1);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found." });
      if (inv.status === "REVOKED") throw new TRPCError({ code: "FORBIDDEN", message: "This invitation has been revoked." });
      if (inv.status === "ACCEPTED") throw new TRPCError({ code: "CONFLICT", message: "This invitation has already been accepted." });
      if (inv.status === "EXPIRED" || inv.expiresAt < new Date()) {
        await db.update(invitations).set({ status: "EXPIRED" }).where(eq(invitations.id, inv.id));
        throw new TRPCError({ code: "FORBIDDEN", message: "This invitation has expired." });
      }
      // Return safe subset — no internal IDs
      return {
        email: inv.email,
        role: inv.role,
        facilityId: inv.facilityId,
        invitedByName: inv.invitedByName,
        message: inv.message,
        expiresAt: inv.expiresAt,
        status: inv.status,
      };
    }),

  // ── Protected: claim invite after login ──────────────────────────────────────
  claim: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [inv] = await db.select().from(invitations).where(eq(invitations.token, input.token)).limit(1);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found." });
      if (inv.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: `Invitation is ${inv.status}.` });
      if (inv.expiresAt < new Date()) {
        await db.update(invitations).set({ status: "EXPIRED" }).where(eq(invitations.id, inv.id));
        throw new TRPCError({ code: "FORBIDDEN", message: "This invitation has expired." });
      }

      // Apply role and facility to the logged-in user
      await db.update(users).set({
        role: inv.role,
        facilityId: inv.facilityId ?? undefined,
      } as any).where(eq(users.id, ctx.user.id));

      // Mark invitation as accepted
      await db.update(invitations).set({
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedByUserId: ctx.user.id,
      }).where(eq(invitations.id, inv.id));

      return { success: true, role: inv.role, facilityId: inv.facilityId };
    }),
});
