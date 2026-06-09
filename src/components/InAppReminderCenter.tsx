import React from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, CheckCircle2, X } from "lucide-react";
import { Goal } from "../types";
import { useGoalStore } from "../store/goalStore";

interface ReminderItem {
  key: string;
  goal: Goal;
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalTimeKey(date: Date): string {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function playReminderTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    gain.connect(ctx.destination);

    [740, 980].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(ctx.currentTime + index * 0.18);
      oscillator.stop(ctx.currentTime + 0.18 + index * 0.18);
    });

    window.setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    // Browser may block audio before a user gesture; the visual reminder still appears.
  }
}

async function showOptionalSystemNotification(goal: Goal) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    const title = "Đến giờ nhắc mục tiêu ⏰";
    const body = `${goal.title} — đừng quên hoàn thành mục tiêu hôm nay nhé!`;

    // 1. Try direct browser notification first (instant and reliable on desktop)
    try {
      new Notification(title, {
        body,
        icon: "/icon.png",
        tag: `dailygoal-in-app-${goal.id}-${Date.now()}`,
        requireInteraction: true,
      });
      return; // Direct notification succeeded
    } catch (directError) {
      // Direct construction is known to throw on mobile devices (e.g., Android Chrome)
      console.warn("Direct notification failed, falling back to service worker:", directError);
    }

    // 2. Fall back to Service Worker notification with a safety timeout to prevent hanging
    if ("serviceWorker" in navigator) {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000))
      ]);

      if (registration) {
        await registration.showNotification(title, {
          body,
          icon: "/icon.png",
          badge: "/icon.png",
          tag: `dailygoal-in-app-${goal.id}-${Date.now()}`,
          requireInteraction: true,
          data: { url: "/#/goals" },
        });
      }
    }
  } catch (err) {
    console.error("Failed to display system notification:", err);
  }
}

export function InAppReminderCenter() {
  const navigate = useNavigate();
  const { goals, fetchGoals, completeGoalProgress } = useGoalStore();
  const [items, setItems] = React.useState<ReminderItem[]>([]);

  React.useEffect(() => {
    fetchGoals().catch(() => {});
  }, [fetchGoals]);

  React.useEffect(() => {
    const checkReminders = () => {
      if (localStorage.getItem("setting_goalRemind") === "false") return;

      const now = new Date();
      const timeKey = getLocalTimeKey(now);
      const dateKey = getLocalDateKey(now);
      const dueGoals = goals.filter((goal) => {
        if (goal.status !== "active") return false;
        if (!goal.reminder_time) return false;
        if (goal.reminder_time !== timeKey) return false;
        return goal.current_count < goal.target_count;
      });

      dueGoals.forEach((goal) => {
        const reminderKey = `in_app_goal_reminder:${dateKey}:${goal.id}:${goal.reminder_time}`;
        if (localStorage.getItem(reminderKey)) return;

        localStorage.setItem(reminderKey, new Date().toISOString());
        setItems((current) => {
          if (current.some((item) => item.key === reminderKey)) return current;
          return [{ key: reminderKey, goal }, ...current].slice(0, 3);
        });
        playReminderTone();
        showOptionalSystemNotification(goal);
      });
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 1000);
    return () => window.clearInterval(interval);
  }, [goals]);

  const dismiss = (key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const completeGoal = async (item: ReminderItem) => {
    try {
      await completeGoalProgress(item.goal.id);
      dismiss(item.key);
    } catch {
      navigate("/goals");
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[80] w-[min(360px,calc(100vw-2rem))] space-y-3 md:bottom-6">
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-2xl border border-primary/25 bg-surface-container-high/95 p-4 text-on-surface shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl animate-fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary">
              <BellRing size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold">Đến giờ nhắc mục tiêu</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{item.goal.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.key)}
                  className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
                  aria-label="Dong thong bao"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">
                Tiến độ hiện tại: {item.goal.current_count}/{item.goal.target_count}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => completeGoal(item)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-on-primary transition-transform active:scale-95"
                >
                  <CheckCircle2 size={16} />
                  Hoàn thành
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/goals")}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-white/15"
                >
                  Mở mục tiêu
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
