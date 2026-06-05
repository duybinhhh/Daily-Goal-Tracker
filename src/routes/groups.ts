// src/routes/groups.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getGroups,
  createGroup,
  getGroupById,
  joinGroup,
  leaveGroup,
  deleteGroup,
} from "../controllers/groupController";

const router = Router();

// Apply auth middleware globally on groups
router.use(authMiddleware as any);

router.get("/", getGroups);
router.post("/", createGroup);
router.get("/:id", getGroupById);
router.post("/:id/join", joinGroup);
router.post("/:id/leave", leaveGroup);
router.delete("/:id", deleteGroup);

export default router;
