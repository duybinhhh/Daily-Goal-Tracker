// src/components/GoalCard.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Edit2, Trash2, CheckCircle, Plus, MessageSquare, Undo2 } from "lucide-react";
import { Goal } from "../types";
import { motion } from "motion/react";
import { useTranslation } from "../i18n";
import api from "../services/api";

interface GoalCardProps {
  goal: Goal;
  onComplete: (id: string, note?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  disappearing?: {
    secondsLeft: number;
    logId: string;
  };
  onUndo?: () => Promise<void> | void;
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string; pillClass: string; progressColor: string }
> = {
  health: { icon: "water_drop", color: "var(--color-error)", bg: "rgba(255,180,171,0.10)", pillClass: "cat-health", progressColor: "var(--color-error)" },
  fitness: { icon: "fitness_center", color: "var(--color-secondary)", bg: "rgba(78,222,163,0.10)", pillClass: "cat-fitness", progressColor: "var(--color-secondary)" },
  work: { icon: "work", color: "var(--color-primary)", bg: "rgba(192,193,255,0.10)", pillClass: "cat-work", progressColor: "var(--color-primary)" },
  learning: { icon: "menu_book", color: "var(--color-primary)", bg: "rgba(192,193,255,0.12)", pillClass: "cat-learning", progressColor: "var(--color-primary)" },
  finance: { icon: "savings", color: "var(--color-tertiary)", bg: "rgba(255,182,144,0.10)", pillClass: "cat-finance", progressColor: "var(--color-tertiary)" },
  routine: { icon: "repeat", color: "var(--color-on-surface-variant)", bg: "rgba(199,196,215,0.08)", pillClass: "cat-routine", progressColor: "var(--color-on-surface-variant)" },
};

const DEFAULT_CONFIG = {
  icon: "flag",
  color: "var(--color-primary)",
  bg: "rgba(192,193,255,0.10)",
  pillClass: "cat-work",
  progressColor: "var(--color-primary)",
};

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onComplete, onDelete, disappearing, onUndo }) => {
  const { t } = useTranslation();
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [tokensLeft, setTokensLeft] = useState<number | null>(null);
  const [frozenToday, setFrozenToday] = useState(false);
  const [freezeError, setFreezeError] = useState<string | null>(null);

  const catKey = goal.category.toLowerCase();
  const config = CATEGORY_CONFIG[catKey] || DEFAULT_CONFIG;

  const isCompleted = goal.current_count >= goal.target_count;
  const isDisappearing = Boolean(disappearing);
  const percentage =
    goal.target_count > 0
      ? Math.min(100, Math.round((goal.current_count / goal.target_count) * 100))
      : 0;
  const currentStreak = goal.streak?.current_streak || 0;
  const longestStreak = goal.streak?.longest_streak || 0;
  const currentHour = new Date().getHours();
  const showFreezeButton = currentHour >= 18 && !isCompleted && currentStreak > 0;

  useEffect(() => {
    if (!showFreezeButton) return;

    api.get("/api/freeze/tokens")
      .then((res) => setTokensLeft(res.data.tokens_left))
      .catch(() => { });

    api.get(`/api/freeze/dates?goal_id=${goal.id}`)
      .then((res) => {
        const today = new Date().toISOString().split("T")[0];
        setFrozenToday(res.data.frozen_dates.includes(today));
      })
      .catch(() => { });
  }, [showFreezeButton, goal.id]);

  const handleComplete = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await onComplete(goal.id, noteText.trim() || undefined);
      setNoteText("");
      setShowNoteInput(false);
    } catch (err) {
      console.error("Failed to complete progress:", err);
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t("goals.confirmDelete"))) {
      setDeleting(true);
      try {
        await onDelete(goal.id);
      } catch (err) {
        console.error("Failed to delete:", err);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleFreezeToday = async () => {
    setFreezing(true);
    setFreezeError(null);
    try {
      const res = await api.post("/api/freeze/activate", { goal_id: goal.id });
      setTokensLeft(res.data.tokens_left);
      setFrozenToday(true);
      window.dispatchEvent(new CustomEvent("freeze-tokens-updated", { detail: res.data.tokens_left }));
    } catch (err: any) {
      setFreezeError(err.response?.data?.message || "Cannot activate Freeze Token.");
    } finally {
      setFreezing(false);
    }
  };

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: "20px 24px",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...(isCompleted
          ? { borderColor: "rgba(78,222,163,0.2)", boxShadow: "0 0 0 0 transparent" }
          : {}),
      }}
      onMouseEnter={(e) => {
        if (!isCompleted && !isDisappearing)
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 8px 32px rgba(192,193,255,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top accent line when completed */}
      {isCompleted && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background:
              "linear-gradient(90deg, var(--color-secondary) 0%, transparent 80%)",
          }}
        />
      )}

      {isDisappearing && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "14px",
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(78,222,163,0.24)",
            background:
              "linear-gradient(90deg, rgba(78,222,163,0.12), rgba(192,193,255,0.08))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <CheckCircle size={16} style={{ color: "var(--color-secondary)", flexShrink: 0 }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--color-on-surface)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {t("goalCard.hideIn", { sec: disappearing?.secondsLeft ?? 0 })}
            </span>
          </div>
          <button
            type="button"
            onClick={onUndo}
            className="btn-ghost"
            style={{
              padding: "6px 10px",
              fontSize: "11px",
              borderRadius: "8px",
              border: "1px solid var(--color-outline-variant)",
              flexShrink: 0,
            }}
            title={t("common.undo")}
          >
            <Undo2 size={12} />
            {t("common.undo")}
          </button>
        </div>
      )}

      {/* ── Row 1: Icon + Info + Actions ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        {/* Left: Icon + title + meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Icon bubble */}
          <div
            style={{
              width: "48px",
              height: "48px",
              minWidth: "48px",
              borderRadius: "50%",
              background: config.bg,
              border: `1px solid color-mix(in srgb, ${config.color} 30%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              className="material-symbols-outlined ms-filled"
              style={{ fontSize: "22px", color: config.color }}
            >
              {config.icon}
            </span>
          </div>

          {/* Title + tags */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: isCompleted
                  ? "var(--color-on-surface-variant)"
                  : "var(--color-on-surface)",
                textDecoration: isCompleted ? "line-through" : "none",
                marginBottom: "5px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {goal.title}
            </h3>

            {/* Reminder time badge — chỉ hiện nếu có reminder_time riêng */}
            {goal.reminder_time && (
              <div
                className="flex items-center gap-1 text-[10px] mb-2"
                style={{ color: 'var(--color-on-surface-variant)', opacity: 0.8 }}
                title="Giờ nhắc nhở riêng"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  alarm
                </span>
                <span>{goal.reminder_time}</span>
              </div>
            )}

            {goal.description && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-on-surface-variant)",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  marginBottom: "6px",
                }}
              >
                {goal.description}
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
              <span className={`cat-pill ${config.pillClass}`}>
                {goal.category}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--color-outline)",
                }}
              >
                {goal.frequency}
              </span>
              {goal.group_id && (
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    backgroundColor: "rgba(99, 102, 241, 0.12)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="This goal belongs to an Accountability Habit Group"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>group</span>
                  {t("goalCard.groupHabit")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Progress % + Actions */}
        <div
          className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto"
        >
          {/* Progress column */}
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: isCompleted ? "var(--color-secondary)" : config.color,
              }}
            >
              {percentage}%
            </span>
            <div
              style={{
                width: "120px",
                height: "4px",
                background: "var(--color-surface-container-high)",
                borderRadius: "9999px",
                overflow: "hidden",
                marginTop: "6px",
              }}
            >
              <motion.div
                style={{
                  height: "100%",
                  borderRadius: "9999px",
                  background: isCompleted
                    ? "var(--color-secondary)"
                    : config.progressColor,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "var(--color-outline)",
                marginTop: "4px",
                textAlign: "right",
              }}
            >
              {goal.current_count} / {goal.target_count}
            </p>
          </div>

          {!isDisappearing && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", gap: "2px" }}>
                <Link
                  to={`/edit-goal/${goal.id}`}
                  className="btn-ghost"
                  style={{ padding: "5px", borderRadius: "8px" }}
                  title={t("common.edit")}
                >
                  <Edit2 size={13} />
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-danger-ghost"
                  style={{ padding: "5px", borderRadius: "8px" }}
                  title={t("common.delete")}
                >
                  {deleting ? (
                    <div
                      className="spinner"
                      style={{ width: "13px", height: "13px" }}
                    />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>

              {isCompleted ? (
                <div className="goal-met-badge" style={{ fontSize: "10px", padding: "3px 8px" }}>
                  <CheckCircle size={11} />
                  <span>{t("goalCard.met")}</span>
                </div>
              ) : (
                <>
                  <button
                    className="btn-primary"
                    onClick={handleComplete}
                    disabled={completing}
                    style={{ padding: "5px 12px", fontSize: "11px" }}
                  >
                    {completing ? (
                      <div
                        className="spinner"
                        style={{ width: "11px", height: "11px" }}
                      />
                    ) : (
                      <Plus size={12} />
                    )}
                    {t("goalCard.checkIn")}
                  </button>
                  {showFreezeButton && (
                    <button
                      type="button"
                      onClick={handleFreezeToday}
                      disabled={freezing || frozenToday || tokensLeft === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={
                        frozenToday
                          ? "Already frozen today"
                          : tokensLeft === 0
                            ? "No Freeze Tokens left this month"
                            : `Use 1 token to protect streak (${tokensLeft ?? "..."} left)`
                      }
                    >
                      {frozenToday ? "❄ Protected" : `❄ Protect Streak${tokensLeft !== null ? ` (${tokensLeft})` : ""}`}
                    </button>
                  )}
                  {freezeError && (
                    <span className="text-[10px] text-red-400 max-w-[140px] text-center">
                      {freezeError}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Streak info + Note toggle ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "14px",
          borderTop: "1px solid var(--border-subtle)",
          marginTop: "4px",
        }}
      >
        {/* Streak */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          {currentStreak > 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                color: "var(--color-tertiary)",
                fontSize: "12px",
                fontWeight: 600,
              }}
              title={`Longest: ${longestStreak} days`}
            >
              <Flame
                size={14}
                style={{ fill: "rgba(255,182,144,0.25)", flexShrink: 0 }}
              />
              <span>{t("goalCard.streakDays", { days: currentStreak })}</span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                color: "var(--color-outline)",
                fontSize: "12px",
              }}
            >
              <Flame size={14} style={{ opacity: 0.3 }} />
              <span>{t("goalCard.noStreak")}</span>
            </div>
          )}
          {longestStreak > 1 && (
            <span
              style={{ fontSize: "10px", color: "var(--color-outline)" }}
            >
              {t("goalCard.bestStreak", { days: longestStreak })}
            </span>
          )}
        </div>

        {/* Note toggle */}
        {!isDisappearing && (
          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="btn-ghost"
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              gap: "5px",
              borderRadius: "9999px",
              border: showNoteInput
                ? "1px solid var(--color-outline-variant)"
                : "1px solid transparent",
              background: showNoteInput
                ? "var(--color-surface-container-high)"
                : "transparent",
            }}
            title={t("common.note")}
          >
            <MessageSquare size={12} />
            {t("common.note")}
          </button>
        )}
      </div>

      {/* ── Row 3: Note input (conditional) ── */}
      {showNoteInput && !isDisappearing && (
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            gap: "8px",
            paddingTop: "12px",
          }}
        >
          <input
            type="text"
            placeholder={t("common.notePlaceholder")}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComplete()}
            className="m-input"
            style={{ flex: 1, fontSize: "12px", padding: "8px 12px" }}
            autoFocus
          />
          <button
            className="btn-primary"
            onClick={handleComplete}
            disabled={completing}
            style={{ padding: "8px 16px", fontSize: "12px" }}
          >
            {completing ? (
              <div
                className="spinner"
                style={{ width: "12px", height: "12px" }}
              />
            ) : (
              t("common.save")
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalCard;
