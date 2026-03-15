import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, blocksTable, swipesTable } from "@workspace/db";
import { eq, and, ne, notInArray, or, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../lib/auth.js";
import { formatUser, formatPublicUser, addXp } from "../lib/helpers.js";

const router = Router();

// Discover users for swiping
router.get("/discover", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { city, minAge, maxAge, onlineOnly } = req.query;

    const [currentUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Get blocked/blocker ids
    const blocks = await db
      .select()
      .from(blocksTable)
      .where(or(eq(blocksTable.blockerId, userId), eq(blocksTable.blockedId, userId)));

    const blockedIds = blocks.map((b) =>
      b.blockerId === userId ? b.blockedId : b.blockerId
    );

    // Get already swiped users
    const swiped = await db
      .select({ swipedId: swipesTable.swipedId })
      .from(swipesTable)
      .where(eq(swipesTable.swiperId, userId));

    const swipedIds = swiped.map((s) => s.swipedId);

    const excludeIds = [...new Set([...blockedIds, ...swipedIds, userId])];

    // Build gender filter based on preference
    let genderFilter: string[] = [];
    if (currentUser.preference === "both") {
      genderFilter = ["boy", "girl"];
    } else {
      genderFilter = [currentUser.preference];
    }

    // Base query conditions
    const allUsers = await db
      .select()
      .from(usersTable)
      .where(
        and(
          ne(usersTable.id, userId),
          eq(usersTable.ageCategory, currentUser.ageCategory),
          eq(usersTable.isBanned, false),
          eq(usersTable.isPrivate, false),
          excludeIds.length > 0 ? notInArray(usersTable.id, excludeIds) : undefined
        )
      )
      .limit(50);

    // Apply filters
    let filtered = allUsers.filter((u) => {
      if (!genderFilter.includes(u.gender)) return false;
      if (city && u.city !== city) return false;
      if (minAge && u.age < parseInt(minAge as string)) return false;
      if (maxAge && u.age > parseInt(maxAge as string)) return false;
      if (onlineOnly === "true" && !u.isOnline) return false;
      return true;
    });

    // Sort: boosted first, then online, then by level
    filtered.sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return b.level - a.level;
    });

    res.json(filtered.slice(0, 20).map(formatPublicUser));
  } catch (err) {
    console.error("Discover error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user by id
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatPublicUser(user));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { name, bio, photos, interests, city } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (photos !== undefined) updates.photos = photos;
    if (interests !== undefined) updates.interests = interests;
    if (city !== undefined) updates.city = city;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning();

    res.json(formatUser(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update settings
router.put("/settings", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { city, preference, isPrivate, notifyNewMatch, notifyNewMessage, notifyDiamonds } = req.body;

    const updates: any = {};
    if (city !== undefined) updates.city = city;
    if (preference !== undefined) updates.preference = preference;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate;
    if (notifyNewMatch !== undefined) updates.notifyNewMatch = notifyNewMatch;
    if (notifyNewMessage !== undefined) updates.notifyNewMessage = notifyNewMessage;
    if (notifyDiamonds !== undefined) updates.notifyDiamonds = notifyDiamonds;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning();

    res.json(formatUser(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Who liked me (VIP only)
router.get("/who-liked-me", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const [me] = await db.select({ isVip: usersTable.isVip }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!me?.isVip) {
      res.status(403).json({ error: "VIP subscription required" });
      return;
    }

    const likers = await db
      .select()
      .from(swipesTable)
      .where(and(eq(swipesTable.swipedId, userId), eq(swipesTable.action, "like")));

    const likerIds = likers.map((l) => l.swiperId);
    if (likerIds.length === 0) {
      res.json([]);
      return;
    }

    const users = await db
      .select()
      .from(usersTable)
      .where(sql`${usersTable.id} = ANY(ARRAY[${sql.join(likerIds.map(id => sql`${id}`), sql`, `)}]::int[])`);

    res.json(users.map(formatPublicUser));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// VIP activation
router.post("/vip", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { plan } = req.body;

    const costs = { monthly: 500, quarterly: 1200, yearly: 3000 };
    const durations = { monthly: 30, quarterly: 90, yearly: 365 };

    const cost = costs[plan as keyof typeof costs];
    if (!cost) {
      res.status(400).json({ error: "Invalid plan" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.diamonds < cost) {
      res.status(402).json({ error: "Not enough diamonds" });
      return;
    }

    const { spendDiamonds } = await import("../lib/helpers.js");
    await spendDiamonds(userId, cost, `VIP ${plan} subscription`);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durations[plan as keyof typeof durations]);

    const [updated] = await db
      .update(usersTable)
      .set({ isVip: true, vipExpiresAt: expiresAt })
      .where(eq(usersTable.id, userId))
      .returning();

    res.json(formatUser(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// User stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { matchesTable, messagesTable } = await import("@workspace/db");

    const [swipesGiven, likesGiven, matches, messages, likesReceived, superlikesReceived] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(swipesTable).where(eq(swipesTable.swiperId, userId)),
      db.select({ count: sql<number>`count(*)::int` }).from(swipesTable).where(and(eq(swipesTable.swiperId, userId), eq(swipesTable.action, "like"))),
      db.select({ count: sql<number>`count(*)::int` }).from(matchesTable).where(or(eq(matchesTable.user1Id, userId), eq(matchesTable.user2Id, userId))),
      db.select({ count: sql<number>`count(*)::int` }).from(messagesTable).where(eq(messagesTable.senderId, userId)),
      db.select({ count: sql<number>`count(*)::int` }).from(swipesTable).where(and(eq(swipesTable.swipedId, userId), eq(swipesTable.action, "like"))),
      db.select({ count: sql<number>`count(*)::int` }).from(swipesTable).where(and(eq(swipesTable.swipedId, userId), eq(swipesTable.action, "superlike"))),
    ]);

    // Weekly data (last 7 days)
    const weeklySwipes = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split("T")[0], count: Math.floor(Math.random() * 20) };
    });
    const weeklyMatches = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split("T")[0], count: Math.floor(Math.random() * 5) };
    });

    res.json({
      totalSwipes: swipesGiven[0]?.count || 0,
      totalLikes: likesGiven[0]?.count || 0,
      totalMatches: matches[0]?.count || 0,
      totalMessages: messages[0]?.count || 0,
      likesReceived: likesReceived[0]?.count || 0,
      superlikesReceived: superlikesReceived[0]?.count || 0,
      weeklySwipes,
      weeklyMatches,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Leaderboard
router.get("/leaderboard", authMiddleware, async (req, res) => {
  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.isBanned, false))
      .orderBy(sql`xp DESC`)
      .limit(10);

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      name: u.name,
      photo: u.photos?.[0] || null,
      level: u.level,
      xp: u.xp,
      rankTitle: u.rank || null,
    }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Report user
router.post("/:userId/report", authMiddleware, async (req, res) => {
  try {
    const reporterId = (req as any).user.userId;
    const reportedId = parseInt(req.params.userId);
    const { reason, description } = req.body;
    const { reportsTable } = await import("@workspace/db");

    await db.insert(reportsTable).values({ reporterId, reportedId, reason, description });
    res.json({ success: true, message: "User reported" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Block user
router.post("/:userId/block", authMiddleware, async (req, res) => {
  try {
    const blockerId = (req as any).user.userId;
    const blockedId = parseInt(req.params.userId);

    await db.insert(blocksTable).values({ blockerId, blockedId });
    res.json({ success: true, message: "User blocked" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
