import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blocksTable = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull(),
  blockedId: integer("blocked_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBlockSchema = createInsertSchema(blocksTable).omit({ id: true, createdAt: true });
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocksTable.$inferSelect;
