// src/components/GoalCard.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Trash2, CheckCircle, Flame, Plus, MessageSquare } from "lucide-react";
import { Goal } from "../types";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { Button } from "./ui/Button";

interface GoalCardProps {
  goal: Goal;
  onComplete: (id: string, note?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onComplete, onDelete }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (window.confirm(`Are you sure you want to delete the goal "${goal.title}"?`)) {
      setDeleting(true);
      try {
        await onDelete(goal.id);
      } catch (err) {
        console.error("Failed to delete goal:", err);
      } finally {
        setDeleting(false);
      }
    }
  };

  const isCompleted = goal.current_count >= goal.target_count;
  const currentStreakVal = goal.streak?.current_streak || 0;
  const longestStreakVal = goal.streak?.longest_streak || 0;

  // Aesthetic category lookups
  const categoryStyles: { [key: string]: string } = {
    health: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    fitness: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    work: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    learning: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    finance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    routine: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const catKey = goal.category.toLowerCase();
  const categoryPillClass = categoryStyles[catKey] || "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  return (
    <Card hoverable className="relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]">
      <div>
        {/* Top Header section */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${categoryPillClass}`}>
              {goal.category}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {goal.frequency}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/edit-goal/${goal.id}`}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-all"
              title="Edit Goal"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-md transition-all disabled:opacity-30"
              title="Delete Goal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-4">
          <h3 className={`text-base font-semibold text-slate-100 mb-1 ${isCompleted ? "line-through text-slate-400" : ""}`}>
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-xs text-slate-400 font-normal leading-relaxed line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-4">
        {/* Progress Bar integration */}
        <ProgressBar value={goal.current_count} max={goal.target_count} />

        {/* Streak indicator and progress button panel */}
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800/50">
          <div className="flex items-center gap-3">
            {currentStreakVal > 0 ? (
              <div className="flex items-center gap-1 text-amber-400 font-semibold text-xs py-0.5" title={`Current streak: ${currentStreakVal} days. Longest: ${longestStreakVal} days`}>
                <Flame className="w-4 h-4 fill-amber-500/25" />
                <span>{currentStreakVal}d</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-500 text-xs py-0.5">
                <Flame className="w-4 h-4 opacity-30" />
                <span>0d</span>
              </div>
            )}

            {longestStreakVal > 0 && (
              <span className="text-[10px] text-slate-500">
                L: {longestStreakVal}d
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className={`p-1.5 rounded-lg border text-slate-400 hover:text-white transition-all ${
                showNoteInput ? "bg-slate-800 border-slate-700" : "bg-transparent border-transparent"
              }`}
              title="Add Completion Note"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {isCompleted ? (
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Goal Met</span>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                isLoading={completing}
                onClick={handleComplete}
                className="shadow-md h-[32px] px-3 font-semibold text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Log Progress
              </Button>
            )}
          </div>
        </div>

        {/* Dynamic inline note input */}
        {showNoteInput && (
          <div className="pt-2 animate-fadeIn border-t border-slate-800/20 flex gap-2">
            <input
              type="text"
              placeholder="E.g., Read chapter 2, did 5km run..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleComplete}
              isLoading={completing}
              className="py-1 px-2.5 text-xs h-[28px]"
            >
              Save
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GoalCard;
