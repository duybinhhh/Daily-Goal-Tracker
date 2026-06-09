import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

function getLocalDateString(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
  } catch {
    return date.toISOString().split("T")[0];
  }
}

export const getFreezeTokens = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized.", 401);

    const record = await db.freezeTokens.findOrCreate(userId);
    res.json({ success: true, tokens_left: record.tokens_left, month_year: record.month_year });
  } catch (err) {
    next(err);
  }
};

export const activateFreeze = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized.", 401);

    const { goal_id } = req.body;
    if (!goal_id) throw new AppError("goal_id is required.", 400);

    const goals = await db.goals.findMany({ user_id: userId });
    const goal = goals.find((g) => g.id === goal_id);
    if (!goal) throw new AppError("Goal not found.", 404);

    const tokenRecord = await db.freezeTokens.findOrCreate(userId);
    if (tokenRecord.tokens_left <= 0) {
      throw new AppError("You have used all 3 Freeze Tokens this month. Tokens reset on the 1st of next month.", 400);
    }

    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const todayStr = getLocalDateString(new Date(), timezone);

    const existing = await db.streakFreezes.findByDate(goal_id, todayStr);
    if (existing) throw new AppError("This goal is already frozen for today.", 400);

    if (goal.current_count >= goal.target_count) {
      throw new AppError("This goal is already completed today, so a Freeze Token is not needed.", 400);
    }

    await db.streakFreezes.create({ user_id: userId, goal_id, frozen_date: todayStr });
    await db.freezeTokens.update(userId, { tokens_left: tokenRecord.tokens_left - 1 });

    res.json({ success: true, tokens_left: tokenRecord.tokens_left - 1, frozen_date: todayStr });
  } catch (err) {
    next(err);
  }
};

export const getFreezeDates = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized.", 401);

    const { goal_id, all } = req.query;
    if (all !== "true" && !goal_id) throw new AppError("goal_id is required unless all=true.", 400);

    const where = all === "true" ? { user_id: userId } : { goal_id: goal_id as string };
    const freezes = await db.streakFreezes.findMany(where);
    res.json({ success: true, frozen_dates: freezes.map((f) => f.frozen_date) });
  } catch (err) {
    next(err);
  }
};

