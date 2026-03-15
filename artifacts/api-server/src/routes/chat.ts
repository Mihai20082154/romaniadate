import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, matchesTable } from "@workspace/db";
import { eq, and, or, desc, lt } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";
import { addXp, createNotification } from "../lib/helpers.js";
import { usersTable } from "@workspace/db";

const router = Router();

// Get messages for a match
router.get("/:matchId/messages", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const userId = (req as any).user.userId;
    const { before } = req.query;

    // Verify user is part of match
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

    let query = db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.matchId, matchId))
      .orderBy(desc(messagesTable.createdAt))
      .limit(50);

    const messages = await query;

    // Mark as read
    await db
      .update(messagesTable)
      .set({ isRead: true, isDelivered: true })
      .where(
        and(
          eq(messagesTable.matchId, matchId),
          eq(messagesTable.isRead, false)
        )
      );

    res.json(
      messages
        .reverse()
        .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))
    );
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send message
router.post("/:matchId/messages", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const userId = (req as any).user.userId;
    const { content, type = "text" } = req.body;

    // Verify user is part of match
    const [match] = await db
      .select()
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.id, matchId),
          or(eq(matchesTable.user1Id, userId), eq(matchesTable.user2Id, userId)),
          eq(matchesTable.isActive, true)
        )
      )
      .limit(1);

    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const [msg] = await db
      .insert(messagesTable)
      .values({
        matchId,
        senderId: userId,
        content,
        type,
        isDelivered: true,
      })
      .returning();

    await addXp(userId, 2);

    // Notify other user
    const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;
    const [sender] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    await createNotification(otherId, "message", "New message", `${sender?.name || "Someone"}: ${content.slice(0, 50)}`, matchId);

    // Broadcast via WebSocket if available
    const wsManager = (global as any).wsManager;
    if (wsManager) {
      const msgPayload = {
        type: "new_message",
        matchId,
        message: { ...msg, createdAt: msg.createdAt.toISOString() },
      };
      wsManager.sendToUser(otherId, msgPayload);
    }

    res.status(201).json({ ...msg, createdAt: msg.createdAt.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
