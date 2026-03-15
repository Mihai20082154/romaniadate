import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, usersTable, messagesTable } from "@workspace/db";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";
import { formatPublicUser } from "../lib/helpers.js";

const router = Router();

// Get all matches
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const matches = await db
      .select()
      .from(matchesTable)
      .where(
        and(
          or(eq(matchesTable.user1Id, userId), eq(matchesTable.user2Id, userId)),
          eq(matchesTable.isActive, true)
        )
      )
      .orderBy(desc(matchesTable.createdAt));

    const result = await Promise.all(
      matches.map(async (match) => {
        const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;

        const [otherUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, otherId))
          .limit(1);

        const [lastMsg] = await db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.matchId, match.id))
          .orderBy(desc(messagesTable.createdAt))
          .limit(1);

        const [unreadResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messagesTable)
          .where(
            and(
              eq(messagesTable.matchId, match.id),
              eq(messagesTable.isRead, false),
              sql`${messagesTable.sender_id} != ${userId}`
            )
          );

        return {
          id: match.id,
          user: otherUser ? formatPublicUser(otherUser) : null,
          createdAt: match.createdAt.toISOString(),
          lastMessage: lastMsg
            ? {
                ...lastMsg,
                createdAt: lastMsg.createdAt.toISOString(),
              }
            : undefined,
          unreadCount: unreadResult?.count || 0,
        };
      })
    );

    res.json(result.filter((m) => m.user !== null));
  } catch (err) {
    console.error("Get matches error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Unmatch
router.delete("/:matchId", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const userId = (req as any).user.userId;

    const [match] = await db
      .select()
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.id, matchId),
          or(eq(matchesTable.user1Id, userId), eq(matchesTable.user2Id, userId))
        )
      )
      .limit(1);

    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    await db.update(matchesTable).set({ isActive: false }).where(eq(matchesTable.id, matchId));

    res.json({ success: true, message: "Unmatched successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
