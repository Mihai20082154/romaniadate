import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../lib/auth.js";

const router = Router();

// Get all reports
router.get("/reports", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reports = await db
      .select()
      .from(reportsTable)
      .orderBy(desc(reportsTable.createdAt))
      .limit(100);

    const enriched = await Promise.all(
      reports.map(async (r) => {
        const [reporter] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.reporterId)).limit(1);
        const [reported] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.reportedId)).limit(1);
        return {
          ...r,
          createdAt: r.createdAt.toISOString(),
          reporterName: reporter?.name || "Unknown",
          reportedName: reported?.name || "Unknown",
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Resolve report
router.post("/reports/:reportId/resolve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const { action, notes } = req.body;

    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, reportId)).limit(1);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    if (action === "ban") {
      await db.update(usersTable).set({ isBanned: true }).where(eq(usersTable.id, report.reportedId));
    }

    await db
      .update(reportsTable)
      .set({ status: action === "dismiss" ? "dismissed" : "resolved", adminNotes: notes })
      .where(eq(reportsTable.id, reportId));

    res.json({ success: true, message: "Report resolved" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
