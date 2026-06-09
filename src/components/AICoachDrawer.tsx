import React, { useEffect, useMemo, useState } from "react";
import { Brain, Send, X } from "lucide-react";
import api from "../services/api";
import { useAICoachStore } from "../store/aiCoachStore";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";

const RATE_LIMIT_KEY = "ai_coach_usage";
const DAILY_LIMIT = 10;
const REQUEST_TIMEOUT_MS = 15000;

interface AIHabit {
  title: string;
  completionRate: number;
  currentStreak?: number;
  daysMissed?: number;
}

interface AIReport {
  weeklyCompletionRate: number;
  strongHabits: AIHabit[];
  weakHabits: AIHabit[];
  suggestions: string[];
  motivationalMessage: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
}

interface AICoachDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function createMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readUsage() {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || parsed.date !== today) return { date: today, count: 0 };
    return { date: today, count: Number(parsed.count) || 0 };
  } catch {
    return { date: today, count: 0 };
  }
}

function getLocalHour(timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    return Number(parts.find((part) => part.type === "hour")?.value || new Date().getHours());
  } catch {
    return new Date().getHours();
  }
}

function SkeletonReport() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 rounded" style={{ background: "var(--color-surface-variant)", width: "55%" }} />
      <div className="h-20 rounded-xl" style={{ background: "var(--color-surface-variant)" }} />
      <div className="h-4 rounded" style={{ background: "var(--color-surface-variant)", width: "78%" }} />
      <div className="h-4 rounded" style={{ background: "var(--color-surface-variant)", width: "45%" }} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[80%] flex gap-1"
        style={{ background: "var(--color-surface-variant)", color: "var(--color-on-surface)" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:240ms]" />
      </div>
    </div>
  );
}

export function AICoachDrawer({ isOpen: controlledIsOpen, onClose }: AICoachDrawerProps) {
  const { isOpen: storeIsOpen, closeDrawer } = useAICoachStore();
  const isOpen = controlledIsOpen ?? storeIsOpen;
  const handleClose = onClose ?? closeDrawer;
  const { user } = useAuthStore();
  const { goals, fetchGoals } = useGoalStore();
  const [report, setReport] = useState<AIReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [usage, setUsage] = useState(readUsage);

  useEffect(() => {
    if (!isOpen) return;
    setUsage(readUsage());
    if (goals.length === 0) {
      fetchGoals();
    }
  }, [isOpen, goals.length, fetchGoals]);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    async function loadReport() {
      setLoadingReport(true);
      setReportError(null);
      try {
        const response = await api.post("/api/ai/report", {}, { signal: controller.signal });
        setReport(response.data.report);
      } catch (error: any) {
        setReportError(
          error.name === "CanceledError" || error.code === "ERR_CANCELED"
            ? "Xin lỗi, AI Coach đang bận. Vui lòng thử lại sau nhé!"
            : "Không thể kết nối. Kiểm tra mạng và thử lại."
        );
      } finally {
        clearTimeout(timeout);
        setLoadingReport(false);
      }
    }

    loadReport();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [isOpen]);

  const streakWarning = useMemo(() => {
    const timezone = user?.timezone || "UTC";
    const hour = getLocalHour(timezone);
    if (hour < 18 || hour >= 21) return null;

    const riskyGoal = goals
      .filter((goal) => goal.current_count < goal.target_count && (goal.streak?.current_streak || 0) > 0)
      .sort((a, b) => (b.streak?.current_streak || 0) - (a.streak?.current_streak || 0))[0];

    if (!riskyGoal) return null;
    return `Còn dưới 3 tiếng! ${riskyGoal.title} sắp mất streak ${riskyGoal.streak?.current_streak || 0} ngày. Hãy hoàn thành ngay!`;
  }, [goals, user?.timezone]);

  const remaining = Math.max(0, DAILY_LIMIT - usage.count);

  const incrementUsage = (currentCount: number) => {
    const nextUsage = { date: getTodayKey(), count: currentCount + 1 };
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(nextUsage));
    setUsage(nextUsage);
  };

  const sendMessage = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const message = input.trim();
    if (!message || isTyping) return;

    const currentUsage = readUsage();
    setUsage(currentUsage);
    if (currentUsage.count >= DAILY_LIMIT) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "ai",
          text: "Bạn đã dùng hết 10 lượt hôm nay. Quay lại vào ngày mai nhé!",
        },
      ]);
      return;
    }

    setInput("");
    setMessages((current) => [...current, { id: createMessageId(), role: "user", text: message }]);
    setIsTyping(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await api.post("/api/ai/chat", { message }, { signal: controller.signal });
      setMessages((current) => [
        ...current,
        { id: createMessageId(), role: "ai", text: response.data.reply },
      ]);
      incrementUsage(currentUsage.count);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "ai",
          text:
            error.name === "CanceledError" || error.code === "ERR_CANCELED"
              ? "Xin lỗi, AI Coach đang bận. Vui lòng thử lại sau nhé!"
              : "Không thể kết nối. Kiểm tra mạng và thử lại.",
        },
      ]);
    } finally {
      clearTimeout(timeout);
      setIsTyping(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "var(--color-surface)",
          color: "var(--color-on-surface)",
          borderLeft: "1px solid var(--border-subtle)",
          boxShadow: "-16px 0 40px rgba(0,0,0,0.24)",
        }}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Brain size={22} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold">AI Coach</h2>
                <p className="text-xs text-on-surface-variant">Tư vấn thói quen cá nhân</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-on-surface-variant hover:bg-white/10 hover:text-on-surface"
              aria-label="Close AI Coach"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
            {streakWarning && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
                {streakWarning}
              </div>
            )}

            <section className="glass-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Báo cáo tuần</h3>
                {report && (
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                    {report.weeklyCompletionRate}%
                  </span>
                )}
              </div>

              {loadingReport && <SkeletonReport />}
              {reportError && <p className="text-sm text-red-400">{reportError}</p>}
              {report && !loadingReport && (
                <div className="space-y-4">
                  <p className="text-sm text-on-surface-variant">{report.motivationalMessage}</p>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase text-on-surface-variant">Thói quen mạnh</p>
                    <div className="space-y-2">
                      {report.strongHabits.slice(0, 3).map((habit) => (
                        <div key={habit.title} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                          <span className="truncate">{habit.title}</span>
                          <span className="font-bold text-secondary">{habit.completionRate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase text-on-surface-variant">Cần cải thiện</p>
                    <div className="space-y-2">
                      {report.weakHabits.slice(0, 3).map((habit) => (
                        <div key={habit.title} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                          <span className="truncate">{habit.title}</span>
                          <span className="font-bold text-red-400">{habit.completionRate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase text-on-surface-variant">Gợi ý AI</p>
                    <ul className="space-y-2">
                      {report.suggestions.slice(0, 4).map((suggestion) => (
                        <li key={suggestion} className="rounded-lg bg-primary/10 px-3 py-2 text-sm leading-relaxed">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3 pb-2">
              <h3 className="font-bold">Trò chuyện với AI Coach</h3>
              {messages.length === 0 && (
                <p className="rounded-xl bg-white/5 px-4 py-3 text-sm text-on-surface-variant">
                  Hỏi về cách giữ streak, chọn mục tiêu ưu tiên, hoặc lên kế hoạch check-in hôm nay.
                </p>
              )}
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        message.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                      }`}
                      style={
                        message.role === "user"
                          ? { background: "var(--color-primary)", color: "var(--color-on-primary)" }
                          : { background: "var(--color-surface-variant)", color: "var(--color-on-surface)" }
                      }
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isTyping && <TypingIndicator />}
              </div>
            </section>
          </div>

          <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
            <div className="mb-2 text-right text-[11px] font-semibold text-on-surface-variant">
              Còn {remaining}/10 lượt hôm nay
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Hỏi AI Coach của bạn..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-on-surface-variant"
                disabled={isTyping || remaining <= 0}
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim() || remaining <= 0}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary transition-opacity disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}
