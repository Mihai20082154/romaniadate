import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  age: integer("age").notNull(),
  ageCategory: text("age_category").notNull().default("adult"),
  gender: text("gender").notNull(),
  preference: text("preference").notNull().default("both"),
  city: text("city").notNull(),
  bio: text("bio"),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  diamonds: integer("diamonds").notNull().default(100),
  totalDiamondsEarned: integer("total_diamonds_earned").notNull().default(100),
  totalDiamondsSpent: integer("total_diamonds_spent").notNull().default(0),
  isVip: boolean("is_vip").notNull().default(false),
  vipExpiresAt: timestamp("vip_expires_at"),
  isVerified: boolean("is_verified").notNull().default(false),
  isPrivate: boolean("is_private").notNull().default(false),
  isBoosted: boolean("is_boosted").notNull().default(false),
  boostExpiresAt: timestamp("boost_expires_at"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  rank: text("rank"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: integer("referred_by"),
  isOnline: boolean("is_online").notNull().default(false),
  lastSeen: timestamp("last_seen"),
  lastLoginDate: text("last_login_date"),
  likesGivenToday: integer("likes_given_today").notNull().default(0),
  superlikesGivenToday: integer("superlikes_given_today").notNull().default(0),
  lastSwipeResetDate: text("last_swipe_reset_date"),
  notifyNewMatch: boolean("notify_new_match").notNull().default(true),
  notifyNewMessage: boolean("notify_new_message").notNull().default(true),
  notifyDiamonds: boolean("notify_diamonds").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
