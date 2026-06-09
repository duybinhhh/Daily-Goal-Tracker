// src/pages/GoalFormPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Target, Sparkles, BookOpen, Clock, Tag } from "lucide-react";
import { useGoalStore } from "../store/goalStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { useTranslation } from "../i18n";
import { GoalTemplateModal } from "../components/GoalTemplateModal";
import type { GoalTemplate } from "../data/goalTemplates";

export const GoalFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { goals, createGoal, updateGoal, loading, error, isOffline, clearError } = useGoalStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Learning",
    target_count: 1,
    frequency: "daily",
    due_date: "",
    reminder_time: "",   // ← thêm mới, chuỗi "HH:mm" hoặc ""
  });

  // Treat as effectively offline when: browser says offline OR store has a connection error
  const isConnectionError = Boolean(
    error &&
    (
      error.toLowerCase().includes("unable to connect") ||
      error.toLowerCase().includes("network") ||
      error.toLowerCase().includes("database server") ||
      error.toLowerCase().includes("check your") ||
      error.toLowerCase().includes("try again") ||
      // Vietnamese keywords for connection/server errors
      error.toLowerCase().includes("kết nối") ||
      error.toLowerCase().includes("máy chủ") ||
      error.toLowerCase().includes("mạng") ||
      error.toLowerCase().includes("thử lại")
    )
  );
  
  // State to force-bypass the offline check if the browser is lying
  const [ignoreOffline, setIgnoreOffline] = useState(false);
  
  // Show full-page block ONLY if browser is hard-offline and user hasn't started typing yet
  // or if we are in Edit mode and cannot fetch the goal.
  const isHardOffline = isOffline && !formData.title && !ignoreOffline;
  const effectivelyOffline = isHardOffline;

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);

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
          reminder_time: activeGoal.reminder_time || "",
        });
      } else {
        // Fallback navigate back if goal not found
        navigate("/");
      }
    }
  }, [isEdit, id, goals, navigate]);

  const handleApplyTemplate = (template: GoalTemplate) => {
    setFormData({
      title: template.title,
      description: template.description,
      category: template.category,
      target_count: template.target_count,
      frequency: template.frequency,
      due_date: "", // không pre-fill due_date – user tự điền
      reminder_time: "",
    });
    setFormErrors({}); // xoá validation errors cũ nếu có
    setShowTemplateModal(false);
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errors.title = t("goals.titleRequired");
    } else if (formData.title.length < 3) {
      errors.title = t("goals.titleTooShort");
    }

    if (!formData.category) {
      errors.category = t("goals.categoryRequired");
    }

    if (!formData.target_count || formData.target_count <= 0) {
      errors.target_count = t("goals.targetCountMin");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!navigator.onLine) {
      useGoalStore.setState({ 
        error: t("goals.offlineFormError")
      });
      return;
    }

    try {
      const payload = {
        ...formData,
        target_count: Number(formData.target_count),
        due_date: formData.due_date || null,
        reminder_time: formData.reminder_time || null,
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
          <h2 className="text-lg font-bold text-on-surface">{t("goals.connectionRequired")}</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {t("goals.offlineFormError")}
          </p>
          <div className="pt-4 flex flex-col gap-3">
            <Link to="/" className="btn-primary w-full justify-center">
              {t("goals.backToDashboard")}
            </Link>
            <button
              onClick={() => setIgnoreOffline(true)}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4"
            >
              Tôi vẫn đang online, cho tôi tiếp tục
            </button>
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
          {t("goals.backToDashboard")}
        </Link>
 
        {/* Content Card Form */}
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-on-surface tracking-tight">
                {isEdit ? t("goals.editGoal") : t("goals.newGoal")}
              </h1>
              <p className="text-xs text-on-surface-variant">
                {t("goals.formSubtitle")}
              </p>
            </div>
          </div>

          {/* Template Button – chỉ hiện ở Create mode, không hiện khi Edit */}
          {!isEdit && (
            <div className="mb-5 pb-5" style={{ borderBottom: "1px solid var(--color-outline-variant)" }}>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border border-dashed hover:border-primary hover:bg-primary/5"
                style={{
                  borderColor: "var(--color-outline-variant)",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                <Sparkles className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                Chọn từ Template có sẵn
              </button>
            </div>
          )}
 
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
                label={t("goals.goalTitle")}
                placeholder={t("goals.goalTitlePlaceholder")}
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
                {t("goals.description")} ({t("common.optional")})
              </label>
              <textarea
                id="description"
                placeholder={t("goals.descriptionPlaceholder")}
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
                  <Tag className="w-3 w-[12px]" /> {t("goals.category")}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="m-input cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-surface-container-high text-on-surface">
                      {t("category." + cat.toLowerCase())}
                    </option>
                  ))}
                </select>
              </div>
 
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 w-[12px]" /> {t("goals.frequency")}
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="m-input cursor-pointer"
                >
                  <option value="daily" className="bg-surface-container-high text-on-surface">{t("common.daily")}</option>
                  <option value="weekly" className="bg-surface-container-high text-on-surface">{t("common.weekly")}</option>
                  <option value="monthly" className="bg-surface-container-high text-on-surface">{t("common.monthly")}</option>
                </select>
              </div>
            </div>
 
            {/* Target count and Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Input
                  id="target_count"
                  type="number"
                  label={t("goals.targetCount")}
                  min="1"
                  value={formData.target_count}
                  onChange={(e) => setFormData({ ...formData, target_count: Math.max(1, parseInt(e.target.value) || 1) })}
                  error={formErrors.target_count}
                  required
                />
              </div>
 
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  {t("goals.dueDateOptional")}
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="m-input"
                />
              </div>
            </div>

            {/* Reminder Time */}
            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: 'var(--color-on-surface)' }}
              >
                <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                Nhắc nhở lúc
                <span
                  className="text-xs font-normal"
                  style={{ color: 'var(--color-on-surface-variant)' }}
                >
                  (Tùy chọn — mặc định nhắc chung lúc 21h)
                </span>
              </label>
              <Input
                type="time"
                value={formData.reminder_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reminder_time: e.target.value }))
                }
                placeholder="Chọn giờ nhắc nhở"
                style={{ maxWidth: '160px' }}
              />
              {formData.reminder_time && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, reminder_time: "" }))}
                  className="text-xs flex items-center gap-1"
                  style={{ color: 'var(--color-on-surface-variant)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  Xóa giờ nhắc riêng (dùng lại nhắc 21h)
                </button>
              )}
            </div>
 
            {/* Buttons panel */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <Link to="/">
                <Button variant="ghost" type="button" disabled={loading} className="text-on-surface-variant hover:text-on-surface">
                  {t("common.cancel")}
                </Button>
              </Link>
              <Button variant="primary" type="submit" isLoading={loading}>
                {isEdit ? t("goals.saveGoal") : t("goals.createGoal")}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <GoalTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onApply={handleApplyTemplate}
      />
    </div>
  );
};

export default GoalFormPage;
