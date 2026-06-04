// src/components/GoalCard.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Edit2, Trash2, CheckCircle, Plus, MessageSquare } from "lucide-react";
import { Goal } from "../types";
import { motion } from "motion/react";

interface GoalCardProps {
  goal: Goal;
  onComplete: (id: string, note?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string; pillClass: string; progressColor: string }
> = {
  health:   { icon: "water_drop",     color: "var(--color-error)",     bg: "rgba(255,180,171,0.10)", pillClass: "cat-health",   progressColor: "var(--color-error)" },
  fitness:  { icon: "fitness_center", color: "var(--color-secondary)", bg: "rgba(78,222,163,0.10)",  pillClass: "cat-fitness",  progressColor: "var(--color-secondary)" },
  work:     { icon: "work",           color: "var(--color-primary)",   bg: "rgba(192,193,255,0.10)", pillClass: "cat-work",     progressColor: "var(--color-primary)" },
  learning: { icon: "menu_book",      color: "var(--color-primary)",   bg: "rgba(192,193,255,0.12)", pillClass: "cat-learning", progressColor: "var(--color-primary)" },
  finance:  { icon: "savings",        color: "var(--color-tertiary)",  bg: "rgba(255,182,144,0.10)", pillClass: "cat-finance",  progressColor: "var(--color-tertiary)" },
  routine:  { icon: "repeat",         color: "var(--color-on-surface-variant)", bg: "rgba(199,196,215,0.08)", pillClass: "cat-routine", progressColor: "var(--color-on-surface-variant)" },
};

const DEFAULT_CONFIG = {
  icon: "flag",
  color: "var(--color-primary)",
  bg: "rgba(192,193,255,0.10)",
  pillClass: "cat-work",
  progressColor: "var(--color-primary)",
};

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onComplete, onDelete }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const catKey = goal.category.toLowerCase();
  const config = CATEGORY_CONFIG[catKey] || DEFAULT_CONFIG;

  const isCompleted = goal.current_count >= goal.target_count;
  const percentage =
    goal.target_count > 0
      ? Math.min(100, Math.round((goal.current_count / goal.target_count) * 100))
      : 0;
  const currentStreak = goal.streak?.current_streak || 0;
  const longestStreak = goal.streak?.longest_streak || 0;

  const handleComplete = async () => {
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
    if (window.confirm(`Delete goal "${goal.title}"?`)) {
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
        if (!isCompleted)
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

      {/* ── Row 1: Icon + Info + Actions ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            </div>
          </div>
        </div>

        {/* Right: Progress % + Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexShrink: 0,
          }}
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

          {/* Action buttons */}
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
                title="Edit"
              >
                <Edit2 size={13} />
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger-ghost"
                style={{ padding: "5px", borderRadius: "8px" }}
                title="Delete"
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
                <span>Met</span>
              </div>
            ) : (
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
                Log
              </button>
            )}
          </div>
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
              <span>{currentStreak}d streak</span>
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
              <span>No streak yet</span>
            </div>
          )}
          {longestStreak > 1 && (
            <span
              style={{ fontSize: "10px", color: "var(--color-outline)" }}
            >
              best: {longestStreak}d
            </span>
          )}
        </div>

        {/* Note toggle */}
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
          title="Add note"
        >
          <MessageSquare size={12} />
          Note
        </button>
      </div>

      {/* ── Row 3: Note input (conditional) ── */}
      {showNoteInput && (
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
            placeholder="E.g., ran 5km, read 20 pages…"
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
              "Save"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalCard;
