import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // text, image, emoji
  isRead: boolean("is_read").notNull().default(false),
  isDelivered: boolean("is_delivered").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
