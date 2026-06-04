import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { commsMessages } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const channels = ["COMMAND","OPERATIONS","LOGISTICS","MEDICAL","GENERAL"] as const;
const priorities = ["ROUTINE","URGENT","FLASH"] as const;

export const commsRouter = router({
  list: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      channel: z.enum(channels).optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(commsMessages.incidentId, input.incidentId)];
      if (input.channel) conditions.push(eq(commsMessages.channel, input.channel));
      return db.select().from(commsMessages)
        .where(and(...conditions))
        .orderBy(desc(commsMessages.createdAt))
        .limit(input.limit);
    }),

  send: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      channel: z.enum(channels).default("GENERAL"),
      content: z.string().min(1).max(2000),
      priority: z.enum(priorities).default("ROUTINE"),
      messageType: z.enum(["TEXT","ALERT","ICS_213","STATUS_UPDATE"]).default("TEXT"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(commsMessages).values({
        incidentId: input.incidentId,
        senderId: ctx.user.id,
        channel: input.channel,
        content: input.content,
        priority: input.priority,
        messageType: input.messageType,
      });
      const rows = await db.select().from(commsMessages)
        .where(eq(commsMessages.incidentId, input.incidentId))
        .orderBy(desc(commsMessages.createdAt)).limit(1);
      return rows[0];
    }),

  acknowledge: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(commsMessages).set({
        acknowledgedById: ctx.user.id,
        acknowledgedAt: new Date(),
      } as any).where(eq(commsMessages.id, input.id));
      return { success: true };
    }),
});
