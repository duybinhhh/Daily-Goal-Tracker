import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

export const searchUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      return res.status(200).json({ users: [] });
    }

    const users = await db.friends.search(userId, query);
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const followUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const followerId = req.user?.id;
    if (!followerId) throw new AppError("Unauthorized", 401);

    const { userId: followingId } = req.body;
    if (!followingId) throw new AppError("Following User ID is required", 400);

    await db.friends.follow(followerId, followingId);
    res.status(200).json({ success: true, message: "Successfully followed user." });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const followerId = req.user?.id;
    if (!followerId) throw new AppError("Unauthorized", 401);

    const { userId: followingId } = req.body;
    if (!followingId) throw new AppError("Following User ID is required", 400);

    await db.friends.unfollow(followerId, followingId);
    res.status(200).json({ success: true, message: "Successfully unfollowed user." });
  } catch (error) {
    next(error);
  }
};

export const getActivityFeed = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const activities = await db.friends.getFeed(userId);
    res.status(200).json({ activities });
  } catch (error) {
    next(error);
  }
};

export const getFollowStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const stats = await db.friends.getStats(userId);
    res.status(200).json({ ...stats });
  } catch (error) {
    next(error);
  }
};

export const updatePrivacySetting = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const { showActivityInFeed } = req.body;
    if (showActivityInFeed === undefined) {
      throw new AppError("showActivityInFeed is required", 400);
    }

    await db.users.update(userId, { show_activity_in_feed: !!showActivityInFeed });
    res.status(200).json({ success: true, message: "Privacy setting updated." });
  } catch (error) {
    next(error);
  }
};
