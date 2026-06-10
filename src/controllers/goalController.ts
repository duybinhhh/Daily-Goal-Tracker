// src/controllers/goalController.ts
import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

// Helper to get local date parts (year, month, day) in timezone
const getLocalDateParts = (date: Date, timezone: string) => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === "year")!.value, 10);
    const month = parseInt(parts.find(p => p.type === "month")!.value, 10) - 1; // 0-indexed
    const day = parseInt(parts.find(p => p.type === "day")!.value, 10);
    return { year, month, day };
  } catch (e) {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth(),
      day: date.getUTCDate()
    };
  }
};

// Helper for date differences in calendar days, timezone-safe
const getCalendarDaysDiffTimezone = (dateStr1: string, dateStr2: string, timezone: string): number => {
  const hasTimeComponent1 = dateStr1.includes("T") || dateStr1.includes(" ");
  const hasTimeComponent2 = dateStr2.includes("T") || dateStr2.includes(" ");
  
  const localDateStr1 = hasTimeComponent1 
    ? getLocalDateString(new Date(dateStr1), timezone) 
    : dateStr1;
    
  const localDateStr2 = hasTimeComponent2 
    ? getLocalDateString(new Date(dateStr2), timezone) 
    : dateStr2;
    
  const [y1, m1, d1] = localDateStr1.split("-").map(Number);
  const [y2, m2, d2] = localDateStr2.split("-").map(Number);
  
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / msPerDay);
};

// Helper to check if a date is within the current local week of the user
const isSameLocalWeek = (d1: Date, d2: Date, timezone: string): boolean => {
  const p1 = getLocalDateParts(d1, timezone);
  const p2 = getLocalDateParts(d2, timezone);
  
  const date1 = new Date(p1.year, p1.month, p1.day);
  const date2 = new Date(p2.year, p2.month, p2.day);
  
  const getMondayOfDate = (d: Date): Date => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };
  
  const monday1 = getMondayOfDate(date1);
  const monday2 = getMondayOfDate(date2);
  
  return monday1.getFullYear() === monday2.getFullYear() &&
         monday1.getMonth() === monday2.getMonth() &&
         monday1.getDate() === monday2.getDate();
};

// Helper to check if a date is within the current local month of the user
const isSameLocalMonth = (d1: Date, d2: Date, timezone: string): boolean => {
  const p1 = getLocalDateParts(d1, timezone);
  const p2 = getLocalDateParts(d2, timezone);
  return p1.year === p2.year && p1.month === p2.month;
};

// Syncs and resets the current_count / status of a goal if it belongs to a previous cycle
export const syncAndResetGoalProgress = async (goal: any, timezone: string) => {
  const logs = await db.logs.findMany({ goal_id: goal.id });
  const now = new Date();
  
  // Filter logs that belong to the current cycle
  const currentCycleLogs = logs.filter((log) => {
    const logDate = new Date(log.completed_at);
    if (goal.frequency === "weekly") {
      return isSameLocalWeek(logDate, now, timezone);
    } else if (goal.frequency === "monthly") {
      return isSameLocalMonth(logDate, now, timezone);
    } else {
      // daily
      const p1 = getLocalDateParts(logDate, timezone);
      const p2 = getLocalDateParts(now, timezone);
      return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
    }
  });
  
  const correctCount = currentCycleLogs.length;
  const isCompleted = correctCount >= goal.target_count;
  
  // If the goal is paused, don't auto-activate it. Only toggle between active and completed.
  const correctStatus = goal.status === "paused" ? "paused" : (isCompleted ? "completed" : "active");
  
  if (goal.current_count !== correctCount || goal.status !== correctStatus) {
    const updated = await db.goals.update(goal.id, {
      current_count: correctCount,
      status: correctStatus,
    });
    return updated;
  }
  
  return goal;
};


export const getGoals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";

    const goals = await db.goals.findMany({ user_id: userId });
    
    // Attach streaks to each goal and sync progress
    const goalsWithStreaks = await Promise.all(
      goals.map(async (goal) => {
        const syncedGoal = await syncAndResetGoalProgress(goal, timezone);
        const streak = await db.streaks.findUnique({ goal_id: goal.id });
        return {
          ...syncedGoal,
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

    const { title, description, category, target_count, frequency, due_date, reminder_time } = req.body;

    if (!title || !category) {
      throw new AppError("Goal title and category fields are required properties.", 400);
    }

    const goalTarget = target_count ? parseInt(target_count, 10) : 1;
    if (isNaN(goalTarget) || goalTarget <= 0) {
      throw new AppError("Target count must be a positive integer greater than zero.", 400);
    }

    if (reminder_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder_time)) {
      throw new AppError("Reminder time must use HH:mm format.", 400);
    }

    const newGoal = await db.goals.create({
      user_id: userId,
      title,
      description: description || null,
      category,
      target_count: goalTarget,
      frequency: frequency || "daily",
      due_date: due_date || null,
      reminder_time: reminder_time || null,
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

    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const syncedGoal = await syncAndResetGoalProgress(goal, timezone);

    const streak = await db.streaks.findUnique({ goal_id: syncedGoal.id });
    const logs = await db.logs.findMany({ goal_id: syncedGoal.id });

    res.status(200).json({
      success: true,
      goal: {
        ...syncedGoal,
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

    const { title, description, category, target_count, current_count, frequency, status, is_archived, due_date, reminder_time } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (frequency !== undefined) updates.frequency = frequency;
    if (status !== undefined) updates.status = status;
    if (is_archived !== undefined) {
      updates.is_archived = is_archived;
      updates.archived_at = is_archived ? new Date().toISOString() : null;
    }
    if (due_date !== undefined) updates.due_date = due_date;
    if (reminder_time !== undefined) {
      if (reminder_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder_time)) {
        throw new AppError("Reminder time must use HH:mm format.", 400);
      }
      updates.reminder_time = reminder_time || null;
    }

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

    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const syncedGoal = await syncAndResetGoalProgress(updatedGoal, timezone);

    const streak = await db.streaks.findUnique({ goal_id: goal.id });

    res.status(200).json({
      success: true,
      goal: {
        ...syncedGoal,
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
    const { note, completed_at, log_id } = req.body;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found.", 404);
    }

    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";

    // Sync and reset progress first to ensure today's count is correct before check-in
    const syncedGoal = await syncAndResetGoalProgress(goal, timezone);

    // Check for duplicate check-in using log_id
    if (log_id) {
      const existingLog = await db.logs.findUnique({ id: log_id });
      if (existingLog) {
        console.log(`[Goal Controller] Duplicate check-in detected for log_id: ${log_id}. Returning existing log.`);
        const currentStreak = await db.streaks.findUnique({ goal_id: syncedGoal.id });
        res.status(200).json({
          success: true,
          message: "Progress already logged.",
          goal: {
            ...syncedGoal,
            streak: currentStreak || { current_streak: 0, longest_streak: 0, last_completed_at: null },
          },
          log: existingLog,
        });
        return;
      }
    }

    const todayStr = completed_at || new Date().toISOString();
    
    // 1. Log progress
    const newLog = await db.logs.create({
      id: log_id || undefined,
      goal_id: syncedGoal.id,
      user_id: userId,
      completed_at: todayStr,
      note: note || null,
    });

    // 2. Increment target count
    const updatedCount = syncedGoal.current_count + 1;
    const totalTarget = syncedGoal.target_count;
    
    let isFullyCompletedToday = updatedCount >= totalTarget;
    
    // Update count in database
    const updatedGoal = await db.goals.update(syncedGoal.id, {
      current_count: updatedCount,
      status: isFullyCompletedToday ? "completed" : "active"
    });

    // 3. Streak Engine logic
    let streak = await db.streaks.findUnique({ goal_id: syncedGoal.id });
    if (!streak) {
      streak = await db.streaks.create({ user_id: userId, goal_id: syncedGoal.id });
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
        const daysDiff = getCalendarDaysDiffTimezone(streak.last_completed_at, todayStr, timezone);
        
        if (daysDiff === 1) {
          // Consecutive daily completion
          newCurrentStreak = streak.current_streak + 1;
          newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
          isStreakUpdated = true;
        } else if (daysDiff > 1) {
          const missingDates: string[] = [];
          const baseDate = new Date(streak.last_completed_at);
          for (let d = 1; d < daysDiff; d++) {
            const missing = new Date(baseDate);
            missing.setDate(missing.getDate() + d);
            missingDates.push(getLocalDateString(missing, timezone));
          }

          if (missingDates.length > 0) {
            const freezes = await db.streakFreezes.findMany({ goal_id: syncedGoal.id });
            const frozenSet = new Set(freezes.map((f) => f.frozen_date));
            const allFrozen = missingDates.every((date) => frozenSet.has(date));

            if (allFrozen) {
              newCurrentStreak = streak.current_streak + missingDates.length + 1;
              newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
              isStreakUpdated = true;
            } else {
              newCurrentStreak = 1;
              isStreakUpdated = true;
            }
          } else {
            newCurrentStreak = 1;
            isStreakUpdated = true;
          }
        } else if (daysDiff <= 0) {
          // Already completed full target earlier today, do not increment streak again
          isStreakUpdated = false;
        }
      }
    }

    const updatedStreak = await db.streaks.upsert(syncedGoal.id, userId, {
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
          message: `🔥 Amazing! You've reached a ${newCurrentStreak}-day streak for goal: "${syncedGoal.title}"! Keep it up!`,
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

// Helper to format Date as YYYY-MM-DD in user's timezone
const getLocalDateString = (date: Date, timezone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === "year")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return date.toISOString().split("T")[0];
  }
};

// Recalculates the streak for a goal based on its remaining logs
export const recalculateStreak = async (goalId: string, userId: string) => {
  const goal = await db.goals.findUnique({ id: goalId });
  if (!goal) return null;

  const user = await db.users.findUnique({ id: userId });
  const timezone = user?.timezone || "UTC";

  const logs = await db.logs.findMany({ goal_id: goalId });

  // Group logs by local date string
  const logsByDate: { [dateStr: string]: number } = {};
  for (const log of logs) {
    const dateStr = getLocalDateString(new Date(log.completed_at), timezone);
    logsByDate[dateStr] = (logsByDate[dateStr] || 0) + 1;
  }

  // Find unique completed dates sorted chronologically
  const completedDates = Object.keys(logsByDate)
    .filter(dateStr => logsByDate[dateStr] >= goal.target_count)
    .sort();

  let longestStreak = 0;
  let currentStreakSegment = 0;
  let prevDateStr: string | null = null;

  for (const dateStr of completedDates) {
    if (prevDateStr === null) {
      currentStreakSegment = 1;
    } else {
      const diff = getCalendarDaysDiffTimezone(prevDateStr, dateStr, timezone);
      if (diff === 1) {
        currentStreakSegment += 1;
      } else if (diff > 1) {
        currentStreakSegment = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreakSegment);
    prevDateStr = dateStr;
  }

  let currentStreak = 0;
  let lastCompletedAtStr: string | null = null;

  if (completedDates.length > 0) {
    const lastCompletedDateStr = completedDates[completedDates.length - 1];
    lastCompletedAtStr = lastCompletedDateStr;

    const todayLocalStr = getLocalDateString(new Date(), timezone);
    const diff = getCalendarDaysDiffTimezone(lastCompletedDateStr, todayLocalStr, timezone);

    if (diff <= 1) {
      currentStreak = currentStreakSegment;
    } else {
      currentStreak = 0;
    }
  }

  const lastCompletedAtDate = lastCompletedAtStr ? new Date(lastCompletedAtStr).toISOString() : null;

  const updatedStreak = await db.streaks.upsert(goalId, userId, {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_completed_at: lastCompletedAtDate,
  });

  return updatedStreak;
};

// Delete a goal progress log and revert progress/streak
export const deleteLog = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { logId } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    // 1. Fetch log and verify ownership
    const log = await db.logs.findUnique({ id: logId });
    if (!log || log.user_id !== userId) {
      throw new AppError("Log not found or access denied.", 404);
    }

    const goal = await db.goals.findUnique({ id: log.goal_id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found.", 404);
    }

    // 2. Delete the log
    await db.logs.delete(logId);

    // 3. Decrement count
    const updatedCount = Math.max(0, goal.current_count - 1);
    const totalTarget = goal.target_count;
    const isCompleted = updatedCount >= totalTarget;

    const updatedGoal = await db.goals.update(goal.id, {
      current_count: updatedCount,
      status: isCompleted ? "completed" : "active",
    });

    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const syncedGoal = await syncAndResetGoalProgress(updatedGoal, timezone);

    // 4. Recalculate streak
    const updatedStreak = await recalculateStreak(goal.id, userId);

    res.status(200).json({
      success: true,
      message: "Progress log deleted and goal progress updated.",
      goal: {
        ...syncedGoal,
        streak: updatedStreak || { current_streak: 0, longest_streak: 0, last_completed_at: null },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkArchiveGoals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { goalIds } = req.body;
    if (!Array.isArray(goalIds)) throw new AppError("Invalid payload.", 400);

    const userGoals = await db.goals.findMany({ user_id: userId });
    const ownedIds = new Set(userGoals.map(g => g.id));
    const validIds = goalIds.filter(id => ownedIds.has(id));

    // Prisma updateMany isn't directly exposed in the local db wrapper perfectly for array of IDs.
    // We will do parallel updates using the existing update method.
    const archivedAt = new Date().toISOString();
    await Promise.all(validIds.map(id => db.goals.update(id, { is_archived: true, archived_at: archivedAt })));

    res.status(200).json({ success: true, message: "Goals archived successfully." });
  } catch (error) {
    next(error);
  }
};

export const bulkPauseGoals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { goalIds } = req.body;
    if (!Array.isArray(goalIds)) throw new AppError("Invalid payload.", 400);

    const userGoals = await db.goals.findMany({ user_id: userId });
    const ownedIds = new Set(userGoals.map(g => g.id));
    const validIds = goalIds.filter(id => ownedIds.has(id));

    await Promise.all(validIds.map(id => db.goals.update(id, { status: "paused" })));

    res.status(200).json({ success: true, message: "Goals paused successfully." });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteGoals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { goalIds } = req.body;
    if (!Array.isArray(goalIds)) throw new AppError("Invalid payload.", 400);

    const userGoals = await db.goals.findMany({ user_id: userId });
    const ownedIds = new Set(userGoals.map(g => g.id));
    const validIds = goalIds.filter(id => ownedIds.has(id));

    await Promise.all(validIds.map(id => db.goals.delete(id)));

    res.status(200).json({ success: true, message: "Goals deleted successfully." });
  } catch (error) {
    next(error);
  }
};
