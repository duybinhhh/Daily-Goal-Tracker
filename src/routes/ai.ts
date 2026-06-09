import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getAIReport, postAIChat } from "../controllers/aiController";

const router = Router();

router.use(authMiddleware as any);

router.post("/report", getAIReport);
router.post("/chat", postAIChat);

export default router;

