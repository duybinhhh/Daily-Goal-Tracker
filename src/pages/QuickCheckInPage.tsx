// src/pages/QuickCheckInPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, RotateCcw, Award, Sparkles, Smile } from "lucide-react";
import { useGoalStore } from "../store/goalStore";
import { Goal } from "../types";
import { useTranslation } from "../i18n";

export const QuickCheckInPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { goals, fetchGoals, completeGoalProgress, deleteLogProgress, isOffline } = useGoalStore();
  
  // Track recently logged progress for undoing
  const [recentLogs, setRecentLogs] = useState<{
    [goalId: string]: {
      logId: string;
      secondsLeft: number;
    };
  }>({});

  const timersRef = useRef<{ [goalId: string]: ReturnType<typeof setInterval> }>({});

  useEffect(() => {
    fetchGoals();
    
    return () => {
      // Clean up all timers on unmount
      Object.values(timersRef.current).forEach(clearInterval);
    };
  }, [fetchGoals]);

  const handleCheckIn = async (goal: Goal) => {
    if (recentLogs[goal.id]) return; // Guard against multiple fast taps

    // Haptic feedback (vibration)
    if (navigator.vibrate) {
      try {
        navigator.vibrate(80);
      } catch (e) {
        console.warn("Vibration failed:", e);
      }
    }

    try {
      const response = await completeGoalProgress(goal.id);
      const logId = response.log?.id;

      if (logId) {
        // Start 5-second countdown
        setRecentLogs((prev) => ({
          ...prev,
          [goal.id]: { logId, secondsLeft: 5 },
        }));

        const interval = setInterval(() => {
          setRecentLogs((prev) => {
            const current = prev[goal.id];
            if (!current) return prev;

            if (current.secondsLeft <= 1) {
              clearInterval(timersRef.current[goal.id]);
              delete timersRef.current[goal.id];
              const updated = { ...prev };
              delete updated[goal.id];
              return updated;
            }

            return {
              ...prev,
              [goal.id]: { ...current, secondsLeft: current.secondsLeft - 1 },
            };
          });
        }, 1000);

        timersRef.current[goal.id] = interval;
      }
    } catch (err) {
      console.error("Quick check-in failed:", err);
    }
  };

  const handleUndo = async (goalId: string) => {
    const logData = recentLogs[goalId];
    if (!logData) return;

    // Clear timer
    if (timersRef.current[goalId]) {
      clearInterval(timersRef.current[goalId]);
      delete timersRef.current[goalId];
    }

    try {
      await deleteLogProgress(logData.logId, goalId);
      
      setRecentLogs((prev) => {
        const updated = { ...prev };
        delete updated[goalId];
        return updated;
      });

      // Subtle feedback vibration for undo
      if (navigator.vibrate) {
        navigator.vibrate([40, 40]);
      }
    } catch (err) {
      console.error("Quick undo failed:", err);
    }
  };

  // Filter active goals (those currently not completed, OR currently in the undo countdown window)
  const activeGoals = goals.filter(
    (g) => g.status !== "paused" && (g.current_count < g.target_count || recentLogs[g.id])
  );

  // Filter completed goals (target reached and NOT in the undo countdown window)
  const completedGoals = goals.filter(
    (g) => g.status !== "paused" && g.current_count >= g.target_count && !recentLogs[g.id]
  );

  const getCategoryClass = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("health")) return "cat-health";
    if (cat.includes("fit")) return "cat-fitness";
    if (cat.includes("work")) return "cat-work";
    if (cat.includes("learn")) return "cat-learning";
    if (cat.includes("fin")) return "cat-finance";
    return "cat-routine";
  };

  const getCategoryEmoji = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("health")) return "💧";
    if (cat.includes("fit")) return "💪";
    if (cat.includes("work")) return "💼";
    if (cat.includes("learn")) return "📚";
    if (cat.includes("fin")) return "🪙";
    return "⚡";
  };

  return (
    <div 
      className="flex flex-col min-h-screen animate-fade-in"
      style={{
        padding: "20px 16px 80px 16px",
        maxWidth: "600px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/")} 
          className="btn-ghost flex items-center justify-center p-2 rounded-full"
          aria-label="Back"
          style={{ width: "40px", height: "40px" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 
          className="text-lg font-bold tracking-tight text-center flex-1"
          style={{ color: "var(--color-on-background)" }}
        >
          {t("quickCheckin.title")} ⚡
        </h1>
        <div style={{ width: "40px" }} /> {/* Balance space */}
      </header>

      {/* Offline Status */}
      {isOffline && (
        <div
          className="mb-6 py-2 px-4 text-xs flex items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400 font-semibold animate-pulse"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cloud_off</span>
          <span>{t("quickCheckin.offlineCheckin")}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Active Habits Section */}
        <div>
          <h2 
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-on-surface-variant)",
              marginBottom: "12px",
              paddingLeft: "4px"
            }}
          >
            {t("quickCheckin.incompleteHabits", { count: activeGoals.length })}
          </h2>

          {activeGoals.length === 0 ? (
            <div 
              className="glass-card flex flex-col items-center justify-center text-center p-8 border-dashed"
              style={{ minHeight: "220px", borderColor: "var(--color-outline-variant)" }}
            >
              <div 
                className="icon-circle mb-4" 
                style={{ background: "rgba(78, 222, 163, 0.1)", color: "var(--color-secondary)" }}
              >
                <Sparkles size={28} />
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: "var(--color-on-surface)" }}>
                {t("quickCheckin.allDone")}
              </h3>
              <p className="text-xs max-w-[280px]" style={{ color: "var(--color-on-surface-variant)" }}>
                {t("quickCheckin.allDoneDesc")}
              </p>
              <button 
                onClick={() => navigate("/")} 
                className="btn-primary mt-6 text-xs py-2.5 px-6"
              >
                {t("goals.backToDashboard")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {activeGoals.map((goal) => {
                const isUndoActive = !!recentLogs[goal.id];
                const secondsLeft = recentLogs[goal.id]?.secondsLeft || 0;
                
                return (
                  <div 
                    key={goal.id}
                    className="glass-card relative overflow-hidden transition-all duration-300 active:scale-[0.98]"
                    style={{
                      border: isUndoActive 
                        ? "1px solid var(--color-secondary)" 
                        : "1px solid var(--border-subtle)",
                      boxShadow: isUndoActive 
                        ? "0 4px 16px rgba(78, 222, 163, 0.15)" 
                        : "none",
                    }}
                  >
                    {/* Big Touch Target button wrapper */}
                    {!isUndoActive ? (
                      <button
                        onClick={() => handleCheckIn(goal)}
                        className="w-full text-left p-5 flex items-center justify-between gap-4"
                        style={{ background: "transparent", border: "none", cursor: "pointer" }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`cat-pill ${getCategoryClass(goal.category)}`}>
                              {getCategoryEmoji(goal.category)} {t("category." + goal.category.toLowerCase())}
                            </span>
                            {goal.streak && goal.streak.current_streak > 0 && (
                              <span 
                                style={{ 
                                  fontSize: "10px", 
                                  fontWeight: 600, 
                                  color: "var(--color-tertiary)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "2px"
                                }}
                              >
                                🔥 {goal.streak.current_streak}d
                              </span>
                            )}
                          </div>
                          
                          <h3 
                            className="font-bold text-base leading-tight truncate"
                            style={{ color: "var(--color-on-surface)" }}
                          >
                            {goal.title}
                          </h3>
                          
                          <p 
                            className="text-xs mt-1" 
                            style={{ color: "var(--color-on-surface-variant)" }}
                          >
                            {t("quickCheckin.progressLabel", { current: goal.current_count, target: goal.target_count, freq: t("common." + goal.frequency) })}
                          </p>
                        </div>

                        {/* Large Touch Circle Indicator */}
                        <div 
                          className="flex items-center justify-center rounded-full transition-all duration-200"
                          style={{
                            width: "52px",
                            height: "52px",
                            background: "rgba(192, 193, 255, 0.08)",
                            border: "1.5px solid var(--color-outline-variant)",
                            color: "var(--color-primary)",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                            add
                          </span>
                        </div>
                      </button>
                    ) : (
                      /* Undo UI panel overlay */
                      <div 
                        className="p-5 flex items-center justify-between gap-4 animate-fade-in"
                        style={{ background: "rgba(0, 165, 114, 0.04)" }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex items-center justify-center rounded-full"
                            style={{
                              width: "36px",
                              height: "36px",
                              background: "rgba(78, 222, 163, 0.15)",
                              color: "var(--color-secondary)"
                            }}
                          >
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm" style={{ color: "var(--color-on-surface)" }}>
                              {t("quickCheckin.habitLogged")}
                            </h4>
                            <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
                              {t("goalCard.hideIn", { sec: secondsLeft })}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUndo(goal.id)}
                          className="btn-ghost flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs"
                          style={{
                            border: "1px solid var(--color-outline-variant)",
                            color: "var(--color-on-surface)",
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>{t("common.undo")}</span>
                        </button>
                      </div>
                    )}

                    {/* Progress indicator bar at bottom of card */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1 bg-transparent"
                    >
                      <div 
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (goal.current_count / goal.target_count) * 100)}%`,
                          background: isUndoActive ? "var(--color-secondary)" : "var(--color-primary)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Habits Section */}
        {completedGoals.length > 0 && (
          <div>
            <h2 
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-on-surface-variant)",
                marginBottom: "12px",
                paddingLeft: "4px"
              }}
            >
              {t("quickCheckin.completedHabits", { count: completedGoals.length })}
            </h2>

            <div className="flex flex-col gap-2.5 opacity-60">
              {completedGoals.map((goal) => (
                <div 
                  key={goal.id}
                  className="glass-card p-4 flex items-center justify-between gap-4"
                  style={{
                    background: "rgba(23, 31, 51, 0.3)",
                    borderColor: "transparent",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-semibold text-sm truncate line-through"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {goal.title}
                    </h3>
                    <p style={{ fontSize: "11px", color: "var(--color-outline)" }}>
                      {t("quickCheckin.completedProgressLabel", { current: goal.current_count, target: goal.target_count, streak: goal.streak?.current_streak || 0 })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="goal-met-badge">
                      <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                        check
                      </span>
                      <span>{t("common.done")}</span>
                    </span>
                    {/* Allow extra completion check-in if clicked */}
                    <button
                      onClick={() => handleCheckIn(goal)}
                      className="btn-ghost p-1.5 rounded-lg"
                      title={t("quickCheckin.checkinMore")}
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        add
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
