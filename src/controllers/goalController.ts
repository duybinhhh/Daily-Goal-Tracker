// src/controllers/goalController.ts
import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

// Helper for date differences in calendar days
const getCalendarDaysDiff = (dateStr1: string, dateStr2: string): number => {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / msPerDay);
};

export const getGoals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const goals = await db.goals.findMany({ user_id: userId });
    
    // Attach streaks to each goal
    const goalsWithStreaks = await Promise.all(
      goals.map(async (goal) => {
        const streak = await db.streaks.findUnique({ goal_id: goal.id });
        return {
          ...goal,
          streak: streak || { current_streak: 0, longest_streak: 0, last_completed_at: null },
        };
      })
    );

    res.status(200).json({
      success: true,
      goals: goalsWithStreaks,
    });
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { title, description, category, target_count, frequency, due_date } = req.body;

    if (!title || !category) {
      throw new AppError("Goal title and category fields are required properties.", 400);
    }

    const goalTarget = target_count ? parseInt(target_count, 10) : 1;
    if (isNaN(goalTarget) || goalTarget <= 0) {
      throw new AppError("Target count must be a positive integer greater than zero.", 400);
    }

    const newGoal = await db.goals.create({
      user_id: userId,
      title,
      description: description || null,
      category,
      target_count: goalTarget,
      frequency: frequency || "daily",
      due_date: due_date || null,
    });

    // Seed default streak record for this goal
    const newStreak = await db.streaks.create({
      user_id: userId,
      goal_id: newGoal.id,
    });

    res.status(201).json({
      success: true,
      goal: {
        ...newGoal,
        streak: newStreak,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getGoalById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found or access denied.", 404);
    }

    const streak = await db.streaks.findUnique({ goal_id: goal.id });
    const logs = await db.logs.findMany({ goal_id: goal.id });

    res.status(200).json({
      success: true,
      goal: {
        ...goal,
        streak: streak || { current_streak: 0, longest_streak: 0, last_completed_at: null },
        logs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found or access denied.", 404);
    }

    const { title, description, category, target_count, current_count, frequency, status, due_date } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (frequency !== undefined) updates.frequency = frequency;
    if (status !== undefined) updates.status = status;
    if (due_date !== undefined) updates.due_date = due_date;

    if (target_count !== undefined) {
      const parsed = parseInt(target_count, 10);
      if (isNaN(parsed) || parsed <= 0) throw new AppError("Target count must be a positive number.", 400);
      updates.target_count = parsed;
    }

    if (current_count !== undefined) {
      const parsed = parseInt(current_count, 10);
      if (isNaN(parsed) || parsed < 0) throw new AppError("Current progress cannot be negative.", 400);
      updates.current_count = parsed;
    }

    const updatedGoal = await db.goals.update(id, updates);
    const streak = await db.streaks.findUnique({ goal_id: goal.id });

    res.status(200).json({
      success: true,
      goal: {
        ...updatedGoal,
        streak: streak || { current_streak: 0, longest_streak: 0, last_completed_at: null },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found or access denied.", 404);
    }

    await db.goals.delete(id);

    res.status(200).json({
      success: true,
      message: "Goal successfully deleted.",
    });
  } catch (error) {
    next(error);
  }
};

// Complete progress and manage streaks
export const completeGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { note } = req.body;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found.", 404);
    }

    const todayStr = new Date().toISOString();
    
    // 1. Log progress
    const newLog = await db.logs.create({
      goal_id: goal.id,
      user_id: userId,
      completed_at: todayStr,
      note: note || null,
    });

    // 2. Increment target count
    const updatedCount = goal.current_count + 1;
    const totalTarget = goal.target_count;
    
    let isFullyCompletedToday = updatedCount >= totalTarget;
    
    // Update count in database
    const updatedGoal = await db.goals.update(goal.id, {
      current_count: updatedCount,
      status: isFullyCompletedToday ? "completed" : "active"
    });

    // 3. Streak Engine logic
    let streak = await db.streaks.findUnique({ goal_id: goal.id });
    if (!streak) {
      streak = await db.streaks.create({ user_id: userId, goal_id: goal.id });
    }

    let isStreakUpdated = false;
    let newCurrentStreak = streak.current_streak;
    let newLongestStreak = streak.longest_streak;

    if (isFullyCompletedToday) {
      if (!streak.last_completed_at) {
        // First completion ever
        newCurrentStreak = 1;
        newLongestStreak = 1;
        isStreakUpdated = true;
      } else {
        const daysDiff = getCalendarDaysDiff(streak.last_completed_at, todayStr);
        
        if (daysDiff === 1) {
          // Consecutive daily completion
          newCurrentStreak = streak.current_streak + 1;
          newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
          isStreakUpdated = true;
        } else if (daysDiff > 1) {
          // Broken streak
          newCurrentStreak = 1;
          isStreakUpdated = true;
        } else if (daysDiff <= 0) {
          // Already completed full target earlier today, do not increment streak again
          isStreakUpdated = false;
        }
      }
    }

    const updatedStreak = await db.streaks.upsert(goal.id, userId, {
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_completed_at: isFullyCompletedToday ? todayStr : streak.last_completed_at,
    });

    // 4. Milestone Notifications
    if (isStreakUpdated && newCurrentStreak > 0) {
      const milestoneStreaks = [3, 7, 14, 30, 100];
      if (milestoneStreaks.includes(newCurrentStreak)) {
        await db.notifications.create({
          user_id: userId,
          type: "milestone",
          message: `🔥 Amazing! You've reached a ${newCurrentStreak}-day streak for goal: "${goal.title}"! Keep it up!`,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: isFullyCompletedToday ? "Goal target reached today!" : "Progress logged successfully.",
      goal: {
        ...updatedGoal,
        streak: updatedStreak,
      },
      log: newLog,
    });
  } catch (error) {
    next(error);
  }
};
