import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { activateFreeze, getFreezeDates, getFreezeTokens } from "../controllers/freezeController";

const router = Router();

router.use(authMiddleware as any);

router.get("/tokens", getFreezeTokens);
router.post("/activate", activateFreeze);
router.get("/dates", getFreezeDates);

export default router;

