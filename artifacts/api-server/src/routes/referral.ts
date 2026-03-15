import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, diamondTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/info", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const [user] = await db
      .select({ referralCode: usersTable.referralCode })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const referredUsers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.referredBy, userId));

    const referredCount = referredUsers[0]?.count || 0;

    const earningsResult = await db
      .select({ total: sql<number>`coalesce(sum(${diamondTransactionsTable.amount}), 0)::int` })
      .from(diamondTransactionsTable)
      .where(
        sql`${diamondTransactionsTable.user_id} = ${userId} AND ${diamondTransactionsTable.reason} LIKE 'Referral%'`
      );

    const totalEarned = earningsResult[0]?.total || 0;

    const nextMilestone = (Math.floor(referredCount / 10) + 1) * 10;
    const progressToNext = referredCount % 10;

    const host = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}`;
    const referralLink = `${host}/register?ref=${user.referralCode}`;

    res.json({
      referralCode: user.referralCode,
      referralLink,
      referredCount,
      totalEarned,
      nextMilestone,
      progressToNext,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
