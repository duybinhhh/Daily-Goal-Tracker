// src/routes/goals.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getGoals,
  createGoal,
  getGoalById,
  updateGoal,
  deleteGoal,
  completeGoal,
  deleteLog,
  bulkArchiveGoals,
  bulkPauseGoals,
  bulkDeleteGoals,
} from "../controllers/goalController";

const router = Router();

// Apply auth middleware globally on Goals
router.use(authMiddleware as any);

router.get("/", getGoals);
router.post("/", createGoal);
router.put("/bulk/archive", bulkArchiveGoals);
router.put("/bulk/pause", bulkPauseGoals);
router.post("/bulk/delete", bulkDeleteGoals);
router.get("/:id", getGoalById);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);
router.post("/:id/complete", completeGoal);
router.delete("/logs/:logId", deleteLog);

export default router;
