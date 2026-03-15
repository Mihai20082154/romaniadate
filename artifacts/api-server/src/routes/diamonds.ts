import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, diamondTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";
import { awardDiamonds } from "../lib/helpers.js";

const router = Router();

// Get diamond balance
router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const [user] = await db
      .select({
        diamonds: usersTable.diamonds,
        totalDiamondsEarned: usersTable.totalDiamondsEarned,
        totalDiamondsSpent: usersTable.totalDiamondsSpent,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      balance: user.diamonds,
      totalEarned: user.totalDiamondsEarned,
      totalSpent: user.totalDiamondsSpent,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Claim daily login
router.post("/daily-login", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const today = new Date().toISOString().split("T")[0];

    const [user] = await db
      .select({ lastLoginDate: usersTable.lastLoginDate })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user?.lastLoginDate === today) {
      res.status(409).json({ error: "Daily login reward already claimed today" });
      return;
    }

    const reward = 50;
    await awardDiamonds(userId, reward, "Daily login reward");
    await db.update(usersTable).set({ lastLoginDate: today }).where(eq(usersTable.id, userId));

    const [transaction] = await db
      .select()
      .from(diamondTransactionsTable)
      .where(eq(diamondTransactionsTable.userId, userId))
      .orderBy(desc(diamondTransactionsTable.createdAt))
      .limit(1);

    res.json({
      id: transaction?.id || 0,
      amount: reward,
      type: "earn",
      reason: "Daily login reward",
      createdAt: transaction?.createdAt?.toISOString() || new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get transaction history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const transactions = await db
      .select()
      .from(diamondTransactionsTable)
      .where(eq(diamondTransactionsTable.userId, userId))
      .orderBy(desc(diamondTransactionsTable.createdAt))
      .limit(50);

    res.json(
      transactions.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))
    );
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
