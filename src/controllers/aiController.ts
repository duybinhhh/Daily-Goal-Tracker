import { Response, NextFunction } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { syncAndResetGoalProgress } from "./goalController";

const MODEL = "gemini-2.0-flash";
const AI_TIMEOUT_MS = 14000;

interface CoachGoal {
  title: string;
  category: string;
  frequency: string;
  status: string;
  current_count: number;
  target_count: number;
  current_streak: number;
  longest_streak: number;
}

interface CoachStats {
  totalGoals: number;
  activeGoals: number;
  completedGoalsToday: number;
  overallCompletionRate: number;
  bestCurrentStreak: number;
  bestLongestStreak: number;
}

interface CoachContext {
  timezone: string;
  today: string;
  goals: CoachGoal[];
  stats: CoachStats;
}

const systemPrompt = [
  "Bạn là AI Habit Coach thân thiện, hỗ trợ người dùng theo dõi thói quen và mục tiêu cá nhân.",
  "Phản hồi bằng tiếng Việt, ngắn gọn, tích cực và thực tế.",
  "Không hỏi thông tin cá nhân như email hay mật khẩu.",
  "Chỉ dựa trên dữ liệu thói quen được cung cấp trong context.",
].join("\n");

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = AI_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
    }),
  ]);
}

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  return JSON.parse(cleaned);
}

function buildStats(goals: CoachGoal[]): CoachStats {
  const activeGoals = goals.filter((g) => g.status !== "paused");
  const totalTargets = activeGoals.reduce((sum, goal) => sum + goal.target_count, 0);
  const totalProgress = activeGoals.reduce((sum, goal) => sum + Math.min(goal.current_count, goal.target_count), 0);

  return {
    totalGoals: goals.length,
    activeGoals: activeGoals.length,
    completedGoalsToday: goals.filter((g) => g.current_count >= g.target_count).length,
    overallCompletionRate: totalTargets > 0 ? Math.round((totalProgress / totalTargets) * 100) : 0,
    bestCurrentStreak: goals.length ? Math.max(...goals.map((g) => g.current_streak)) : 0,
    bestLongestStreak: goals.length ? Math.max(...goals.map((g) => g.longest_streak)) : 0,
  };
}

async function buildCoachContext(userId: string): Promise<CoachContext> {
  const user = await db.users.findUnique({ id: userId });
  const timezone = user?.timezone || "UTC";
  const rawGoals = await db.goals.findMany({ user_id: userId });

  const goals = await Promise.all(
    rawGoals.map(async (goal) => {
      const syncedGoal = await syncAndResetGoalProgress(goal, timezone);
      const streak = await db.streaks.findUnique({ goal_id: goal.id });

      return {
        title: syncedGoal.title,
        category: syncedGoal.category,
        frequency: syncedGoal.frequency,
        status: syncedGoal.status,
        current_count: syncedGoal.current_count,
        target_count: syncedGoal.target_count,
        current_streak: streak?.current_streak || 0,
        longest_streak: streak?.longest_streak || 0,
      };
    })
  );

  return {
    timezone,
    today: new Date().toLocaleDateString("en-CA", { timeZone: timezone }),
    goals,
    stats: buildStats(goals),
  };
}

function buildContextString(context: CoachContext): string {
  return JSON.stringify(
    {
      today: context.today,
      timezone: context.timezone,
      completionRate: context.stats.overallCompletionRate,
      bestCurrentStreak: context.stats.bestCurrentStreak,
      goals: context.goals,
    },
    null,
    2
  );
}

function fallbackReport(context: CoachContext) {
  const ranked = [...context.goals].map((goal) => ({
    ...goal,
    completionRate: goal.target_count > 0 ? Math.round((Math.min(goal.current_count, goal.target_count) / goal.target_count) * 100) : 0,
  }));

  const strongHabits = [...ranked]
    .sort((a, b) => b.completionRate - a.completionRate || b.current_streak - a.current_streak)
    .slice(0, 3)
    .map((goal) => ({
      title: goal.title,
      completionRate: goal.completionRate,
      currentStreak: goal.current_streak,
    }));

  const weakHabits = [...ranked]
    .sort((a, b) => a.completionRate - b.completionRate || b.current_streak - a.current_streak)
    .slice(0, 3)
    .map((goal) => ({
      title: goal.title,
      completionRate: goal.completionRate,
      daysMissed: goal.completionRate >= 100 ? 0 : 1,
    }));

  const weakest = weakHabits[0];
  const strongest = strongHabits[0];

  return {
    weeklyCompletionRate: context.stats.overallCompletionRate,
    strongHabits,
    weakHabits,
    suggestions: [
      weakest
        ? `Hãy ưu tiên hoàn thành "${weakest.title}" hôm nay vì tiến độ hiện tại mới đạt ${weakest.completionRate}%.`
        : "Hãy tạo một thói quen nhỏ có thể hoàn thành trong 5 phút để bắt đầu đều đặn hơn.",
      strongest
        ? `Giữ nhịp cho "${strongest.title}" vì streak hiện tại đang là ${strongest.currentStreak} ngày.`
        : "Đặt một khung giờ cố định mỗi ngày để check-in dễ hơn.",
    ],
    motivationalMessage: "Bạn đang xây nhịp tiến bộ từng ngày. Hãy chọn một hành động nhỏ và làm ngay hôm nay.",
  };
}

async function callGemini(prompt: string, responseMimeType?: string) {
  const ai = getAIClient();
  if (!ai) return null;

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType,
      },
    })
  );

  return response.text || "";
}

export const getAIReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const context = await buildCoachContext(userId);
    const fallback = fallbackReport(context);
    const prompt = [
      systemPrompt,
      "Dưới đây là context thói quen đã được lọc, không chứa email/id/token:",
      buildContextString(context),
      "Hãy trả về JSON thuần, không markdown, theo schema:",
      JSON.stringify(fallback),
      "Yêu cầu suggestions có ít nhất 2 hành động cụ thể dựa trên dữ liệu.",
    ].join("\n\n");

    try {
      const text = await callGemini(prompt, "application/json");
      const report = text ? extractJson(text) : fallback;
      if (!Array.isArray(report.suggestions) || report.suggestions.length < 2) {
        report.suggestions = fallback.suggestions;
      }
      res.status(200).json({ success: true, report });
    } catch (error) {
      console.warn("AI report fallback used:", error);
      res.status(200).json({ success: true, report: fallback });
    }
  } catch (error) {
    next(error);
  }
};

export const postAIChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const message = String(req.body?.message || "").trim();
    if (!message) throw new AppError("Message is required.", 400);

    const context = await buildCoachContext(userId);
    const prompt = [
      systemPrompt,
      "Context thói quen đã được lọc, không chứa email/id/token:",
      buildContextString(context),
      `Câu hỏi của người dùng: ${message}`,
      "Trả lời tối đa 4 câu, ưu tiên lời khuyên hành động cụ thể.",
    ].join("\n\n");

    try {
      const reply = await callGemini(prompt);
      res.status(200).json({
        success: true,
        reply: reply || "Mình đã xem dữ liệu của bạn. Hãy chọn một thói quen quan trọng nhất và hoàn thành nó trước hôm nay nhé.",
      });
    } catch (error) {
      console.warn("AI chat fallback used:", error);
      res.status(200).json({
        success: true,
        reply: "Mình đang gặp chút khó khăn khi kết nối AI. Trước mắt, hãy chọn thói quen có streak cao nhất và hoàn thành nó để giữ đà nhé.",
      });
    }
  } catch (error) {
    next(error);
  }
};

