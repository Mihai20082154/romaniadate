import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, authMiddleware } from "../lib/auth.js";
import {
  calculateAge,
  getAgeCategory,
  generateReferralCode,
  getRank,
  awardDiamonds,
  formatUser,
} from "../lib/helpers.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, birthDate, gender, preference, city, referralCode } = req.body;

    if (!email || !password || !name || !birthDate || !gender || !preference || !city) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const age = calculateAge(birthDate);
    if (age < 14) {
      res.status(400).json({ error: "Minimum age is 14 years" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const ageCategory = getAgeCategory(age);
    const myReferralCode = generateReferralCode();
    const rank = getRank(1);

    let referrerId: number | undefined;
    if (referralCode) {
      const referrer = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.referralCode, referralCode))
        .limit(1);
      if (referrer.length > 0) {
        referrerId = referrer[0].id;
      }
    }

    const [newUser] = await db
      .insert(usersTable)
      .values({
        email,
        passwordHash,
        name,
        birthDate,
        age,
        ageCategory,
        gender,
        preference,
        city,
        diamonds: 100,
        totalDiamondsEarned: 100,
        referralCode: myReferralCode,
        referredBy: referrerId,
        rank,
        isOnline: true,
      })
      .returning();

    // Award referral diamonds if valid referral
    if (referrerId) {
      const { usersTable: ut, diamondTransactionsTable } = await import("@workspace/db");
      const { sql } = await import("drizzle-orm");

      // Count total referrals for this referrer
      const referrals = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.referredBy, referrerId));

      const totalReferrals = referrals.length;

      // Every 10 referrals, award 500 diamonds
      if (totalReferrals % 10 === 0) {
        await awardDiamonds(referrerId, 500, "Referral milestone: 10 friends invited");
      }
    }

    const token = signToken({ userId: newUser.id, email: newUser.email, isAdmin: false });

    res.status(201).json({ token, user: formatUser(newUser) });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (user.isBanned) {
      res.status(401).json({ error: "Account has been banned" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Update online status and last login
    const today = new Date().toISOString().split("T")[0];
    await db
      .update(usersTable)
      .set({ isOnline: true, lastSeen: new Date(), lastLoginDate: today })
      .where(eq(usersTable.id, user.id));

    const token = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });

    res.json({ token, user: formatUser({ ...user, isOnline: true }) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
