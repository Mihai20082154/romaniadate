import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, swipesTable, matchesTable } from "@workspace/db";
import { eq, and, or, sql } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";
import {
  spendDiamonds,
  awardDiamonds,
  addXp,
  createNotification,
  formatPublicUser,
} from "../lib/helpers.js";

const router = Router();

async function checkAndCreateMatch(user1Id: number, user2Id: number): Promise<number | null> {
  // Check if user2 has liked user1
  const [reverseSwipe] = await db
    .select()
    .from(swipesTable)
    .where(
      and(
        eq(swipesTable.swiperId, user2Id),
        eq(swipesTable.swipedId, user1Id),
        or(eq(swipesTable.action, "like"), eq(swipesTable.action, "superlike"))
      )
    )
    .limit(1);

  if (!reverseSwipe) return null;

  // Check if match already exists
  const [existingMatch] = await db
    .select()
    .from(matchesTable)
    .where(
      or(
        and(eq(matchesTable.user1Id, user1Id), eq(matchesTable.user2Id, user2Id)),
        and(eq(matchesTable.user1Id, user2Id), eq(matchesTable.user2Id, user1Id))
      )
    )
    .limit(1);

  if (existingMatch) return existingMatch.id;

  const [match] = await db
    .insert(matchesTable)
    .values({ user1Id, user2Id })
    .returning();

  // Notify both users
  const [u1, u2] = await Promise.all([
    db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, user1Id)).limit(1),
    db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, user2Id)).limit(1),
  ]);

  await Promise.all([
    createNotification(user1Id, "match", "New Match!", `You and ${u2[0]?.name || "someone"} liked each other!`, match.id),
    createNotification(user2Id, "match", "New Match!", `You and ${u1[0]?.name || "someone"} liked each other!`, match.id),
    awardDiamonds(user1Id, 20, "Match bonus"),
    awardDiamonds(user2Id, 20, "Match bonus"),
    addXp(user1Id, 50),
    addXp(user2Id, 50),
  ]);

  return match.id;
}

async function resetDailySwipesIfNeeded(userId: number, user: any): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  if (user.lastSwipeResetDate !== today) {
    await db
      .update(usersTable)
      .set({ likesGivenToday: 0, superlikesGivenToday: 0, lastSwipeResetDate: today })
      .where(eq(usersTable.id, userId));
  }
}

// Like
router.post("/like", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { targetUserId } = req.body;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await resetDailySwipesIfNeeded(userId, user);

    const maxLikes = user.isVip ? Infinity : 20;
    if (!user.isVip && user.likesGivenToday >= maxLikes) {
      res.status(429).json({ error: "Daily like limit reached. Upgrade to VIP for unlimited likes!" });
      return;
    }

    const cost = user.isVip ? 0 : 10;
    if (cost > 0) {
      const success = await spendDiamonds(userId, cost, "Like");
      if (!success) {
        res.status(402).json({ error: "Not enough diamonds" });
        return;
      }
    }

    // Record swipe
    await db.insert(swipesTable).values({ swiperId: userId, swipedId: targetUserId, action: "like" });

    // Update like count
    await db
      .update(usersTable)
      .set({ likesGivenToday: sql`likes_given_today + 1` })
      .where(eq(usersTable.id, userId));

    await addXp(userId, 5);

    // Notify target
    const [me] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    await createNotification(targetUserId, "match", "Someone liked you!", `${me?.name || "Someone"} liked your profile`, userId);

    // Check for match
    const matchId = await checkAndCreateMatch(userId, targetUserId);

    const [updatedUser] = await db.select({ diamonds: usersTable.diamonds }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    res.json({
      success: true,
      isMatch: matchId !== null,
      matchId,
      diamondsSpent: cost,
      diamondsRemaining: updatedUser?.diamonds || 0,
      message: matchId ? "It's a match!" : null,
    });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Dislike
router.post("/dislike", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { targetUserId } = req.body;

    await db.insert(swipesTable).values({ swiperId: userId, swipedId: targetUserId, action: "dislike" });
    await addXp(userId, 1);

    const [user] = await db.select({ diamonds: usersTable.diamonds }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    res.json({
      success: true,
      isMatch: false,
      matchId: null,
      diamondsSpent: 0,
      diamondsRemaining: user?.diamonds || 0,
      message: null,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Superlike
router.post("/superlike", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { targetUserId } = req.body;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await resetDailySwipesIfNeeded(userId, user);

    const maxSuperlikes = user.isVip ? 10 : 3;
    if (user.superlikesGivenToday >= maxSuperlikes) {
      res.status(429).json({ error: "Daily superlike limit reached" });
      return;
    }

    await db.insert(swipesTable).values({ swiperId: userId, swipedId: targetUserId, action: "superlike" });
    await db
      .update(usersTable)
      .set({ superlikesGivenToday: sql`superlikes_given_today + 1` })
      .where(eq(usersTable.id, userId));

    await addXp(userId, 10);

    const [me] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    await createNotification(targetUserId, "superlike", "Super Like!", `${me?.name || "Someone"} super liked your profile! ⭐`, userId);

    const matchId = await checkAndCreateMatch(userId, targetUserId);

    const [updatedUser] = await db.select({ diamonds: usersTable.diamonds }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    res.json({
      success: true,
      isMatch: matchId !== null,
      matchId,
      diamondsSpent: 0,
      diamondsRemaining: updatedUser?.diamonds || 0,
      message: matchId ? "It's a match!" : "Superlike sent!",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Rewind
router.post("/rewind", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const cost = user?.isVip ? 0 : 30;

    if (cost > 0) {
      const success = await spendDiamonds(userId, cost, "Rewind");
      if (!success) {
        res.status(402).json({ error: "Not enough diamonds. Need 30 diamonds to rewind." });
        return;
      }
    }

    // Delete the last swipe
    const [lastSwipe] = await db
      .select()
      .from(swipesTable)
      .where(eq(swipesTable.swiperId, userId))
      .orderBy(sql`created_at DESC`)
      .limit(1);

    if (lastSwipe) {
      await db.delete(swipesTable).where(eq(swipesTable.id, lastSwipe.id));
    }

    const [updatedUser] = await db.select({ diamonds: usersTable.diamonds }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    res.json({
      success: true,
      isMatch: false,
      matchId: null,
      diamondsSpent: cost,
      diamondsRemaining: updatedUser?.diamonds || 0,
      message: "Previous profile restored",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Boost
router.post("/boost", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const cost = user?.isVip ? 0 : 50;

    if (cost > 0) {
      const success = await spendDiamonds(userId, cost, "Profile boost");
      if (!success) {
        res.status(402).json({ error: "Not enough diamonds" });
        return;
      }
    }

    const boostExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await db
      .update(usersTable)
      .set({ isBoosted: true, boostExpiresAt })
      .where(eq(usersTable.id, userId));

    res.json({
      success: true,
      boostExpiresAt: boostExpiresAt.toISOString(),
      diamondsSpent: cost,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
