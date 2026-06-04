// src/controllers/statsController.ts
import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const goals = await db.goals.findMany({ user_id: userId });
    const streaks = await db.streaks.findMany({ user_id: userId });

    const totalGoals = goals.length;
    const activeGoals = goals.filter((g) => g.status !== "paused").length;
    const completedGoalsToday = goals.filter((g) => g.current_count >= g.target_count).length;

    // Completion rate of active goals progress
    let overallCompletionRate = 0;
    const activeGoalsList = goals.filter((g) => g.status !== "paused");
    if (activeGoalsList.length > 0) {
      const totalProgress = activeGoalsList.reduce((acc, g) => acc + g.current_count, 0);
      const totalTargets = activeGoalsList.reduce((acc, g) => acc + g.target_count, 0);
      overallCompletionRate = totalTargets > 0 ? Math.round((totalProgress / totalTargets) * 100) : 0;
    }

    // High steaks markers
    const bestCurrentStreak = streaks.length > 0 ? Math.max(...streaks.map((s) => s.current_streak)) : 0;
    const bestLongestStreak = streaks.length > 0 ? Math.max(...streaks.map((s) => s.longest_streak)) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalGoals,
        activeGoals,
        completedGoalsToday,
        overallCompletionRate,
        bestCurrentStreak,
        bestLongestStreak,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { from, to } = req.query;

    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();

    // Set dates limits
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const logs = await db.logs.findMany({ user_id: userId });
    
    // Filter by date range manually
    const filteredLogs = logs.filter((log) => {
      const logDate = new Date(log.completed_at);
      return logDate >= fromDate && logDate <= toDate;
    });

    // Populate historical days index
    const historyMap: { [date: string]: any[] } = {};
    
    // Generate empty days lists for the range
    const loopDate = new Date(fromDate);
    while (loopDate <= toDate) {
      const dayStr = loopDate.toISOString().split("T")[0];
      historyMap[dayStr] = [];
      loopDate.setDate(loopDate.getDate() + 1);
    }

    // Populate active logged records
    filteredLogs.forEach((log) => {
      const dayKey = log.completed_at.split("T")[0];
      if (historyMap[dayKey]) {
        historyMap[dayKey].push(log);
      } else {
        historyMap[dayKey] = [log];
      }
    });

    // Convert Map to ordered arrays list
    const historyList = Object.keys(historyMap).sort().map((dateStr) => {
      return {
        date: dateStr,
        count: historyMap[dateStr].length,
        logs: historyMap[dateStr],
      };
    });

    res.status(200).json({
      success: true,
      history: historyList,
    });
  } catch (error) {
    next(error);
  }
};
