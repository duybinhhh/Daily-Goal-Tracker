// src/controllers/statsController.ts
import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { syncAndResetGoalProgress } from "./goalController";

function getLogDedupeKey(log: { goal_id: string; completed_at: string; note?: string | null }): string {
  return [
    log.goal_id,
    log.completed_at,
    (log.note || "").trim(),
  ].join("|");
}

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


export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";

    const rawGoals = await db.goals.findMany({ user_id: userId });
    const goals = await Promise.all(
      rawGoals.map(goal => syncAndResetGoalProgress(goal, timezone))
    );
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

    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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

    const seenLogIds = new Set<string>();
    const seenLogKeys = new Set<string>();
    const uniqueLogs = filteredLogs.filter((log) => {
      const key = getLogDedupeKey(log);
      if (seenLogIds.has(log.id) || seenLogKeys.has(key)) {
        return false;
      }

      seenLogIds.add(log.id);
      seenLogKeys.add(key);
      return true;
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
    uniqueLogs.forEach((log) => {
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

export const getTrendComparison = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const period = String(req.query.period || "");
    const goalId = typeof req.query.goalId === "string" && req.query.goalId.trim()
      ? req.query.goalId.trim()
      : undefined;

    if (!["day", "week", "month"].includes(period)) {
      throw new AppError("Invalid period. Must be day, week, or month.", 400);
    }

    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const userGoals = await db.goals.findMany({ user_id: userId });
    const selectedGoal = goalId ? userGoals.find((goal) => goal.id === goalId) : null;

    if (goalId && !selectedGoal) {
      throw new AppError("Goal not found.", 404);
    }

    const allLogs = await db.logs.findMany({ user_id: userId });

    const seenLogIds = new Set<string>();
    const seenLogKeys = new Set<string>();
    const uniqueAllLogs = allLogs.filter((log) => {
      const key = getLogDedupeKey(log);
      if (seenLogIds.has(log.id) || seenLogKeys.has(key)) {
        return false;
      }
      seenLogIds.add(log.id);
      seenLogKeys.add(key);
      return true;
    });
    const uniqueLogs = uniqueAllLogs.filter((log) => !goalId || log.goal_id === goalId);

    const formatDateStr = (year: number, month: number, day: number) => {
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const getDateKey = (date: Date) => {
      const parts = getLocalDateParts(date, timezone);
      return formatDateStr(parts.year, parts.month, parts.day);
    };

    const addDays = (date: Date, days: number) => {
      const next = new Date(date);
      next.setDate(next.getDate() + days);
      return next;
    };

    const sumByDateKeys = (dateKeys: string[]) => {
      const dateSet = new Set(dateKeys);
      return uniqueLogs.filter((log) => dateSet.has(getDateKey(new Date(log.completed_at)))).length;
    };

    const sumGoalByDateKeys = (targetGoalId: string, dateKeys: string[]) => {
      const dateSet = new Set(dateKeys);
      return uniqueAllLogs.filter((log) => {
        return log.goal_id === targetGoalId && dateSet.has(getDateKey(new Date(log.completed_at)));
      }).length;
    };

    const getGoalDateProgress = (targetGoalId: string, dateKey: string) => {
      return uniqueAllLogs.filter((log) => {
        return log.goal_id === targetGoalId && getDateKey(new Date(log.completed_at)) === dateKey;
      }).length;
    };

    const nowParts = getLocalDateParts(new Date(), timezone);
    const localToday = new Date(nowParts.year, nowParts.month, nowParts.day);
    const todayStr = formatDateStr(nowParts.year, nowParts.month, nowParts.day);
    const yesterdayDate = addDays(localToday, -1);
    const yesterdayStr = formatDateStr(yesterdayDate.getFullYear(), yesterdayDate.getMonth(), yesterdayDate.getDate());

    let currentTotal = 0;
    let previousTotal = 0;
    let currentPeriodDateKeys: string[] = [];
    let previousPeriodDateKeys: string[] = [];
    let data: Array<{
      label: string;
      current: number;
      previous: number;
      currentPeriodLabel?: string;
      previousPeriodLabel?: string;
    }> = [];
    let currentRangeLabel = "";
    let previousRangeLabel = "";

    if (period === "day") {
      currentPeriodDateKeys = [todayStr];
      previousPeriodDateKeys = [yesterdayStr];
      currentTotal = sumByDateKeys([todayStr]);
      previousTotal = sumByDateKeys([yesterdayStr]);
      currentRangeLabel = todayStr;
      previousRangeLabel = yesterdayStr;
      data = [
        {
          label: "Today",
          current: currentTotal,
          previous: previousTotal,
          currentPeriodLabel: todayStr,
          previousPeriodLabel: yesterdayStr,
        },
      ];
    }

    if (period === "week") {
      const dayOfWeek = localToday.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const localMondayThisWeek = new Date(localToday);
      localMondayThisWeek.setDate(localToday.getDate() + diffToMonday);

      const thisWeekDays: string[] = [];
      const lastWeekDays: string[] = [];

      for (let i = 0; i < 7; i++) {
        const dThis = new Date(localMondayThisWeek);
        dThis.setDate(localMondayThisWeek.getDate() + i);
        thisWeekDays.push(formatDateStr(dThis.getFullYear(), dThis.getMonth(), dThis.getDate()));

        const dLast = new Date(localMondayThisWeek);
        dLast.setDate(localMondayThisWeek.getDate() - 7 + i);
        lastWeekDays.push(formatDateStr(dLast.getFullYear(), dLast.getMonth(), dLast.getDate()));
      }

      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      currentPeriodDateKeys = thisWeekDays;
      previousPeriodDateKeys = lastWeekDays;
      currentRangeLabel = `${thisWeekDays[0]} - ${thisWeekDays[6]}`;
      previousRangeLabel = `${lastWeekDays[0]} - ${lastWeekDays[6]}`;
      data = labels.map((label, index) => {
        const current = sumByDateKeys([thisWeekDays[index]]);
        const previous = sumByDateKeys([lastWeekDays[index]]);
        currentTotal += current;
        previousTotal += previous;
        return {
          label,
          current,
          previous,
          currentPeriodLabel: thisWeekDays[index],
          previousPeriodLabel: lastWeekDays[index],
        };
      });
    }

    if (period === "month") {
      const currentYear = nowParts.year;
      const currentMonth = nowParts.month;

      const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth();

      const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysInPreviousMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      const bucketStarts = [1, 8, 15, 22, 29].filter((day) => day <= Math.max(daysInCurrentMonth, daysInPreviousMonth));
      currentRangeLabel = formatDateStr(currentYear, currentMonth, 1) + " - " + formatDateStr(currentYear, currentMonth, daysInCurrentMonth);
      previousRangeLabel = formatDateStr(prevYear, prevMonth, 1) + " - " + formatDateStr(prevYear, prevMonth, daysInPreviousMonth);
      currentPeriodDateKeys = Array.from({ length: daysInCurrentMonth }, (_, index) => formatDateStr(currentYear, currentMonth, index + 1));
      previousPeriodDateKeys = Array.from({ length: daysInPreviousMonth }, (_, index) => formatDateStr(prevYear, prevMonth, index + 1));

      data = bucketStarts.map((startDay, index) => {
        const endDay = Math.min(startDay + 6, Math.max(daysInCurrentMonth, daysInPreviousMonth));
        const currentKeys: string[] = [];
        const previousKeys: string[] = [];

        for (let day = startDay; day <= endDay; day++) {
          if (day <= daysInCurrentMonth) {
            currentKeys.push(formatDateStr(currentYear, currentMonth, day));
          }
          if (day <= daysInPreviousMonth) {
            previousKeys.push(formatDateStr(prevYear, prevMonth, day));
          }
        }

        const current = sumByDateKeys(currentKeys);
        const previous = sumByDateKeys(previousKeys);
        currentTotal += current;
        previousTotal += previous;

        return {
          label: `W${index + 1}`,
          current,
          previous,
          currentPeriodLabel: `${currentKeys[0] || ""} - ${currentKeys[currentKeys.length - 1] || ""}`,
          previousPeriodLabel: `${previousKeys[0] || ""} - ${previousKeys[previousKeys.length - 1] || ""}`,
        };
      });
    }

    const getChangePercent = (current: number, previous: number) => {
      if (previous > 0) {
        return Math.round(((current - previous) / previous) * 100);
      }
      return current > 0 ? 100 : 0;
    };

    const changePercent = getChangePercent(currentTotal, previousTotal);

    const summaryGoals = (goalId && selectedGoal ? [selectedGoal] : userGoals)
      .filter((goal) => goal.status !== "paused");
    const todayCheckedIn: string[] = [];
    const todayNotCheckedIn: string[] = [];
    const yesterdayCheckedIn: string[] = [];
    const yesterdayNotCheckedIn: string[] = [];

    summaryGoals.forEach((goal) => {
      const targetCount = Math.max(1, Number(goal.target_count) || 1);
      const todayProgress = getGoalDateProgress(goal.id, todayStr);
      const yesterdayProgress = getGoalDateProgress(goal.id, yesterdayStr);
      const hasTodayCompletedTarget = todayProgress >= targetCount;
      const hasYesterdayCompletedTarget = yesterdayProgress >= targetCount;

      if (hasTodayCompletedTarget) {
        todayCheckedIn.push(goal.title);
      } else {
        todayNotCheckedIn.push(goal.title);
      }

      if (hasYesterdayCompletedTarget) {
        yesterdayCheckedIn.push(goal.title);
      } else {
        yesterdayNotCheckedIn.push(goal.title);
      }
    });

    const goalBreakdown = summaryGoals.map((goal) => {
      const current = sumGoalByDateKeys(goal.id, currentPeriodDateKeys);
      const previous = sumGoalByDateKeys(goal.id, previousPeriodDateKeys);
      const targetCount = Math.max(1, Number(goal.target_count) || 1);
      const todayCheckedIn = getGoalDateProgress(goal.id, todayStr) >= targetCount;
      const yesterdayCheckedIn = getGoalDateProgress(goal.id, yesterdayStr) >= targetCount;

      return {
        goalId: goal.id,
        title: goal.title,
        category: goal.category,
        status: goal.status,
        current,
        previous,
        changePercent: getChangePercent(current, previous),
        todayCheckedIn,
        yesterdayCheckedIn,
      };
    });

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      success: true,
      period,
      goalId: goalId || undefined,
      goalTitle: selectedGoal?.title,
      generatedAt: new Date().toISOString(),
      currentRangeLabel,
      previousRangeLabel,
      currentTotal,
      previousTotal,
      changePercent,
      data,
      goalBreakdown,
      dailySummary: {
        today: {
          checkedInCount: todayCheckedIn.length,
          notCheckedInCount: todayNotCheckedIn.length,
          checkedInGoals: todayCheckedIn,
          notCheckedInGoals: todayNotCheckedIn,
          date: todayStr,
        },
        yesterday: {
          checkedInCount: yesterdayCheckedIn.length,
          notCheckedInCount: yesterdayNotCheckedIn.length,
          checkedInGoals: yesterdayCheckedIn,
          notCheckedInGoals: yesterdayNotCheckedIn,
          date: yesterdayStr,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};


