// src/routes/stats.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getDashboardStats, getHistory } from "../controllers/statsController";

const router = Router();

// Secure stats router
router.use(authMiddleware as any);

router.get("/dashboard", getDashboardStats);
router.get("/history", getHistory);

export default router;
