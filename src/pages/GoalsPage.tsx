// src/pages/GoalsPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoals } from "../hooks/useGoals";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { useTranslation } from "../i18n";

const CATEGORY_ICONS: Record<string, string> = {
  health: "water_drop",
  fitness: "fitness_center",
  work: "work",
  learning: "menu_book",
  finance: "savings",
  routine: "repeat",
  wellness: "spa",
  hobby: "music_note",
  product: "business_center",
  development: "code",
};

const getCategoryIcon = (category: string) => {
  return CATEGORY_ICONS[category.toLowerCase()] || "flag";
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  health: { bg: "rgba(255, 180, 171, 0.1)", text: "var(--color-error)", border: "rgba(255, 180, 171, 0.2)" },
  fitness: { bg: "rgba(78, 222, 163, 0.1)", text: "var(--color-secondary)", border: "rgba(78, 222, 163, 0.2)" },
  work: { bg: "rgba(192, 193, 255, 0.1)", text: "var(--color-primary)", border: "rgba(192, 193, 255, 0.2)" },
  learning: { bg: "rgba(192, 193, 255, 0.12)", text: "var(--color-primary)", border: "rgba(192, 193, 255, 0.25)" },
  finance: { bg: "rgba(255, 182, 144, 0.1)", text: "var(--color-tertiary)", border: "rgba(255, 182, 144, 0.2)" },
  routine: { bg: "rgba(199, 196, 215, 0.08)", text: "var(--color-on-surface-variant)", border: "rgba(199, 196, 215, 0.2)" },
  wellness: { bg: "rgba(78, 222, 163, 0.1)", text: "var(--color-secondary)", border: "rgba(78, 222, 163, 0.2)" },
  hobby: { bg: "rgba(199, 196, 215, 0.08)", text: "var(--color-on-surface-variant)", border: "rgba(199, 196, 215, 0.2)" },
  product: { bg: "rgba(192, 193, 255, 0.1)", text: "var(--color-primary)", border: "rgba(192, 193, 255, 0.2)" },
  development: { bg: "rgba(192, 193, 255, 0.1)", text: "var(--color-primary)", border: "rgba(192, 193, 255, 0.2)" },
};

const getCategoryStyles = (category: string) => {
  return CATEGORY_COLORS[category.toLowerCase()] || { bg: "rgba(192, 193, 255, 0.1)", text: "var(--color-primary)", border: "rgba(192, 193, 255, 0.2)" };
};

export default function GoalsPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isOffline } = useGoalStore();
  const {
    activeGoalsList,
    archivedGoalsList,
    loading,
    error,
    refreshAll,
    completeGoalProgress,
    deleteGoal,
    updateGoal,
    archiveGoal,
    restoreGoal,
    bulkArchiveGoals,
    bulkPauseGoals,
    bulkDeleteGoals,
  } = useGoals();

  const [currentTab, setCurrentTab] = useState<"active" | "archived">("active");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [sortBy, setSortBy] = useState<"priority" | "recent" | "streak">("priority");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [offlineActionMsg, setOfflineActionMsg] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (isOffline) {
      setOfflineActionMsg(t("goals.offlinePauseError"));
      setActiveMenuId(null);
      return;
    }
    const nextStatus = currentStatus === "paused" ? "active" : "paused";
    try {
      await updateGoal(id, { status: nextStatus });
      setActiveMenuId(null);
    } catch (err) {
      console.error("Failed to toggle goal status:", err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (isOffline) {
      setOfflineActionMsg(t("goals.offlineDeleteError"));
      setActiveMenuId(null);
      return;
    }
    if (window.confirm(t("goals.confirmDelete"))) {
      try {
        await deleteGoal(id);
        setActiveMenuId(null);
      } catch (err) {
        console.error("Failed to delete goal:", err);
      }
    }
  };

  const handleLogProgress = async (id: string) => {
    try {
      await completeGoalProgress(id);
    } catch (err) {
      console.error("Failed to log progress:", err);
    }
  };

  // Get distinct categories based on current tab
  const activeList = currentTab === "active" ? activeGoalsList : archivedGoalsList;
  const categories = ["All", ...Array.from(new Set(activeList.map((g) => g.category)))];

  // Counts for tabs
  const totalCount = activeGoalsList.length;
  const activeCount = activeGoalsList.filter((g) => g.status === "active").length;
  const pausedCount = activeGoalsList.filter((g) => g.status === "paused").length;
  const archivedCount = archivedGoalsList.length;

  // Filter & Search Logic
  const filteredAndSearchedGoals = activeList.filter((goal) => {
    // 1. Status Filter (only applies to active tab)
    if (currentTab === "active") {
      if (statusFilter === "active" && goal.status !== "active") return false;
      if (statusFilter === "paused" && goal.status !== "paused") return false;
    }

    // 2. Category Filter
    if (activeCategory !== "All" && goal.category.toLowerCase() !== activeCategory.toLowerCase()) return false;

    // 3. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = goal.title.toLowerCase().includes(query);
      const descMatch = goal.description?.toLowerCase().includes(query) || false;
      return titleMatch || descMatch;
    }

    return true;
  });

  // Sorting Logic
  const sortedGoals = [...filteredAndSearchedGoals].sort((a, b) => {
    if (sortBy === "priority") {
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return b.target_count - a.target_count;
    } else if (sortBy === "recent") {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    } else if (sortBy === "streak") {
      return (b.streak?.current_streak || 0) - (a.streak?.current_streak || 0);
    }
    return 0;
  });

  // Selection Logic
  const toggleSelection = (id: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: "archive" | "pause" | "delete" | "restore") => {
    if (isOffline) {
      setOfflineActionMsg("Cannot perform bulk actions offline.");
      return;
    }
    try {
      if (action === "archive") await bulkArchiveGoals(selectedGoalIds);
      if (action === "pause") await bulkPauseGoals(selectedGoalIds);
      if (action === "restore") {
        await Promise.all(selectedGoalIds.map(id => restoreGoal(id)));
      }
      if (action === "delete") {
        await bulkDeleteGoals(selectedGoalIds);
        setShowBulkDeleteModal(false);
      }
      setSelectedGoalIds([]);
      setIsSelectionMode(false);
    } catch (err) {
      console.error("Bulk action failed:", err);
    }
  };

  // Overall Statistics logic
  const bestCurrentStreak = Math.max(0, ...activeGoalsList.map((g) => g.streak?.current_streak || 0));
  const activeGoals = activeGoalsList.filter((g) => g.status !== "paused");
  const totalProgress = activeGoals.reduce((acc, g) => acc + (g.current_count / g.target_count), 0);
  const overallCompletionRate = activeGoals.length > 0 ? Math.round((totalProgress / activeGoals.length) * 100) : 0;
  const strokeDashoffset = 440 - (440 * overallCompletionRate) / 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* ── Sticky Header ── */}
      <header
        id="goals-header"
        className="sticky top-0 z-40 flex flex-col md:flex-row md:items-center justify-between gap-4 py-3.5 px-4 md:px-6"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-primary)", letterSpacing: "-0.03em" }}>
            {t("goals.title")}
          </h2>
          <div className="relative w-full sm:w-[240px]">
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-outline)", fontSize: "18px" }}>
              search
            </span>
            <input
              type="text"
              className="m-input"
              style={{ paddingLeft: "36px", paddingRight: "16px", paddingTop: "8px", paddingBottom: "8px", width: "100%", borderRadius: "9999px", fontSize: "13px" }}
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {bestCurrentStreak > 0 && (
            <div className="streak-badge py-1 px-2.5 text-[11px] sm:text-xs">
              <span className="material-symbols-outlined ms-filled" style={{ fontSize: "15px" }}>
                local_fire_department
              </span>
              <span>{t("dashboard.streakBadge")}: {bestCurrentStreak} {t("common.days")}</span>
            </div>
          )}
          {isOffline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: "rgba(255,140,0,0.12)", color: "#fb923c", border: "1px solid rgba(255,140,0,0.25)" }}>
              <WifiOff size={12} />
              {t("common.offline")}
            </div>
          )}
          <button onClick={refreshAll} className="btn-ghost" title={t("common.refresh")}>
            <RefreshCw size={14} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </button>
          {isOffline ? (
            <div className="btn-primary opacity-50 cursor-not-allowed" style={{ pointerEvents: "none" }} title="Network required">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cloud_off</span>
              <span className="hidden sm:inline">{t("goals.newGoal")}</span>
            </div>
          ) : (
            <Link to="/new-goal" className="btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
              <span className="hidden sm:inline">{t("goals.newGoal")}</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── Main Canvas ── */}
      <main className="flex-1 flex flex-col gap-6 py-5 px-4 md:p-6">
        
        {/* Offline Action Error Banner */}
        {offlineActionMsg && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255, 140, 0, 0.08)",
              border: "1px solid rgba(255, 140, 0, 0.25)",
              borderRadius: "0.75rem",
              color: "#fb923c",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <WifiOff size={16} />
              {offlineActionMsg}
            </div>
            <button
              onClick={() => setOfflineActionMsg(null)}
              style={{ fontSize: "18px", lineHeight: 1, cursor: "pointer", opacity: 0.7, background: "none", border: "none", color: "#fb923c" }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Error Banner — orange for connection issues, red for real errors */}
        {error && (() => {
          const isConnErr = error.toLowerCase().includes("unable to connect") ||
            error.toLowerCase().includes("network") ||
            error.toLowerCase().includes("database server") ||
            error.toLowerCase().includes("check your") ||
            error.toLowerCase().includes("try again");
          return (
            <div
              style={{
                padding: "12px 16px",
                background: isConnErr ? "rgba(255, 140, 0, 0.08)" : "rgba(255, 180, 171, 0.08)",
                border: isConnErr ? "1px solid rgba(255, 140, 0, 0.25)" : "1px solid rgba(255, 180, 171, 0.2)",
                borderRadius: "0.75rem",
                color: isConnErr ? "#fb923c" : "var(--color-error)",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isConnErr ? <WifiOff size={16} /> : <AlertCircle size={16} />}
                {error}
              </div>
              <button
                onClick={() => useGoalStore.getState().clearError()}
                style={{ fontSize: "18px", lineHeight: 1, cursor: "pointer", opacity: 0.6, background: "none", border: "none", color: "inherit" }}
              >
                &times;
              </button>
            </div>
          );
        })()}

        {/* Top level tabs and Select button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentTab("active");
                setIsSelectionMode(false);
                setSelectedGoalIds([]);
              }}
              className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
                currentTab === "active" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Đang hoạt động ({totalCount})
            </button>
            <button
              onClick={() => {
                setCurrentTab("archived");
                setIsSelectionMode(false);
                setSelectedGoalIds([]);
              }}
              className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
                currentTab === "archived" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Đã lưu trữ ({archivedCount})
            </button>
          </div>
          <button
            onClick={() => {
              if (isSelectionMode) {
                setIsSelectionMode(false);
                setSelectedGoalIds([]);
              } else {
                setIsSelectionMode(true);
              }
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-variant transition-colors flex items-center gap-1.5 text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">{isSelectionMode ? "close" : "checklist"}</span>
            {isSelectionMode ? "Hủy chọn" : "Chọn nhiều"}
          </button>
        </div>

        {/* Filters & Status Section */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {currentTab === "active" && (
              <>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 rounded-full font-semibold text-xs transition-colors ${
                    statusFilter === "all"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  {t("goals.filterAll")}
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-4 py-2 rounded-full font-semibold text-xs transition-colors ${
                    statusFilter === "active"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  {t("goals.filterActive")} ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter("paused")}
                  className={`px-4 py-2 rounded-full font-semibold text-xs transition-colors ${
                    statusFilter === "paused"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  {t("goals.filterPaused")} ({pausedCount})
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-start sm:justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surface-container-low border-none rounded-full text-xs font-semibold text-on-surface-variant focus:ring-1 focus:ring-primary py-2 px-4 cursor-pointer"
            >
              <option value="priority">{t("goals.sortBy")}: {t("goals.sortPriority")}</option>
              <option value="recent">{t("goals.sortBy")}: {t("goals.sortRecent")}</option>
              <option value="streak">{t("goals.sortBy")}: {t("goals.sortStreak")}</option>
            </select>

            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="bg-surface-container-low border-none rounded-full text-xs font-semibold text-on-surface-variant focus:ring-1 focus:ring-primary py-2 px-4 cursor-pointer"
            >
              <option value="All">{t("goals.category")}: {t("common.all")}</option>
              {categories.filter(c => c !== "All").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Goals Bento Grid */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", gap: "14px", padding: "64px 0" }}>
            <div className="spinner" style={{ width: "32px", height: "32px", color: "var(--color-primary)" }} />
            <p style={{ fontSize: "13px", color: "var(--color-on-surface-variant)" }}>{t("common.loading")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {sortedGoals.map((goal) => {
              const isCompleted = goal.current_count >= goal.target_count;
              const isPaused = goal.status === "paused";
              const percentage = goal.target_count > 0 ? Math.min(100, Math.round((goal.current_count / goal.target_count) * 100)) : 0;
              const currentStreak = goal.streak?.current_streak || 0;
              const catStyle = getCategoryStyles(goal.category);
              
              return (
                <div
                  key={goal.id}
                  className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                    isPaused ? "opacity-60 grayscale-[0.5] hover:grayscale-0 hover:opacity-100" : ""
                  } ${
                    isCompleted && !isPaused ? "border-secondary/30 neon-glow-success" : ""
                  }`}
                  style={{ minHeight: "220px" }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] -mr-16 -mt-16 pointer-events-none"></div>
                  
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      {goal.is_archived ? (
                        <span className="px-3 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-black uppercase tracking-widest rounded-full">
                          {t("common.archived")}
                        </span>
                      ) : isPaused ? (
                        <span className="px-3 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-black uppercase tracking-widest rounded-full">
                          {t("common.paused")}
                        </span>
                      ) : isCompleted ? (
                        <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full border border-secondary/20 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] ms-filled">check_circle</span>
                          {t("goals.completedToday")}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full border border-secondary/20">
                          {t("common.active")}
                        </span>
                      )}

                      <div className="relative" ref={activeMenuId === goal.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === goal.id ? null : goal.id);
                          }}
                          className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-white/5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>

                        {activeMenuId === goal.id && (
                          <div
                            className="absolute right-0 top-8 glass-card py-2 px-3 z-30 flex flex-col gap-1 shadow-2xl"
                            style={{ minWidth: "130px", background: "var(--color-surface-container-high)" }}
                          >
                            {currentTab === "active" && (
                              <>
                                <button
                                  onClick={() => handleToggleStatus(goal.id, goal.status)}
                                  className="flex items-center gap-2 text-xs font-semibold py-1.5 px-2 hover:bg-white/5 rounded text-left w-full text-on-surface"
                                  disabled={isOffline}
                                  style={isOffline ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                                  title={isOffline ? "Requires connection" : undefined}
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    {isPaused ? "play_arrow" : "pause"}
                                  </span>
                                  {isPaused ? t("goals.resumeGoal") : t("goals.pauseGoal")}
                                </button>
                                {isOffline ? (
                                  <div
                                    className="flex items-center gap-2 text-xs font-semibold py-1.5 px-2 rounded text-left w-full"
                                    style={{ opacity: 0.45, cursor: "not-allowed", color: "var(--color-on-surface)" }}
                                    title="Requires connection"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    {t("common.edit")}
                                  </div>
                                ) : (
                                  <Link
                                    to={`/edit-goal/${goal.id}`}
                                    className="flex items-center gap-2 text-xs font-semibold py-1.5 px-2 hover:bg-white/5 rounded text-left w-full text-on-surface"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    {t("common.edit")}
                                  </Link>
                                )}
                                <button
                                  onClick={async () => {
                                    if (isOffline) { setOfflineActionMsg("Cannot archive offline."); return; }
                                    await archiveGoal(goal.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex items-center gap-2 text-xs font-semibold py-1.5 px-2 hover:bg-white/5 rounded text-left w-full text-on-surface"
                                  disabled={isOffline}
                                  style={isOffline ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                                >
                                  <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                                  Lưu trữ
                                </button>
                              </>
                            )}
                            
                            {currentTab === "archived" && (
                              <button
                                onClick={async () => {
                                  if (isOffline) { setOfflineActionMsg("Cannot restore offline."); return; }
                                  await restoreGoal(goal.id);
                                  setActiveMenuId(null);
                                }}
                                className="flex items-center gap-2 text-xs font-semibold py-1.5 px-2 hover:bg-white/5 rounded text-left w-full text-on-surface"
                                disabled={isOffline}
                                style={isOffline ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                              >
                                <span className="material-symbols-outlined text-[16px]">unarchive</span>
                                Khôi phục
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(goal.id, goal.title)}
                              className="flex items-center gap-2 text-xs font-semibold py-1.5 px-2 hover:bg-rose-500/10 hover:text-rose-400 rounded text-left w-full text-rose-400 border-t border-white/5 mt-1 pt-1.5"
                              disabled={isOffline}
                              style={isOffline ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                              title={isOffline ? "Requires connection" : undefined}
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              {t("common.delete")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-on-surface mb-1 line-clamp-1">{goal.title}</h3>
                    <p className="text-xs text-on-surface-variant mb-4 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]" style={{ color: catStyle.text }}>
                        {getCategoryIcon(goal.category)}
                      </span>
                      <span>{goal.category}</span>
                    </p>
                  </div>

                  {/* Card Content & Stats */}
                  <div className="mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t("goals.progress")}</span>
                          <span className="text-xs font-extrabold text-primary">{percentage}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isPaused
                                ? "bg-outline-variant"
                                : isCompleted
                                ? "bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.5)]"
                                : "bg-gradient-to-r from-primary to-secondary"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Streak badge */}
                      <div className="flex items-center gap-0.5 px-2.5 py-1.5 bg-tertiary-container/20 rounded-lg -rotate-2">
                        <span className="material-symbols-outlined text-tertiary text-[18px] ms-filled">local_fire_department</span>
                        <span className="text-tertiary font-bold text-xs">{currentStreak}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      {goal.due_date ? (
                        <>
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {t("goals.dueDate")}: {new Date(goal.due_date).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric" })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">repeat</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">{t("common." + goal.frequency.toLowerCase())}</span>
                        </>
                      )}
                    </div>

                    {!isCompleted && !isPaused && currentTab === "active" && !isSelectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogProgress(goal.id);
                        }}
                        className="btn-primary"
                        style={{ padding: "4px 10px", fontSize: "11px", borderRadius: "8px" }}
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        {t("goalCard.checkIn")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Create New Goal button card */}
            {!isOffline && (
              <button
                onClick={() => navigate("/new-goal")}
                className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary/50 hover:bg-white/5 transition-all group active:scale-95 duration-200"
                style={{ minHeight: "220px" }}
              >
                <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-[28px] group-hover:text-primary">add_circle</span>
                </div>
                <p className="text-md font-bold mb-1">{t("goals.newGoal")}</p>
                <p className="text-xs opacity-60">{t("goals.noGoalsDesc")}</p>
              </button>
            )}

          </div>
        )}

        {/* Featured Achievement Overlay */}
        <div className="mt-6 glass-card rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
          
          {/* Progress Ring Widget */}
          <div className="relative w-36 h-36 shrink-0">
            <svg className="progress-ring w-36 h-36">
              <circle className="text-surface-container-highest" cx="72" cy="72" fill="transparent" r="62" stroke="currentColor" strokeWidth="10"></circle>
              <circle
                className="text-primary transition-all duration-700"
                cx="72"
                cy="72"
                fill="transparent"
                r="62"
                stroke="currentColor"
                strokeDasharray="390"
                strokeDashoffset={390 - (390 * overallCompletionRate) / 100}
                strokeLinecap="round"
                strokeWidth="10"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-on-surface">{overallCompletionRate}%</span>
              <span className="text-[9px] font-black uppercase tracking-tighter text-on-surface-variant">Overall</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-lg font-bold text-on-surface mb-2">{t("dashboard.momentumPeak")}</h2>
            <p className="text-sm text-on-surface-variant mb-4 max-w-lg">
              {t("dashboard.momentumPeakDesc")}
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <div className="flex items-center gap-1.5 bg-surface-container-highest px-3 py-1.5 rounded-full border border-white/10">
                <span className="material-symbols-outlined text-secondary text-[16px]">military_tech</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface">{t("dashboard.eliteStrategist")}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container-highest px-3 py-1.5 rounded-full border border-white/10">
                <span className="material-symbols-outlined text-tertiary text-[16px]">trending_up</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface">+12% {t("dashboard.velocity")}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate("/stats")}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-on-surface rounded-xl font-bold border border-white/10 transition-all backdrop-blur-md text-xs"
          >
            {t("dashboard.viewInsights")}
          </button>
        </div>

      </main>

      {/* Floating Action Button (FAB) - hidden offline */}
      {!isOffline && !isSelectionMode && (
        <button
          onClick={() => navigate("/new-goal")}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_0_24px_rgba(192,193,255,0.4)] flex items-center justify-center group hover:scale-110 active:scale-95 transition-all duration-300 z-40"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 group-hover:opacity-40 pointer-events-none"></div>
        </button>
      )}

      {/* Selection Mode Bulk Action Bar */}
      {isSelectionMode && selectedGoalIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center pointer-events-none">
          <div className="glass-card shadow-2xl rounded-full px-4 py-3 flex items-center gap-4 border border-primary/20 pointer-events-auto bg-surface-container-high/90 backdrop-blur-xl animate-in slide-in-from-bottom-10 fade-in duration-300">
            <span className="text-sm font-bold text-on-surface whitespace-nowrap pl-2">
              Đã chọn {selectedGoalIds.length} mục tiêu
            </span>
            <div className="h-6 w-px bg-white/10 mx-1"></div>
            
            {currentTab === "active" ? (
              <>
                <button
                  onClick={() => handleBulkAction("archive")}
                  className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                  title="Lưu trữ hàng loạt"
                >
                  <span className="material-symbols-outlined">inventory_2</span>
                </button>
                <button
                  onClick={() => handleBulkAction("pause")}
                  className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                  title="Tạm dừng hàng loạt"
                >
                  <span className="material-symbols-outlined">pause</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleBulkAction("restore")}
                className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                title="Khôi phục hàng loạt"
              >
                <span className="material-symbols-outlined">unarchive</span>
              </button>
            )}

            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="p-2 rounded-full hover:bg-rose-500/10 text-on-surface-variant hover:text-rose-400 transition-colors flex items-center justify-center"
              title="Xóa hàng loạt"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
            
            <button
              onClick={() => { setIsSelectionMode(false); setSelectedGoalIds([]); }}
              className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center ml-2"
              title="Hủy"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-on-surface mb-2">Xóa mục tiêu đã chọn?</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Bạn có chắc chắn muốn xóa {selectedGoalIds.length} mục tiêu này không? Hành động này không thể khôi phục.
            </p>
            <div className="max-h-32 overflow-y-auto mb-6 pr-2 custom-scrollbar">
              <ul className="text-sm font-medium text-on-surface space-y-1">
                {selectedGoalIds.map(id => {
                  const goal = activeList.find(g => g.id === id);
                  return <li key={id}>• {goal?.title || "Mục tiêu không xác định"}</li>;
                })}
              </ul>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-white/5 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
