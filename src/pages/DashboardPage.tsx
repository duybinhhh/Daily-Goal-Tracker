// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useGoals } from "../hooks/useGoals";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import { GoalCard } from "../components/GoalCard";

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
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const monthName = currentDate.toLocaleString("en-US", {
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
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
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
      label: `${nextStreakTarget}-Day Fire Streak`,
      sub:
        daysLeft === 0
          ? "Milestone reached! 🎉"
          : `${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining`,
      color: "var(--color-tertiary)",
    });
  }

  // Today completion milestone
  const remaining = totalActCount - doneTodayCount;
  if (totalActCount > 0 && remaining > 0) {
    milestones.push({
      label: "Complete Today's Goals",
      sub: `${remaining} goal${remaining > 1 ? "s" : ""} left to finish today`,
      color: "var(--color-secondary)",
    });
  } else if (totalActCount > 0 && remaining === 0) {
    milestones.push({
      label: "All Goals Met! 🎯",
      sub: "You crushed it today",
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
      sub: `${topGoal.streak.current_streak}d streak — keep it going!`,
      color: "var(--color-primary)",
    });
  }

  if (milestones.length === 0) {
    milestones.push({
      label: "Create your first goal",
      sub: "Set a target to start tracking",
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
        Upcoming Milestones
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
  const { user } = useAuthStore();
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

  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const totalActCount = goals.filter((g) => g.status === "active").length;
  const doneTodayCount = goals.filter(
    (g) => g.current_count >= g.target_count
  ).length;
  const completionRate =
    totalActCount > 0 ? Math.round((doneTodayCount / totalActCount) * 100) : 0;

  const bestCurrentStreak = Math.max(
    0,
    ...goals.map((g) => g.streak?.current_streak || 0)
  );
  const totalCompleted = goals.reduce((sum, g) => sum + g.current_count, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* ── Sticky Header ── */}
      <header
        id="dashboard-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "14px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--color-on-surface)",
          }}
        >
          {greeting},{" "}
          <span style={{ color: "var(--color-primary)" }}>
            {user?.name || "Achiever"}
          </span>{" "}
          ✦
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Streak badge in header */}
          {bestCurrentStreak > 0 && (
            <div className="streak-badge">
              <span
                className="material-symbols-outlined ms-filled"
                style={{ fontSize: "15px" }}
              >
                local_fire_department
              </span>
              {bestCurrentStreak} Day Streak
            </div>
          )}
          <button onClick={refreshAll} className="btn-ghost" title="Refresh">
            <RefreshCw size={14} />
            Refresh
          </button>
          <Link to="/new-goal" className="btn-primary">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px" }}
            >
              add
            </span>
            Add Goal
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main
        style={{
          flex: 1,
          padding: "24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
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
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
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
                Today's Progress
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
                  {doneTodayCount}/{totalActCount} goals
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
                Current Streak
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
                {bestCurrentStreak} Days
              </span>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-on-surface-variant)",
                  marginTop: "4px",
                }}
              >
                {bestCurrentStreak >= 7
                  ? "Top 5% of all users 🏆"
                  : "Keep it up!"}
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
                Total Logged
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
                  ? "Milestone reached: Elite 🎯"
                  : "Progress logged across all goals"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Two-Column Layout: Goals + Right Panel ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 300px",
            gap: "20px",
            alignItems: "start",
            flex: 1,
          }}
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
                  Today's Priority Goals
                </h2>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    className="btn-ghost"
                    style={{ padding: "6px 8px" }}
                    title="Filter"
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
                    title="Grid View"
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
                  Loading daily layout...
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
                          No goals yet
                        </h3>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--color-on-surface-variant)",
                            lineHeight: 1.6,
                          }}
                        >
                          Start by creating your first daily goal to build
                          lasting habits.
                        </p>
                      </div>
                      <Link to="/new-goal" className="btn-primary">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px" }}
                        >
                          add
                        </span>
                        Create First Goal
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
                          No goals in "{activeCategory}"
                        </h3>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--color-on-surface-variant)",
                            lineHeight: 1.6,
                          }}
                        >
                          No active goals match this category filter.
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
                        Clear Filter
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Calendar + Milestones ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "sticky",
              top: "72px",
            }}
          >
            <MiniCalendar />
            <UpcomingMilestones
              bestStreak={bestCurrentStreak}
              doneTodayCount={doneTodayCount}
              totalActCount={totalActCount}
              goals={goals}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
