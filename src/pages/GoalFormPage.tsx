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

  const { goals, createGoal, updateGoal, loading, error, isOffline, clearError } = useGoalStore();

  // Treat as effectively offline when: browser says offline OR store has a connection error
  const isConnectionError = Boolean(
    error &&
    (
      error.toLowerCase().includes("unable to connect") ||
      error.toLowerCase().includes("network") ||
      error.toLowerCase().includes("database server") ||
      error.toLowerCase().includes("check your") ||
      error.toLowerCase().includes("try again")
    )
  );
  const effectivelyOffline = isOffline || isConnectionError;

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
    // Clear any previous store errors when mounting GoalFormPage
    clearError();
  }, []);

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

    if (!navigator.onLine) {
      useGoalStore.setState({ 
        error: "Unable to connect to the database server. Please check your network connection and try again." 
      });
      return;
    }

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

  if (effectivelyOffline) {
    return (
      <div className="min-h-screen bg-background text-on-background py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full glass-card p-8 text-center space-y-4">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
            <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>cloud_off</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">Connection Required</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Creating or editing goals requires a connection to the server database. 
            Please check your network connection and try again when you are back online.
          </p>
          <div className="pt-2">
            <Link to="/" className="btn-primary inline-flex">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
 
        {/* Content Card Form */}
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-on-surface tracking-tight">
                {isEdit ? "Edit your Goal" : "Create a Target Goal"}
              </h1>
              <p className="text-xs text-on-surface-variant">
                Define actionable micro-goals with distinct target frequencies.
              </p>
            </div>
          </div>
 
          {error && !isConnectionError && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg text-center">
              {error}
            </div>
          )}
          {isConnectionError && (
            <div className="mb-6 p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold rounded-lg text-center flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>wifi_off</span>
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
                className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                placeholder="Details or notes about your goal..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="m-input min-h-[100px] resize-y"
              />
            </div>
 
            {/* Category selection and Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 w-[12px]" /> Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="m-input cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-surface-container-high text-on-surface">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
 
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 w-[12px]" /> Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="m-input cursor-pointer"
                >
                  <option value="daily" className="bg-surface-container-high text-on-surface">Daily</option>
                  <option value="weekly" className="bg-surface-container-high text-on-surface">Weekly</option>
                  <option value="monthly" className="bg-surface-container-high text-on-surface">Monthly</option>
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
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="m-input"
                />
              </div>
            </div>
 
            {/* Buttons panel */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <Link to="/">
                <Button variant="ghost" type="button" disabled={loading} className="text-on-surface-variant hover:text-on-surface">
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
