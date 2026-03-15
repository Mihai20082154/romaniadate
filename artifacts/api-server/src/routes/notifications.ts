import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

// Get notifications
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const notifs = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    res.json(notifs.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark one read
router.post("/:notificationId/read", authMiddleware, async (req, res) => {
  try {
    const notifId = parseInt(req.params.notificationId);
    const userId = (req as any).user.userId;
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, notifId));
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark all read
router.post("/read-all", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, userId));
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
