import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, invitations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { notifyOwner } from "../_core/notification";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function createSessionToken(userId: number, openId: string): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT({ userId, openId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export const customAuthRouter = router({
  // ── Register (only via valid invite token) ────────────────────────────────
  register: publicProcedure
    .input(z.object({
      inviteToken: z.string().min(1),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.password !== input.confirmPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Passwords do not match." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Validate invite token
      const [inv] = await db.select().from(invitations).where(eq(invitations.token, input.inviteToken)).limit(1);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found." });
      if (inv.status === "REVOKED") throw new TRPCError({ code: "FORBIDDEN", message: "This invitation has been revoked." });
      if (inv.status === "ACCEPTED") throw new TRPCError({ code: "CONFLICT", message: "This invitation has already been accepted." });
      if (inv.expiresAt < new Date()) throw new TRPCError({ code: "FORBIDDEN", message: "This invitation has expired." });

      // Check if user already exists with this email
      const existing = await db.select().from(users).where(eq(users.email, inv.email)).limit(1);

      const passwordHash = await hashPassword(input.password);

      let userId: number;

      if (existing.length > 0 && existing[0].passwordHash === null) {
        // Pre-created account — set password and role
        await db.update(users).set({
          passwordHash,
          role: inv.role,
          facilityId: inv.facilityId,
          loginMethod: "email",
          lastSignedIn: new Date(),
        } as any).where(eq(users.id, existing[0].id));
        userId = existing[0].id;
      } else if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Please sign in." });
      } else {
        // Create new user
        const openId = `email-${nanoid(24)}`;
        await db.insert(users).values({
          openId,
          name: inv.email.split("@")[0],
          email: inv.email,
          loginMethod: "email",
          role: inv.role,
          facilityId: inv.facilityId,
          passwordHash,
          isActive: true,
          lastSignedIn: new Date(),
        });
        const [created] = await db.select().from(users).where(eq(users.email, inv.email)).limit(1);
        userId = created.id;
      }

      // Mark invite as accepted
      await db.update(invitations).set({
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedByUserId: userId,
      }).where(eq(invitations.id, inv.id));

      // Fetch full user
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      // Issue session cookie
      const token = await createSessionToken(user.id, user.openId);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      // Return user without passwordHash
      const { passwordHash: _, passwordResetToken: __, passwordResetExpiry: ___, ...safeUser } = user;
      return safeUser;
    }),

  // ── Login ─────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }

      if (!user.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Your account has been deactivated. Contact an administrator." });
      }

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }

      // Update last signed in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      // Issue session cookie
      const token = await createSessionToken(user.id, user.openId);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      const { passwordHash: _, passwordResetToken: __, passwordResetExpiry: ___, ...safeUser } = user;
      return safeUser;
    }),

  // ── Change Password ───────────────────────────────────────────────────────
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Passwords do not match." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user?.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No password set on this account." });
      }

      const valid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
      }

      const newHash = await hashPassword(input.newPassword);
      await db.update(users).set({ passwordHash: newHash } as any).where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  // ── Forgot Password (request reset) ──────────────────────────────────────
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      // Always return success to prevent email enumeration
      if (!user || !user.passwordHash) {
        return { success: true };
      }

      const resetToken = nanoid(48);
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.update(users).set({
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      } as any).where(eq(users.id, user.id));

      // Notify the platform owner with the reset token (in production, send email to user)
      await notifyOwner({
        title: `Password Reset Request — ${user.email}`,
        content: `User **${user.name ?? user.email}** has requested a password reset.\n\nReset token (valid 1 hour): \`${resetToken}\`\n\nReset URL: {origin}/reset-password?token=${resetToken}\n\nIf you did not request this, ignore this message.`,
      });

      return { success: true };
    }),

  // ── Reset Password (with token) ───────────────────────────────────────────
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Passwords do not match." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.passwordResetToken, input.token)).limit(1);

      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired reset token." });
      if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This reset token has expired. Please request a new one." });
      }

      const newHash = await hashPassword(input.newPassword);
      await db.update(users).set({
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        lastSignedIn: new Date(),
      } as any).where(eq(users.id, user.id));

      // Issue session cookie so user is logged in immediately after reset
      const token = await createSessionToken(user.id, user.openId);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return { success: true };
    }),

  // ── Set password (admin sets password for a user) ─────────────────────────
  adminSetPassword: protectedProcedure
    .input(z.object({
      userId: z.number(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const newHash = await hashPassword(input.newPassword);
      await db.update(users).set({ passwordHash: newHash } as any).where(eq(users.id, input.userId));
      return { success: true };
    }),
});
