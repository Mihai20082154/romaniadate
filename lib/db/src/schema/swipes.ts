import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const swipesTable = pgTable("swipes", {
  id: serial("id").primaryKey(),
  swiperId: integer("swiper_id").notNull(),
  swipedId: integer("swiped_id").notNull(),
  action: text("action").notNull(), // like, dislike, superlike
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSwipeSchema = createInsertSchema(swipesTable).omit({ id: true, createdAt: true });
export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertSwipe = z.infer<typeof insertSwipeSchema>;
export type Swipe = typeof swipesTable.$inferSelect;
export type Match = typeof matchesTable.$inferSelect;
