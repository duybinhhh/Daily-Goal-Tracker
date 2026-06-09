// src/pages/TimelinePage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGoalStore } from "../store/goalStore";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "../i18n";
import api from "../services/api";

function getTimelineLogKey(log: { goalId: string; completedAt: string; note: string | null }) {
  return [log.goalId, log.completedAt, (log.note || "").trim()].join("|");
}

export default function TimelinePage() {
  const { t, language } = useTranslation();
  const { user } = useAuthStore();
  const { goals, history, stats, fetchHistory, fetchGoals, fetchStats, deleteLogProgress, isOffline } = useGoalStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [frozenDatesSet, setFrozenDatesSet] = useState<Set<string>>(new Set());

  // Fetch initial data
  useEffect(() => {
    fetchGoals();
    fetchStats();
    api.get("/api/freeze/dates?all=true")
      .then((res) => setFrozenDatesSet(new Set<string>(res.data.frozen_dates)))
      .catch(() => {});
  }, [fetchGoals, fetchStats]);

  // Fetch history when current month/year changes
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    // Get start and end of the selected month
    const fromDate = new Date(year, month, 1).toISOString().split("T")[0];
    const toDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
    fetchHistory(fromDate, toDate);
    // Reset selected day when changing month
    setSelectedDay(null);
  }, [year, month, fetchHistory]);

  const monthName = currentDate.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  });

  // Calendar logic (Monday-first)
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Convert Sun=0 to Mon=0

  const weekdays = language === "vi"
    ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
    : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build a lookup map of history data for fast access by date-string
  const historyMap = useMemo(() => {
    const map = new Map<string, typeof history[0]>();
    history.forEach((h) => {
      map.set(h.date, h);
    });
    return map;
  }, [history]);

  // Get total completed goals in the selected month
  const totalMonthlyCompletions = useMemo(() => {
    let count = 0;
    history.forEach((h) => {
      count += h.count;
    });
    return count;
  }, [history]);

  // Streak from stats
  const bestCurrentStreak = stats?.bestCurrentStreak || 0;

  // Map category to styles and icons
  const getCategoryTheme = (category: string) => {
    const cat = category.toLowerCase();
    switch (cat) {
      case "health":
        return {
          icon: "favorite",
          badgeClass: "cat-health",
          iconColor: "var(--color-error)",
        };
      case "fitness":
        return {
          icon: "fitness_center",
          badgeClass: "cat-fitness",
          iconColor: "var(--color-secondary)",
        };
      case "work":
        return {
          icon: "laptop_mac",
          badgeClass: "cat-work",
          iconColor: "var(--color-primary)",
        };
      case "learning":
        return {
          icon: "school",
          badgeClass: "cat-learning",
          iconColor: "var(--color-primary)",
        };
      case "finance":
        return {
          icon: "payments",
          badgeClass: "cat-finance",
          iconColor: "var(--color-tertiary)",
        };
      default:
        return {
          icon: "schedule",
          badgeClass: "cat-routine",
          iconColor: "var(--color-outline)",
        };
    }
  };

  // Compile all logs in the selected month mapped with goal details
  const allMonthlyLogs = useMemo(() => {
    const logsList: Array<{
      logId: string;
      goalId: string;
      completedAt: string;
      note: string | null;
      goalTitle: string;
      category: string;
    }> = [];

    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();

    history.forEach((h) => {
      h.logs.forEach((log) => {
        const goalInfo = goals.find((g) => g.id === log.goal_id);
        const timelineLog = {
          logId: log.id,
          goalId: log.goal_id,
          completedAt: log.completed_at,
          note: log.note,
          goalTitle: goalInfo?.title || "Completed Goal",
          category: goalInfo?.category || "Routine",
        };
        const dedupeKey = getTimelineLogKey(timelineLog);

        if (seenIds.has(timelineLog.logId) || seenKeys.has(dedupeKey)) {
          return;
        }

        seenIds.add(timelineLog.logId);
        seenKeys.add(dedupeKey);
        logsList.push(timelineLog);
      });
    });

    // Sort chronologically descending (newest first)
    return logsList.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }, [history, goals]);

  // Filter logs based on selection and search query
  const filteredLogs = useMemo(() => {
    return allMonthlyLogs.filter((log) => {
      // 1. Day filter
      if (selectedDay !== null) {
        const logDate = new Date(log.completedAt);
        if (logDate.getDate() !== selectedDay) {
          return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = log.goalTitle.toLowerCase().includes(query);
        const matchesNote = log.note ? log.note.toLowerCase().includes(query) : false;
        return matchesTitle || matchesNote;
      }

      return true;
    });
  }, [allMonthlyLogs, selectedDay, searchQuery]);

  // Handle CSV export of the selected month's logs
  const handleExportCSV = () => {
    setExporting(true);
    setExportSuccess(false);

    try {
      const headers = ["Log ID", "Goal ID", "Goal Title", "Category", "Date Completed", "Time Completed", "Check-in Note"];
      const rows = allMonthlyLogs.map((log) => {
        const dateObj = new Date(log.completedAt);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return [
          log.logId,
          log.goalId,
          `"${log.goalTitle.replace(/"/g, '""')}"`,
          log.category,
          dateStr,
          timeStr,
          log.note ? `"${log.note.replace(/"/g, '""')}"` : "",
        ];
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Achiever_Report_${monthName.replace(" ", "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("CSV Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteLog = async (logId: string, goalTitle: string) => {
    if (isOffline) {
      alert(t("timeline.offlineDeleteError"));
      return;
    }
    if (window.confirm(t("timeline.confirmDeleteLog", { title: goalTitle }))) {
      try {
        const fromDate = new Date(year, month, 1).toISOString().split("T")[0];
        const toDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
        await deleteLogProgress(logId);
        await fetchHistory(fromDate, toDate);
      } catch (err) {
        console.error("Failed to delete log:", err);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }} className="animate-fade-in relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3"></div>

      {/* Sticky Header with Search */}
      <header
        className="sticky top-0 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-4 md:px-6"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex flex-col xs:flex-row xs:items-center gap-4 w-full sm:w-auto">
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--color-on-surface)",
            }}
          >
            {t("timeline.title")}
          </h2>
          <div className="relative w-full xs:w-[240px]">
            <span
              className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2"
              style={{ fontSize: "18px" }}
            >
              search
            </span>
            <input
              className="bg-surface-container-high border-none rounded-full py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary w-full text-on-surface outline-none transition-all duration-300"
              style={{ border: "1px solid var(--border-subtle)" }}
              placeholder={t("common.search")}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {bestCurrentStreak > 0 && (
            <div className="streak-badge shrink-0 py-1 px-2.5 text-[11px] sm:text-xs">
              <span className="material-symbols-outlined ms-filled" style={{ fontSize: "14px" }}>
                local_fire_department
              </span>
              <span>{t("goalCard.streakDays", { days: bestCurrentStreak })}</span>
            </div>
          )}
          {isOffline ? (
            <div
              className="btn-primary text-xs shrink-0 py-2 px-2.5 sm:px-4 opacity-50 cursor-not-allowed"
              style={{ pointerEvents: "none" }}
              title={t("goals.connectionRequired")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>cloud_off</span>
              <span className="hidden sm:inline">{t("goals.newGoal")}</span>
            </div>
          ) : (
            <Link to="/new-goal" className="btn-primary text-xs shrink-0 py-2 px-2.5 sm:px-4">
              <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>add</span>
              <span className="hidden sm:inline">{t("goals.newGoal")}</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-5 px-4 md:p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column: Calendar & Monthly Summary */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Header Bento Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-2 glass-card p-6 flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="font-bold text-xl text-on-surface mb-1">{monthName}</h3>
                  <p className="text-on-surface-variant text-xs">
                    {t("timeline.monthlySummary", { count: totalMonthlyCompletions })}
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-[100px] text-primary">
                    calendar_month
                  </span>
                </div>
              </div>
              <div className="col-span-3 sm:col-span-1 glass-card p-6 border-l-4 border-secondary flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>
                    bolt
                  </span>
                  <p className="font-bold text-[10px] text-secondary uppercase tracking-wider">{t("dashboard.streakBadge")}</p>
                </div>
                <p className="text-3xl font-black text-on-surface">
                  {bestCurrentStreak} <span className="text-xs font-medium text-on-surface-variant">{t("common.days")}</span>
                </p>
              </div>
            </div>

            {/* Monthly Calendar View */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-base text-on-surface">{t("timeline.performanceGrid")}</h4>
                <div className="flex gap-1">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
                  </button>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekdays.map((d) => (
                  <div key={d} className="text-on-surface-variant font-bold text-[10px] tracking-wider py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid cell builder */}
              <div className="grid grid-cols-7 gap-2">
                {/* Pad leading offset empty cells */}
                {Array.from({ length: startOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square opacity-20" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const historyDay = historyMap.get(dateStr);
                  const isCompleted = historyDay && historyDay.count > 0;
                  const completionsCount = historyDay?.count || 0;
                  const isFrozen = frozenDatesSet.has(dateStr);

                  const isSelected = selectedDay === dayNum;

                  // Today highlight
                  const today = new Date();
                  const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === dayNum;

                  let cellClass = "aspect-square glass-card flex flex-col items-center justify-center p-1 relative group cursor-pointer hover:bg-white/10 transition-all duration-200 border";
                  let textClass = "font-medium text-xs";
                  
                  if (isSelected) {
                    cellClass += " border-primary bg-primary/10 ring-1 ring-primary";
                    textClass += " text-primary font-bold";
                  } else if (isToday) {
                    cellClass += " border-secondary bg-secondary/5";
                    textClass += " text-secondary font-bold";
                  } else {
                    cellClass += " border-transparent";
                    textClass += " text-on-surface-variant";
                  }

                  return (
                    <div
                      key={dayNum}
                      className={cellClass}
                      onClick={() => setSelectedDay(selectedDay === dayNum ? null : dayNum)}
                    >
                      <span className={textClass}>{dayNum}</span>

                      {/* Green dot marker for completed goals */}
                      {isCompleted && (
                        <div
                          className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-secondary"
                          style={{ boxShadow: "0 0 8px var(--color-secondary)" }}
                        />
                      )}

                      {/* Star marker for milestones (>= 3 completions in a day) */}
                      {completionsCount >= 3 && (
                        <span className="material-symbols-outlined text-[10px] text-tertiary absolute top-1 right-1 ms-filled animate-pulse">
                          star
                        </span>
                      )}

                      {isFrozen && (
                        <span className="text-[10px] leading-none absolute top-1 left-1 text-sky-400" title="Frozen day">
                          ❄
                        </span>
                      )}

                      {/* Tooltip bubble on hover */}
                      <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-surface-container-high border border-white/5 text-on-surface font-semibold text-[9px] rounded-lg px-2 py-0.5 whitespace-nowrap z-30 transition-all shadow-xl font-sans">
                        {t("timeline.completions", { count: completionsCount })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Milestone Achievements Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Achievement 1: Streak milestone */}
              <div className="glass-card overflow-hidden group border border-white/5">
                <div className="h-28 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-background via-surface-container-low/40 to-primary/10 group-hover:to-primary/20 transition-all duration-500"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary ms-filled" style={{ fontSize: "20px" }}>
                      workspace_premium
                    </span>
                    <p className="font-bold text-xs text-on-surface uppercase tracking-wider">{t("timeline.consistentLeader")}</p>
                  </div>
                </div>
                <div className="p-4 border-t border-white/5">
                  <p className="text-on-surface-variant text-xs leading-relaxed">
                    {bestCurrentStreak >= 10 ? (
                      <span className="text-secondary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {t("timeline.consistentLeaderUnlocked", { days: bestCurrentStreak })}
                      </span>
                    ) : (
                      t("timeline.consistentLeaderLocked", { days: bestCurrentStreak })
                    )}
                  </p>
                </div>
              </div>

              {/* Achievement 2: Completion milestone */}
              <div className="glass-card overflow-hidden group border border-white/5">
                <div className="h-28 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-background via-surface-container-low/40 to-secondary/10 group-hover:to-secondary/20 transition-all duration-500"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/15 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary ms-filled" style={{ fontSize: "20px" }}>
                      verified
                    </span>
                    <p className="font-bold text-xs text-on-surface uppercase tracking-wider">{t("timeline.goalCrusher")}</p>
                  </div>
                </div>
                <div className="p-4 border-t border-white/5">
                  <p className="text-on-surface-variant text-xs leading-relaxed">
                    {totalMonthlyCompletions >= 15 ? (
                      <span className="text-secondary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {t("timeline.goalCrusherUnlocked", { count: totalMonthlyCompletions })}
                      </span>
                    ) : (
                      t("timeline.goalCrusherLocked", { count: totalMonthlyCompletions })
                    )}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Chronological Activity Feed */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="glass-card flex flex-col h-full border border-white/5" style={{ minHeight: "480px" }}>
              
              {/* Feed Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-on-surface">{t("timeline.activityFeed")}</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    {selectedDay ? t("timeline.filteringDay", { day: selectedDay }) : t("timeline.showingAllLogs")}
                  </p>
                </div>
                {selectedDay && (
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    {t("dashboard.clearFilter")}
                  </button>
                )}
              </div>

              {/* Feed Items Container */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar max-h-[460px]">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const categoryTheme = getCategoryTheme(log.category);
                    const logDate = new Date(log.completedAt);
                    const isToday = new Date().toDateString() === logDate.toDateString();
                    
                    const dateDisplay = isToday
                      ? t("common.today")
                      : logDate.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric" });
                    
                    const timeDisplay = logDate.toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div key={log.logId} className="relative pl-6 pb-2 border-l border-white/10 last:border-transparent">
                        
                        {/* Timeline Node Icon/Dot */}
                        <div
                          className="absolute -left-[9px] top-0 w-4.5 h-4.5 rounded-full bg-background flex items-center justify-center border-2 border-primary"
                          style={{ borderColor: categoryTheme.iconColor }}
                        >
                          <span
                            className="material-symbols-outlined ms-filled"
                            style={{ fontSize: "10px", color: categoryTheme.iconColor }}
                          >
                            {categoryTheme.icon}
                          </span>
                        </div>

                        {/* Card metadata info */}
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-bold text-[10px] text-on-surface-variant">
                            {dateDisplay}, {timeDisplay}
                          </p>
                          <span className="bg-secondary/15 text-secondary px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-secondary/10">
                            {t("common.completed")}
                          </span>
                        </div>

                        {/* Inner Log Card details */}
                        <div className="bg-surface-container-low/40 rounded-xl p-3 border border-white/5 hover:border-white/10 hover:bg-surface-container-low/60 transition-all duration-200 group flex items-center justify-between gap-4">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                              {log.goalTitle}
                            </p>
                            <p className="text-[10px] text-on-surface-variant mt-0.5 italic truncate">
                              {log.note ? `"${log.note}"` : t("timeline.defaultCheckinNote")}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteLog(log.logId, log.goalTitle)}
                            className="btn-danger-ghost shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-lg"
                            title={isOffline ? t("goals.connectionRequired") : t("timeline.deleteLog")}
                            style={{ display: "inline-flex", alignItems: "center", cursor: isOffline ? "not-allowed" : "pointer", pointerEvents: isOffline ? "none" : "auto", opacity: isOffline ? 0 : undefined }}
                            disabled={isOffline}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 opacity-50">
                    <span className="material-symbols-outlined text-[36px] text-on-surface-variant">
                      history_toggle_off
                    </span>
                    <p className="text-xs text-on-surface-variant font-medium">{t("timeline.noCheckinsFound")}</p>
                  </div>
                )}
              </div>

              {/* Feed Action footer (CSV Export) */}
              <div className="p-4 bg-surface-container-high/30 rounded-b-2xl border-t border-white/5">
                <button
                  disabled={exporting || allMonthlyLogs.length === 0}
                  onClick={handleExportCSV}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-on-surface-variant hover:text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    download
                  </span>
                  {exporting ? t("timeline.generatingReport") : t("timeline.exportMonthlyReport")}
                </button>

                {exportSuccess && (
                  <p className="text-[10px] text-secondary text-center mt-2 font-semibold">
                    {t("timeline.exportSuccess")}
                  </p>
                )}
              </div>

            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
