import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { awardXP } from "../controllers/xpController";

const router = Router();

router.use(authMiddleware as any);
router.post("/award", awardXP);

export default router;

