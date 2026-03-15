import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diamondTransactionsTable = pgTable("diamond_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // earn, spend
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDiamondTransactionSchema = createInsertSchema(diamondTransactionsTable).omit({ id: true, createdAt: true });
export type InsertDiamondTransaction = z.infer<typeof insertDiamondTransactionSchema>;
export type DiamondTransaction = typeof diamondTransactionsTable.$inferSelect;
