// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useGoals } from "../hooks/useGoals";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import { usePomodoroStore } from "../store/pomodoroStore";
import { GoalCard } from "../components/GoalCard";
import FriendsTodayCard from "../components/dashboard/FriendsTodayCard";
import { useTranslation } from "../i18n";

/* ── Shared section label style ── */
const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--color-on-surface-variant)",
};

/* ─── Mini Calendar ─── */
const MiniCalendar: React.FC = () => {
  const { t, language } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const monthName = currentDate.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Convert Sunday-first to Monday-first
  const startOffset = (firstDay + 6) % 7;

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="glass-card" style={{ padding: "20px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-on-surface-variant)",
          }}
        >
          {monthName}
        </span>
        <div style={{ display: "flex", gap: "2px" }}>
          <button className="btn-ghost" style={{ padding: "4px 6px" }} onClick={prevMonth}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              chevron_left
            </span>
          </button>
          <button className="btn-ghost" style={{ padding: "4px 6px" }} onClick={nextMonth}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              chevron_right
            </span>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          marginBottom: "6px",
          textAlign: "center",
        }}
      >
        {(language === "vi"
          ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
          : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
        ).map((d) => (
          <div
            key={d}
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--color-outline)",
              letterSpacing: "0.04em",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          textAlign: "center",
        }}
      >
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const isToday =
            isCurrentMonth && day === today.getDate();
          const isPast =
            isCurrentMonth && day < today.getDate();

          return (
            <div
              key={day}
              style={{
                padding: "6px 2px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: isToday ? 700 : 400,
                cursor: "pointer",
                transition: "background 0.15s",
                color: isToday
                  ? "var(--color-on-primary)"
                  : isPast
                  ? "var(--color-outline)"
                  : "var(--color-on-surface)",
                background: isToday
                  ? "var(--color-primary)"
                  : "transparent",
                boxShadow: isToday
                  ? "0 4px 12px rgba(192,193,255,0.25)"
                  : "none",
                opacity: isPast ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isToday)
                  (e.currentTarget as HTMLDivElement).style.background =
                    "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isToday)
                  (e.currentTarget as HTMLDivElement).style.background =
                    "transparent";
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Upcoming Milestones ─── */
interface MilestoneProps {
  bestStreak: number;
  doneTodayCount: number;
  totalActCount: number;
  goals: Array<{ title: string; streak?: { current_streak: number } }>;
}

const UpcomingMilestones: React.FC<MilestoneProps> = ({
  bestStreak,
  doneTodayCount,
  totalActCount,
  goals,
}) => {
  const { t } = useTranslation();
  const milestones: Array<{
    label: string;
    sub: string;
    color: string;
  }> = [];

  // Streak milestone
  const nextStreakTarget =
    bestStreak < 7 ? 7 : bestStreak < 15 ? 15 : bestStreak < 30 ? 30 : 50;
  const daysLeft = nextStreakTarget - bestStreak;
  if (bestStreak > 0) {
    milestones.push({
      label: t("dashboard.fireStreakTarget", { days: nextStreakTarget }),
      sub:
        daysLeft === 0
          ? t("dashboard.milestoneReached")
          : t("dashboard.daysRemaining", { days: daysLeft }),
      color: "var(--color-tertiary)",
    });
  }

  // Today completion milestone
  const remaining = totalActCount - doneTodayCount;
  if (totalActCount > 0 && remaining > 0) {
    milestones.push({
      label: t("dashboard.completeTodayGoals"),
      sub: t("dashboard.goalsLeftMsg", { count: remaining }),
      color: "var(--color-secondary)",
    });
  } else if (totalActCount > 0 && remaining === 0) {
    milestones.push({
      label: t("dashboard.allGoalsMet"),
      sub: t("dashboard.crushedItToday"),
      color: "var(--color-secondary)",
    });
  }

  // Longest streak goal from any active goal
  const topGoal = goals.reduce(
    (best, g) =>
      (g.streak?.current_streak || 0) > (best.streak?.current_streak || 0)
        ? g
        : best,
    goals[0]
  );

  if (topGoal && topGoal.streak && topGoal.streak.current_streak > 0) {
    milestones.push({
      label: topGoal.title,
      sub: `${topGoal.streak.current_streak}d ${t("common.streak")} — ${t("dashboard.keepItGoing")}`,
      color: "var(--color-primary)",
    });
  }

  if (milestones.length === 0) {
    milestones.push({
      label: t("dashboard.createFirst"),
      sub: t("goals.noGoalsDesc"),
      color: "var(--color-outline)",
    });
  }

  return (
    <div className="glass-card" style={{ padding: "20px" }}>
      <h3
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-on-surface-variant)",
          marginBottom: "16px",
        }}
      >
        {t("dashboard.nextMilestone")}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {milestones.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div
              style={{
                width: "3px",
                height: "44px",
                borderRadius: "9999px",
                background: m.color,
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
            <div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-on-surface)",
                  marginBottom: "3px",
                }}
              >
                {m.label}
              </p>
              <p style={{ fontSize: "11px", color: "var(--color-on-surface-variant)" }}>
                {m.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main Dashboard Page ─── */
export const DashboardPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuthStore();
  const { isOffline, isSyncing } = useGoalStore();
  const {
    filteredGoals,
    categories,
    activeCategory,
    setActiveCategory,
    goals,
    loading,
    error,
    refreshAll,
    completeGoalProgress,
    deleteGoal,
    deleteLogProgress,
  } = useGoals();

  // Local state to manage disappearing countdowns for completed goals
  const [disappearingGoals, setDisappearingGoals] = useState<{
    [goalId: string]: {
      secondsLeft: number;
      logId: string;
    };
  }>({});
  const disappearingTimersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    return () => {
      Object.values(disappearingTimersRef.current).forEach(clearInterval);
      disappearingTimersRef.current = {};
    };
  }, []);

  const clearDisappearingTimer = (goalId: string) => {
    const timer = disappearingTimersRef.current[goalId];
    if (timer) {
      clearInterval(timer);
      delete disappearingTimersRef.current[goalId];
    }
  };

  const handleLogProgress = async (id: string, note?: string) => {
    try {
      const response: any = await completeGoalProgress(id, note);
      
      const updatedGoal = useGoalStore.getState().goals.find((g) => g.id === id);
      
      if (updatedGoal && updatedGoal.current_count >= updatedGoal.target_count) {
        const logId = response.log?.id || "";
        
        clearDisappearingTimer(id);

        const intervalId = setInterval(() => {
          setDisappearingGoals((prev) => {
            const current = prev[id];
            if (!current) return prev;

            if (current.secondsLeft <= 1) {
              clearDisappearingTimer(id);
              const next = { ...prev };
              delete next[id];
              return next;
            }

            return {
              ...prev,
              [id]: {
                ...current,
                secondsLeft: current.secondsLeft - 1,
              },
            };
          });
        }, 1000);
        disappearingTimersRef.current[id] = intervalId;

        setDisappearingGoals((prev) => ({
          ...prev,
          [id]: {
            secondsLeft: 5,
            logId,
          },
        }));
      }
    } catch (err) {
      console.error("Dashboard complete progress failed:", err);
    }
  };

  const handleUndoProgress = async (goalId: string) => {
    const disappearing = disappearingGoals[goalId];
    if (!disappearing) return;

    clearDisappearingTimer(goalId);

    try {
      await deleteLogProgress(disappearing.logId);

      setDisappearingGoals((prev) => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
    } catch (err) {
      console.error("Failed to undo progress:", err);
    }
  };

  const activeFilteredGoals = filteredGoals.filter(
    (g) => g.current_count < g.target_count || disappearingGoals[g.id]
  );

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t("dashboard.goodMorning")
    : hour < 18
    ? t("dashboard.goodAfternoon")
    : t("dashboard.goodEvening");

  const totalActCount = goals.filter((g) => g.status !== "paused").length;
  const doneTodayCount = goals.filter(
    (g) => g.status !== "paused" && g.current_count >= g.target_count
  ).length;
  const completionRate =
    totalActCount > 0 ? Math.round((doneTodayCount / totalActCount) * 100) : 0;

  const bestCurrentStreak = Math.max(
    0,
    ...goals.map((g) => g.streak?.current_streak || 0)
  );
  const totalCompleted = goals.reduce((sum, g) => sum + g.current_count, 0);
  const { getTodayCompletedSessions } = usePomodoroStore();
  const pomodoroToday = getTodayCompletedSessions();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Sticky Header ── */}
      <header
        id="dashboard-header"
        className="sticky top-0 z-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-4 md:px-6"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <h1
          className="text-lg md:text-xl font-bold tracking-tight"
          style={{
            color: "var(--color-on-surface)",
          }}
        >
          {greeting},{" "}
          <span style={{ color: "var(--color-primary)" }}>
            {user?.name || "Achiever"}
          </span>{" "}
          ✦
        </h1>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Offline status badge */}
          {isOffline && (
            <div
              className="py-1 px-2.5 text-[11px] sm:text-xs flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 font-semibold"
              style={{
                backdropFilter: "blur(10px)",
              }}
              title="You are currently working offline. Changes will be synced when you go online."
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "14px" }}
              >
                cloud_off
              </span>
              <span>{t("common.offline")}</span>
            </div>
          )}

          {/* Syncing status badge */}
          {isSyncing && (
            <div
              className="py-1 px-2.5 text-[11px] sm:text-xs flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 font-semibold"
              style={{
                backdropFilter: "blur(10px)",
              }}
              title="Syncing offline progress with the server..."
            >
              <span
                className="material-symbols-outlined animate-spin"
                style={{ fontSize: "14px" }}
              >
                sync
              </span>
              <span>{t("common.syncing")}</span>
            </div>
          )}

          {/* Streak badge in header */}
          {bestCurrentStreak > 0 && (
            <div className="streak-badge py-1 px-2.5 text-[11px] sm:text-xs">
              <span
                className="material-symbols-outlined ms-filled"
                style={{ fontSize: "14px" }}
              >
                local_fire_department
              </span>
              <span>{t("dashboard.streakBadge")}: {bestCurrentStreak} {t("common.days")}</span>
            </div>
          )}
          <button onClick={refreshAll} className="btn-ghost" title={t("common.refresh")}>
            <RefreshCw size={14} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </button>
          {isOffline ? (
            <div
              className="btn-primary opacity-50 cursor-not-allowed"
              style={{ pointerEvents: "none" }}
              title="Network connection required to create goals"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cloud_off</span>
              <span className="hidden sm:inline">{t("dashboard.addGoal")}</span>
            </div>
          ) : (
            <Link to="/new-goal" className="btn-primary">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px" }}
              >
                add
              </span>
              <span className="hidden sm:inline">{t("dashboard.addGoal")}</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main
        className="flex-1 flex flex-col gap-5 py-5 px-4 md:p-6"
      >
        {/* Error Banner */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255, 180, 171, 0.08)",
              border: "1px solid rgba(255, 180, 171, 0.2)",
              borderRadius: "0.75rem",
              color: "var(--color-error)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ── Bento Stats Row ── */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Today's Progress */}
          <div className="glass-card glass-card-glow stat-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                {t("dashboard.todayProgress")}
              </span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "20px", color: "var(--color-secondary)" }}
              >
                trending_up
              </span>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color: "var(--color-on-surface)",
                  }}
                >
                  {completionRate}%
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-secondary)",
                  }}
                >
                  {doneTodayCount}/{totalActCount} {t("nav.goals")}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${completionRate}%`,
                    background: "var(--color-secondary)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Streak */}
          <div
            className="glass-card glass-card-glow stat-card"
            style={{ position: "relative", overflow: "hidden" }}
          >
            <span
              className="material-symbols-outlined ms-filled"
              style={{
                position: "absolute",
                right: "-12px",
                top: "-12px",
                fontSize: "110px",
                opacity: 0.04,
                color: "var(--color-tertiary)",
                pointerEvents: "none",
              }}
            >
              local_fire_department
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                {t("dashboard.streakBadge")}
              </span>
              <span
                className="material-symbols-outlined ms-filled"
                style={{ fontSize: "20px", color: "var(--color-tertiary)" }}
              >
                local_fire_department
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--color-on-surface)",
                }}
              >
                {bestCurrentStreak} {t("common.days")}
              </span>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-on-surface-variant)",
                  marginTop: "4px",
                }}
              >
                {bestCurrentStreak >= 7
                  ? t("dashboard.topUsers")
                  : t("dashboard.keepGoing")}
              </p>
            </div>
          </div>

          {/* Total Completed */}
          <div className="glass-card glass-card-glow stat-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                {t("stats.totalCompleted")}
              </span>
              <span
                className="material-symbols-outlined ms-filled"
                style={{ fontSize: "20px", color: "var(--color-primary)" }}
              >
                verified
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--color-on-surface)",
                }}
              >
                {totalCompleted.toLocaleString()}
              </span>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-on-surface-variant)",
                  marginTop: "4px",
                }}
              >
                {doneTodayCount >= totalActCount && totalActCount > 0
                  ? t("dashboard.eliteMilestone")
                  : t("dashboard.totalLoggedDesc")}
              </p>
            </div>
          </div>

          {/* Pomodoro Stats */}
          <div className="glass-card glass-card-glow stat-card" style={{ background: "linear-gradient(135deg, rgba(255, 180, 171, 0.05), rgba(192, 193, 255, 0.05))" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                {t("pomodoro.timer")}
              </span>
              <span
                className="material-symbols-outlined ms-filled"
                style={{ fontSize: "20px", color: "var(--color-error)" }}
              >
                timer
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--color-on-surface)",
                }}
              >
                {pomodoroToday} 🍅
              </span>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-on-surface-variant)",
                  marginTop: "4px",
                }}
              >
                {t("pomodoro.todayCompleted", { count: pomodoroToday })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Mobile Quick Check-In Promotion Banner ── */}
        <div 
          className="glass-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4"
          style={{
            border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
            background: "linear-gradient(135deg, rgba(192, 193, 255, 0.05), rgba(78, 222, 163, 0.03))",
            boxShadow: "0 4px 24px rgba(192, 193, 255, 0.05)",
            borderRadius: "1rem",
          }}
        >
          <div className="flex items-center gap-3.5">
            <div 
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{
                width: "42px",
                height: "42px",
                background: "rgba(192, 193, 255, 0.12)",
                color: "var(--color-primary)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                bolt
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm" style={{ color: "var(--color-on-surface)" }}>
                {t("dashboard.pwaPromoTitle")}
              </h4>
              <p className="text-xs mt-0.5 animate-pulse" style={{ color: "var(--color-on-surface-variant)" }}>
                {t("dashboard.pwaPromoDesc")}
              </p>
            </div>
          </div>
          <Link 
            to="/quick-checkin" 
            className="btn-primary text-xs py-2 px-4.5 flex items-center gap-1.5 self-stretch sm:self-auto text-center justify-center"
            style={{ 
              boxShadow: "0 4px 12px rgba(192, 193, 255, 0.15)",
              whiteSpace: "nowrap"
            }}
          >
            <span>{t("dashboard.pwaPromoBtn")}</span>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              arrow_forward
            </span>
          </Link>
        </div>

        {/* ── Two-Column Layout: Goals + Right Panel ── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start flex-1"
        >
          {/* ── LEFT: Goal List ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Section header + filters */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--color-on-surface)",
                  }}
                >
                  {t("dashboard.todayPriority")}
                </h2>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    className="btn-ghost"
                    style={{ padding: "6px 8px" }}
                    title={t("goals.sortBy")}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "18px" }}
                    >
                      filter_list
                    </span>
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: "6px 8px" }}
                    title={t("dashboard.gridView")}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "18px" }}
                    >
                      grid_view
                    </span>
                  </button>
                </div>
              </div>

              {/* Category chips */}
              {goals.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                  }}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`filter-chip ${
                        activeCategory.toLowerCase() === cat.toLowerCase()
                          ? "filter-chip-active"
                          : "filter-chip-inactive"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Goal cards */}
            {loading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "14px",
                  padding: "64px 0",
                }}
              >
                <div
                  className="spinner"
                  style={{
                    width: "32px",
                    height: "32px",
                    color: "var(--color-primary)",
                  }}
                />
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-on-surface-variant)",
                  }}
                >
                  {t("common.loading")}
                </p>
              </div>
            ) : activeFilteredGoals.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {activeFilteredGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onComplete={handleLogProgress}
                    onDelete={deleteGoal}
                    disappearing={disappearingGoals[goal.id]}
                    onUndo={() => handleUndoProgress(goal.id)}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 0",
                }}
              >
                <div
                  className="glass-card"
                  style={{
                    maxWidth: "340px",
                    width: "100%",
                    padding: "40px 28px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  {goals.length === 0 ? (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "48px",
                          color: "var(--color-outline)",
                          opacity: 0.5,
                        }}
                      >
                        folder_open
                      </span>
                      <div>
                        <h3
                          style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "var(--color-on-surface)",
                            marginBottom: "6px",
                          }}
                        >
                          {t("goals.noGoals")}
                        </h3>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--color-on-surface-variant)",
                            lineHeight: 1.6,
                          }}
                        >
                          {t("goals.noGoalsDesc")}
                        </p>
                      </div>
                      <Link to="/new-goal" className="btn-primary">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px" }}
                        >
                          add
                        </span>
                        {t("dashboard.createFirst")}
                      </Link>
                    </>
                  ) : (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "48px",
                          color: "var(--color-outline)",
                          opacity: 0.5,
                        }}
                      >
                        menu_book
                      </span>
                      <div>
                        <h3
                          style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "var(--color-on-surface)",
                            marginBottom: "6px",
                          }}
                        >
                          {t("dashboard.noGoalsInCat", { cat: activeCategory })}
                        </h3>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--color-on-surface-variant)",
                            lineHeight: 1.6,
                          }}
                        >
                          {t("dashboard.noGoalsInCatDesc")}
                        </p>
                      </div>
                      <button
                        className="btn-ghost"
                        onClick={() => setActiveCategory("All")}
                        style={{
                          padding: "7px 16px",
                          border:
                            "1px solid var(--color-outline-variant)",
                          borderRadius: "9999px",
                        }}
                      >
                        {t("dashboard.clearFilter")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Calendar + Milestones ── */}
          <div
            className="flex flex-col gap-4 lg:sticky lg:top-[72px]"
          >
            <MiniCalendar />
            <UpcomingMilestones
              bestStreak={bestCurrentStreak}
              doneTodayCount={doneTodayCount}
              totalActCount={totalActCount}
              goals={goals}
            />
            <FriendsTodayCard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
