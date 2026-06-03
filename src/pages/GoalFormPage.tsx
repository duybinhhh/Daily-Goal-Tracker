// src/pages/GoalFormPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Target, Sparkles, BookOpen, Clock, Tag } from "lucide-react";
import { useGoalStore } from "../store/goalStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";

export const GoalFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { goals, createGoal, updateGoal, loading, error } = useGoalStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Learning",
    target_count: 1,
    frequency: "daily",
    due_date: "",
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEdit && id) {
      const activeGoal = goals.find((g) => g.id === id);
      if (activeGoal) {
        setFormData({
          title: activeGoal.title || "",
          description: activeGoal.description || "",
          category: activeGoal.category || "Learning",
          target_count: activeGoal.target_count || 1,
          frequency: activeGoal.frequency || "daily",
          due_date: activeGoal.due_date ? activeGoal.due_date.split("T")[0] : "",
        });
      } else {
        // Fallback navigate back if goal not found
        navigate("/");
      }
    }
  }, [isEdit, id, goals, navigate]);

  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errors.title = "Goal title is required.";
    } else if (formData.title.length < 3) {
      errors.title = "Goal title must be at least 3 characters.";
    }

    if (!formData.category) {
      errors.category = "Category selection is required.";
    }

    if (!formData.target_count || formData.target_count <= 0) {
      errors.target_count = "Target count must be at least 1.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        ...formData,
        target_count: Number(formData.target_count),
        due_date: formData.due_date || null,
      };

      if (isEdit && id) {
        await updateGoal(id, payload);
      } else {
        await createGoal(payload);
      }
      navigate("/");
    } catch (err) {
      console.error("Failed to commit goal action:", err);
    }
  };

  const categories = ["Learning", "Fitness", "Work", "Health", "Finance", "Routine"];

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Content Card Form */}
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isEdit ? "Edit your Goal" : "Create a Target Goal"}
              </h1>
              <p className="text-xs text-slate-400">
                Define actionable micro-goals with distinct target frequencies.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="relative">
              <Input
                id="title"
                label="Goal Title"
                placeholder="E.g., Read a structural book, Workout plank..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={formErrors.title}
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col">
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                placeholder="Details or notes about your goal..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-slate-700"
              />
            </div>

            {/* Category selection and Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 w-[12px]" /> Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-slate-700"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 w-[12px]" /> Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-slate-700"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Target count and Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Input
                  id="target_count"
                  type="number"
                  label="Target frequency completions today"
                  min="1"
                  value={formData.target_count}
                  onChange={(e) => setFormData({ ...formData, target_count: Math.max(1, parseInt(e.target.value) || 1) })}
                  error={formErrors.target_count}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-slate-700"
                />
              </div>
            </div>

            {/* Buttons panel */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
              <Link to="/">
                <Button variant="ghost" type="button" disabled={loading} className="text-slate-400 hover:text-white">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" isLoading={loading}>
                {isEdit ? "Update Goal" : "Save Goal"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default GoalFormPage;
