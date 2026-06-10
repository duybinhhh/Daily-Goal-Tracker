// src/routes/groups.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getGroups,
  createGroup,
  getGroupById,
  joinGroup,
  leaveGroup,
  removeMember,
  deleteGroup,
  createInviteCode,
  getGroupByInviteCode,
  joinGroupByInviteCode,
} from "../controllers/groupController";
import {
  getGroupMessages,
  sendGroupMessage,
  toggleReaction,
  deleteMessage,
} from "../controllers/groupChatController";

const router = Router();

// Invite preview must stay public so users can open an invite before logging in.
router.get("/invite/:inviteCode", getGroupByInviteCode);

// Protected group actions
router.use(authMiddleware as any);

router.get("/", getGroups);
router.post("/", createGroup);
router.post("/join/:inviteCode", joinGroupByInviteCode);
router.get("/:id", getGroupById);
router.post("/:id/invite", createInviteCode);
router.post("/:id/join", joinGroup);
router.post("/:id/leave", leaveGroup);
router.delete("/:id/members/:userId", removeMember);
router.delete("/:id", deleteGroup);

// Group Chat Routes
router.get("/:groupId/messages", getGroupMessages);
router.post("/:groupId/messages", sendGroupMessage);
router.post("/:groupId/messages/:messageId/reactions", toggleReaction);
router.delete("/:groupId/messages/:messageId", deleteMessage);

export default router;
