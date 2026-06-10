import { Router } from "express";
import { searchUsers, followUser, unfollowUser, getActivityFeed, getFollowStats, updatePrivacySetting } from "../controllers/friendsController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/search", searchUsers as any);
router.post("/follow", followUser as any);
router.delete("/follow", unfollowUser as any);
router.get("/feed", getActivityFeed as any);
router.get("/stats", getFollowStats as any);
router.patch("/privacy", updatePrivacySetting as any);

export default router;
