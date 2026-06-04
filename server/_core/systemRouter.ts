import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { accessRequests } from "../../drizzle/schema";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  // ── Public: request access ─────────────────────────────────────────────────
  requestAccess: publicProcedure
    .input(z.object({
      fullName: z.string().min(2).max(128),
      email: z.string().email(),
      jobTitle: z.string().min(2).max(128),
      facility: z.string().min(2).max(256),
      reason: z.string().min(10).max(1000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (db) {
        await db.insert(accessRequests).values({
          fullName: input.fullName,
          email: input.email,
          jobTitle: input.jobTitle,
          facility: input.facility,
          reason: input.reason,
          status: "PENDING",
        });
      }
      // Notify the platform owner
      await notifyOwner({
        title: `New Access Request — ${input.fullName}`,
        content: `**${input.fullName}** (${input.jobTitle} at ${input.facility}) has requested access to Saud's MCI Platform.\n\n**Email:** ${input.email}\n\n**Reason:** ${input.reason}\n\nReview and send an invitation from Admin → Invitations.`,
      });
      return { success: true };
    }),

  // ── Admin: list access requests ────────────────────────────────────────────
  listAccessRequests: adminProcedure
    .input(z.object({
      status: z.enum(["PENDING","INVITED","REJECTED"]).optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { desc, eq } = await import("drizzle-orm");
      const conditions = input.status ? [eq(accessRequests.status, input.status)] : [];
      return db.select().from(accessRequests)
        .where(conditions.length ? conditions[0] : undefined)
        .orderBy(desc(accessRequests.createdAt))
        .limit(input.limit);
    }),

  // ── Admin: update access request status ───────────────────────────────────
  updateAccessRequest: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["PENDING","INVITED","REJECTED"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const { eq } = await import("drizzle-orm");
      await db.update(accessRequests).set({ status: input.status }).where(eq(accessRequests.id, input.id));
      return { success: true };
    }),
});
