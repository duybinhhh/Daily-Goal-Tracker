import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getLevelFromXP } from "../lib/xpSystem";

const MAX_XP_AWARD = 2000;

export const awardXP = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const amount = Number(req.body?.amount);
    const reason = String(req.body?.reason || "").trim();

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AppError("XP amount must be a positive integer.", 400);
    }

    if (amount > MAX_XP_AWARD) {
      throw new AppError("XP amount is too large.", 400);
    }

    if (!reason) {
      throw new AppError("XP reason is required.", 400);
    }

    const user = await db.users.findUnique({ id: userId });
    if (!user) throw new AppError("User not found.", 404);

    const previousLevel = user.level ?? 1;
    const currentXP = user.total_xp ?? 0;
    const nextXP = currentXP + amount;
    const nextLevel = getLevelFromXP(nextXP).level;

    const updatedUser = await db.users.update(userId, {
      total_xp: nextXP,
      level: nextLevel,
    });

    res.status(200).json({
      success: true,
      reason,
      awarded_xp: amount,
      total_xp: updatedUser.total_xp ?? nextXP,
      level: updatedUser.level ?? nextLevel,
      previous_level: previousLevel,
    });
  } catch (error) {
    next(error);
  }
};

