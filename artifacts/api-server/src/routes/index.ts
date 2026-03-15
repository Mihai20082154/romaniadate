import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import swipeRouter from "./swipe.js";
import matchesRouter from "./matches.js";
import chatRouter from "./chat.js";
import diamondsRouter from "./diamonds.js";
import referralRouter from "./referral.js";
import notificationsRouter from "./notifications.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/swipe", swipeRouter);
router.use("/matches", matchesRouter);
router.use("/chat", chatRouter);
router.use("/diamonds", diamondsRouter);
router.use("/referral", referralRouter);
router.use("/notifications", notificationsRouter);
router.use("/admin", adminRouter);

export default router;
