// src/pages/Stats.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoalStore } from "../store/goalStore";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { ShareModal } from "../components/ShareModal";
import { useTranslation } from "../i18n";
import { getLevelFromXP, getLevelProgress, getXPToNextLevel, LEVELS, XP_RULES } from "../lib/xpSystem";
import { TrendComparison } from "../components/stats/TrendComparison";

export const Stats: React.FC = () => {
  const { t, language } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { stats, history, loading, fetchStats, fetchHistory, goals, fetchGoals, isOffline } = useGoalStore();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [frozenDates, setFrozenDates] = useState<Set<string>>(new Set());

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareType, setShareType] = useState<"badge" | "heatmap">("badge");
  const [shareData, setShareData] = useState<{ title: string; description: string; streakCount?: number; heatmapData?: { date: string; count: number }[] }>({
    title: "",
    description: "",
  });

  const handleShareHeatmap = () => {
    const heatmapData = history.map(day => ({
      date: day.date,
      count: day.count
    }));
    setShareType("heatmap");
    setShareData({
      title: t("stats.consistencyHeatmap"),
      description: t("share.heatmapDescription", { count: history.reduce((sum, d) => sum + d.count, 0) }),
      heatmapData
    });
    setShowShareModal(true);
  };

  const handleShareMilestone = (milestone: any) => {
    let streakCount = 0;
    const isStreak = milestone.title.toLowerCase().includes("streak") || milestone.title.toLowerCase().includes("chuỗi");
    if (isStreak) {
      const match = milestone.title.match(/(\d+)/);
      if (match) streakCount = parseInt(match[1], 10);
    }
    setShareType("badge");
    setShareData({
      title: milestone.title,
      description: milestone.desc,
      streakCount
    });
    setShowShareModal(true);
  };


  // 1. Fetch data on mount & align start date to Sunday for perfect heatmap grid layout
  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
      fetchStats();
      
      const now = new Date();
      // 26 weeks ago = 182 days
      const fromDateObj = new Date(now.getTime() - 26 * 7 * 24 * 60 * 60 * 1000);
      // Align to previous Sunday
      const dayOfWeek = fromDateObj.getDay();
      fromDateObj.setDate(fromDateObj.getDate() - dayOfWeek);
      
      const fromDate = fromDateObj.toISOString().split("T")[0];
      const toDate = now.toISOString().split("T")[0];
      fetchHistory(fromDate, toDate);

      api.get("/api/freeze/dates?all=true")
        .then((res) => setFrozenDates(new Set<string>(res.data.frozen_dates)))
        .catch(() => {});
    }
  }, [isAuthenticated, fetchGoals, fetchStats, fetchHistory]);

  const handleRefresh = () => {
    fetchStats();
    fetchGoals();
    
    const now = new Date();
    const fromDateObj = new Date(now.getTime() - 26 * 7 * 24 * 60 * 60 * 1000);
    const dayOfWeek = fromDateObj.getDay();
    fromDateObj.setDate(fromDateObj.getDate() - dayOfWeek);
    
    const fromDate = fromDateObj.toISOString().split("T")[0];
    const toDate = now.toISOString().split("T")[0];
    fetchHistory(fromDate, toDate);
    api.get("/api/freeze/dates?all=true")
      .then((res) => setFrozenDates(new Set<string>(res.data.frozen_dates)))
      .catch(() => {});
  };

  const handleSeedGoals = async () => {
    if (!user?.id) return;
    setSeeding(true);
    try {
      await api.post("/api/seed", { userId: user.id });
      await fetchGoals();
      handleRefresh();
    } catch (err) {
      console.error("Failed to seed goals:", err);
    } finally {
      setSeeding(false);
    }
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,Date,Completion Count,Goal Title,Goal Category,Log Note,Logged At\n";
    
    history.forEach(day => {
      if (day.logs && day.logs.length > 0) {
        day.logs.forEach(log => {
          const goal = goals.find(g => g.id === log.goal_id);
          const title = goal ? goal.title.replace(/"/g, '""') : "Unknown";
          const category = goal ? goal.category : "Unknown";
          const note = log.note ? log.note.replace(/"/g, '""') : "";
          const loggedAt = log.completed_at;
          csvContent += `"${day.date}",${day.count},"${title}","${category}","${note}","${loggedAt}"\n`;
        });
      } else {
        csvContent += `"${day.date}",0,"","","",""\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `achiever_pro_stats_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for category themes
  const getCategoryTheme = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("health") || lower.includes("fit") || lower.includes("sport") || lower.includes("gym")) {
      return { icon: "fitness_center", border: "border-t-2 border-primary/40", progressBg: "bg-primary", bgClass: "bg-primary/10 text-primary" };
    }
    if (lower.includes("work") || lower.includes("job") || lower.includes("career") || lower.includes("project")) {
      return { icon: "work", border: "border-t-2 border-secondary/40", progressBg: "bg-secondary", bgClass: "bg-secondary/10 text-secondary" };
    }
    if (lower.includes("learn") || lower.includes("read") || lower.includes("book") || lower.includes("study") || lower.includes("code")) {
      return { icon: "menu_book", border: "border-t-2 border-tertiary/40", progressBg: "bg-tertiary", bgClass: "bg-tertiary/10 text-tertiary" };
    }
    // Fallback theme (Routine, Finance, etc.)
    return { icon: "checklist", border: "border-t-2 border-primary/30", progressBg: "bg-primary/80", bgClass: "bg-primary/10 text-primary" };
  };

  // Helper for heatmap colors
  const getHeatmapColorClass = (count: number): string => {
    if (count === 0) return "heatmap-cell-0";
    if (count === 1) return "heatmap-cell-1";
    if (count === 2) return "heatmap-cell-2";
    return "heatmap-cell-3";
  };

  // 2. Compute dynamic stats and categories breakdown
  const categoryStats = useMemo(() => {
    const catMap: { [key: string]: { name: string; count: number; completedCount: number; progressRate: number; totalTarget: number; totalProgress: number } } = {};
    
    // Seed default categories for UI mockup alignment
    const defaults = ["Health", "Work", "Learning"];
    defaults.forEach(cat => {
      catMap[cat.toLowerCase()] = {
        name: cat,
        count: 0,
        completedCount: 0,
        progressRate: 0,
        totalTarget: 0,
        totalProgress: 0
      };
    });

    goals.forEach(g => {
      const catKey = g.category.toLowerCase();
      if (!catMap[catKey]) {
        catMap[catKey] = {
          name: g.category,
          count: 0,
          completedCount: 0,
          progressRate: 0,
          totalTarget: 0,
          totalProgress: 0
        };
      }
      catMap[catKey].count += 1;
      catMap[catKey].totalTarget += g.target_count;
      catMap[catKey].totalProgress += g.current_count;
    });

    // Populate completed counts from history logs
    const goalIdToCategory: { [id: string]: string } = {};
    goals.forEach(g => {
      goalIdToCategory[g.id] = g.category.toLowerCase();
    });

    history.forEach(day => {
      day.logs?.forEach(log => {
        const catKey = goalIdToCategory[log.goal_id];
        if (catKey && catMap[catKey]) {
          catMap[catKey].completedCount += 1;
        }
      });
    });

    // Compute progressRate (percent completion)
    Object.keys(catMap).forEach(key => {
      const cat = catMap[key];
      if (cat.totalTarget > 0) {
        cat.progressRate = Math.min(100, Math.round((cat.totalProgress / cat.totalTarget) * 100));
      } else {
        cat.progressRate = 0;
      }
    });

    return catMap;
  }, [goals, history]);

  const categoriesToDisplay = useMemo(() => {
    // Sort categories with goals first, then defaults
    return Object.values(categoryStats).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [categoryStats]);

  // 3. Overall Completion rate last-month comparison calculation
  const completionTrend = useMemo(() => {
    if (history.length === 0) return { percent: 0, isUp: true };
    const half = Math.floor(history.length / 2);
    if (half === 0) return { percent: 0, isUp: true };
    
    const lastPart = history.slice(-half);
    const prevPart = history.slice(-2 * half, -half);
    
    const sumLast = lastPart.reduce((acc, day) => acc + day.count, 0);
    const sumPrev = prevPart.reduce((acc, day) => acc + day.count, 0);
    
    if (sumPrev === 0) {
      return { percent: sumLast > 0 ? 100 : 0, isUp: true };
    }
    
    const diff = sumLast - sumPrev;
    const percent = Math.round((diff / sumPrev) * 100);
    return {
      percent: Math.abs(percent),
      isUp: percent >= 0
    };
  }, [history]);

  // 4. Heatmap months list extraction
  const monthsList = useMemo(() => {
    const list: string[] = [];
    history.forEach(day => {
      const mName = new Date(day.date).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { month: "short" });
      if (!list.includes(mName)) {
        list.push(mName);
      }
    });
    return list.slice(-6);
  }, [history, language]);

  // 5. Performance Trend grouped by past 10 weeks
  const performanceTrend = useMemo(() => {
    const weeksCount = 10;
    const daysPerWeek = 7;
    const trendData: { weekLabel: string; percentage: number; count: number }[] = [];
    const totalGoalsVal = stats?.totalGoals || goals.length || 1;
    
    for (let w = weeksCount - 1; w >= 0; w--) {
      const startIndex = history.length - 1 - (w + 1) * daysPerWeek + 1;
      const endIndex = history.length - 1 - w * daysPerWeek;
      
      let completionsSum = 0;
      let daysLogged = 0;
      
      for (let i = startIndex; i <= endIndex; i++) {
        if (i >= 0 && i < history.length) {
          completionsSum += history[i].count;
          daysLogged++;
        }
      }
      
      const maxTarget = totalGoalsVal * (daysLogged || 7);
      const percentage = maxTarget > 0 ? Math.min(100, Math.round((completionsSum / maxTarget) * 100)) : 0;
      
      trendData.push({
        weekLabel: t("stats.weekLabel", { num: weeksCount - w }),
        percentage: percentage,
        count: completionsSum
      });
    }
    return trendData;
  }, [history, stats, goals, t]);

  // 6. Conic gradient calculation for Goal Distribution Donut Chart
  const distributionData = useMemo(() => {
    const entries = Object.values(categoryStats).filter(c => c.count > 0);
    const total = entries.reduce((acc, c) => acc + c.count, 0);
    
    const colors = [
      "var(--color-primary)",
      "var(--color-secondary)",
      "var(--color-tertiary)",
      "var(--color-primary-container)",
      "var(--color-secondary-container)",
      "var(--color-tertiary-container)"
    ];

    let currentAngle = 0;
    const sectors = entries.map((entry, index) => {
      const percentage = total > 0 ? Math.round((entry.count / total) * 100) : 0;
      const color = colors[index % colors.length];
      const start = currentAngle;
      currentAngle += percentage;
      return {
        ...entry,
        percentage,
        color,
        start,
        end: currentAngle
      };
    });

    return { sectors, total };
  }, [categoryStats]);

  const conicGradientStyle = useMemo(() => {
    if (distributionData.sectors.length === 0 || distributionData.total === 0) {
      return "conic-gradient(var(--color-surface-container-high) 0% 100%)";
    }
    const parts = distributionData.sectors.map(s => `${s.color} ${s.start}% ${s.end}%`);
    return `conic-gradient(${parts.join(", ")})`;
  }, [distributionData]);

  // 7. Key Milestones dynamic generation
  const milestones = useMemo(() => {
    const list: { title: string; desc: string; icon: string; date: string; colorClass: string; iconColorClass: string }[] = [];

    // Milestone 1: High Global rate
    const globalRate = stats?.overallCompletionRate || 0;
    if (globalRate > 75) {
      list.push({
        title: t("stats.milestonesList.eliteTitle"),
        desc: t("stats.milestonesList.eliteDesc", { rate: globalRate }),
        icon: "emoji_events",
        date: t("stats.milestoneDate.lastWeek"),
        colorClass: "border-l-4 border-primary",
        iconColorClass: "bg-primary/10 text-primary"
      });
    }

    // Milestone 2: Streaks
    const longestStreak = stats?.bestLongestStreak || 0;
    if (longestStreak > 0) {
      list.push({
        title: t("stats.milestonesList.streakTitle", { days: longestStreak }),
        desc: t("stats.milestonesList.streakDesc", { days: longestStreak }),
        icon: "stars",
        date: t("stats.milestoneDate.twoDaysAgo"),
        colorClass: "border-l-4 border-secondary",
        iconColorClass: "bg-secondary/10 text-secondary"
      });
    }

    // Milestone 3: Total logs count
    const totalCompleted = goals.reduce((sum, g) => sum + g.current_count, 0);
    if (totalCompleted > 5) {
      list.push({
        title: t("stats.milestonesList.totalCompletedTitle", { count: totalCompleted }),
        desc: t("stats.milestonesList.totalCompletedDesc"),
        icon: "timeline",
        date: t("stats.milestoneDate.active"),
        colorClass: "border-l-4 border-tertiary",
        iconColorClass: "bg-tertiary/10 text-tertiary"
      });
    }

    // Default if empty
    if (list.length === 0) {
      list.push({
        title: t("stats.milestonesList.startTitle"),
        desc: t("stats.milestonesList.startDesc"),
        icon: "emoji_events",
        date: t("stats.milestoneDate.today"),
        colorClass: "border-l-4 border-primary",
        iconColorClass: "bg-primary/10 text-primary"
      });
    }

    return list;
  }, [stats, goals, t]);

  // Filtered Milestones based on Search
  const filteredMilestones = useMemo(() => {
    if (!searchTerm.trim()) return milestones;
    return milestones.filter(m => 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [milestones, searchTerm]);

  // Overall calculations for streak display
  const bestStreak = Math.max(0, ...goals.map((g) => g.streak?.current_streak || 0));

  if (!stats) {
    return (
      <div style={{ minHeight: "100vh" }} className="flex flex-col items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 text-secondary mb-3 border-t-2 border-secondary border-l border-r border-transparent rounded-full" />
        <p className="text-sm text-on-surface-variant">{t("stats.loadingDesc")}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }} className="flex flex-col bg-background text-on-background antialiased font-sans">
      {/* ── Sticky Header with Search and Actions ── */}
      <header
        className="sticky top-0 z-40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-3.5 px-4 md:px-6"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--color-on-surface)",
            }}
          >
            {t("nav.statistics")}
          </h2>
          <div className="relative w-full sm:max-w-[240px]">
            <span
              className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2"
              style={{ fontSize: "18px" }}
            >
              search
            </span>
            <input
              className="bg-surface-container-high border-none rounded-full py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary w-full text-on-surface outline-none transition-all duration-300"
              style={{ border: "1px solid var(--border-subtle)" }}
              placeholder={t("stats.searchMilestone")}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          {bestStreak > 0 && (
            <div className="streak-badge shrink-0 py-1 px-2.5 text-[11px] sm:text-xs">
              <span className="material-symbols-outlined ms-filled" style={{ fontSize: "14px" }}>
                local_fire_department
              </span>
              <span>{t("goalCard.streakDays", { days: bestStreak })}</span>
            </div>
          )}
          <button
            onClick={handleExportCSV}
            className="btn-ghost text-xs shrink-0 py-2 px-2.5 sm:px-3"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title={t("common.exportCsv")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              download
            </span>
            <span className="hidden sm:inline">{t("common.exportCsv")}</span>
          </button>
          <button
            onClick={handleRefresh}
            className="btn-ghost text-xs shrink-0 py-2 px-2.5 sm:px-3"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title={t("common.refresh")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              refresh
            </span>
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </button>
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

      {/* ── Main Content Canvas ── */}
      <main className="p-4 md:p-8 flex-1 space-y-6 md:space-y-8 max-w-[1200px] mx-auto w-full">
        {/* Header Section */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">{t("stats.title")}</h1>
            <p className="text-base text-on-surface-variant mt-2">{t("stats.subtitle")}</p>
          </div>
        </section>

        {/* ── XP & Level Widget (AC-5) ── */}
        <section className="glass-card p-5 mb-6">
          <h2
            className="text-sm font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--color-on-surface)' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>
              military_tech
            </span>
            XP & Level
          </h2>

          {(() => {
            const totalXP = user?.total_xp ?? 0;
            const currentLevel = getLevelFromXP(totalXP);
            const progress = getLevelProgress(totalXP);
            const xpToNext = getXPToNextLevel(totalXP);
            const isMaxLevel = currentLevel.level === 10;

            return (
              <div className="space-y-4">
                {/* Level header */}
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: '48px', lineHeight: 1 }}>{currentLevel.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>
                      Level {currentLevel.level} — {currentLevel.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {totalXP.toLocaleString()} XP tổng cộng
                    </p>
                  </div>
                </div>

                {/* XP Progress bar */}
                {!isMaxLevel && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                      <span>{progress}% tiến độ Level {currentLevel.level}</span>
                      <span>Cần thêm {xpToNext.toLocaleString()} XP → Lv.{currentLevel.level + 1}</span>
                    </div>
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: '8px', background: 'var(--color-surface-container-high)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                        }}
                      />
                    </div>
                  </div>
                )}

                {isMaxLevel && (
                  <p className="text-sm font-semibold text-center py-2" style={{ color: 'var(--color-tertiary)' }}>
                    👑 Bạn đã đạt cấp độ tối đa — LEGEND!
                  </p>
                )}

                {/* XP Rules reference */}
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >
                  {[
                    { label: 'Check-in goal',      xp: XP_RULES.CHECK_IN,    icon: 'check_circle' },
                    { label: 'Hoàn thành ngày',    xp: XP_RULES.COMPLETE_DAY, icon: 'done_all' },
                    { label: 'Tham gia nhóm',      xp: XP_RULES.JOIN_GROUP,  icon: 'group_add' },
                    { label: 'Mời bạn',            xp: XP_RULES.INVITE_FRIEND, icon: 'person_add' },
                    { label: 'Mốc streak 7 ngày',  xp: 100,                  icon: 'local_fire_department' },
                    { label: 'Mốc streak 30 ngày', xp: 300,                  icon: 'whatshot' },
                  ].map((rule) => (
                    <div
                      key={rule.label}
                      className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: 'var(--color-surface-container)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>
                        {rule.icon}
                      </span>
                      <div>
                        <p style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>{rule.label}</p>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-on-surface)' }}>+{rule.xp} XP</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* All levels list */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Lộ trình cấp độ
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LEVELS.map((lv) => (
                      <div
                        key={lv.level}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: lv.level === currentLevel.level
                            ? 'var(--color-primary-container)'
                            : 'var(--color-surface-container)',
                          color: lv.level === currentLevel.level
                            ? 'var(--color-on-primary-container)'
                            : lv.level < currentLevel.level
                              ? 'var(--color-secondary)'
                              : 'var(--color-on-surface-variant)',
                          opacity: lv.level > currentLevel.level ? 0.6 : 1,
                        }}
                      >
                        <span>{lv.icon}</span>
                        <span>Lv.{lv.level} {lv.name}</span>
                        {lv.level < currentLevel.level && (
                          <span className="ml-auto material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                        )}
                        {lv.level === currentLevel.level && (
                          <span className="ml-auto" style={{ fontSize: '10px', fontWeight: 700 }}>NOW</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Dynamic Warning for empty database */}
        {goals.length === 0 && !isOffline && (
          <div className="glass-card p-6 border-t-2 border-tertiary/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary text-3xl">auto_awesome</span>
              <div>
                <h4 className="font-bold text-on-surface">{t("stats.noHabitsSeeded")}</h4>
                <p className="text-sm text-on-surface-variant mt-0.5">{t("stats.populateHint")}</p>
              </div>
            </div>
            <button
              onClick={handleSeedGoals}
              disabled={seeding}
              className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer border-none disabled:opacity-50"
            >
              {seeding ? t("stats.seedingBtn") : t("stats.seedDemoBtn")}
            </button>
          </div>
        )}

        {/* Top Row Stats: Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Key Highlight Card */}
          <div className="lg:col-span-4 glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="relative z-10">
              <p className="text-xs font-bold text-secondary mb-2 uppercase tracking-widest">{t("stats.globalCompletion")}</p>
              <h3 className="text-4xl font-extrabold text-on-surface">{stats?.overallCompletionRate || 0}%</h3>
              <div className="mt-4 flex items-center gap-2">
                <span className={`material-symbols-outlined ${completionTrend.isUp ? 'text-secondary' : 'text-error'}`}>
                  {completionTrend.isUp ? 'trending_up' : 'trending_down'}
                </span>
                <span className={`text-sm font-bold ${completionTrend.isUp ? 'text-secondary' : 'text-error'}`}>
                  {completionTrend.isUp ? '+' : '-'}{completionTrend.percent}% {t("stats.vsLastMonth")}
                </span>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[160px]">auto_graph</span>
            </div>
          </div>

          {/* Category Breakdown Mini Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoriesToDisplay.map((cat) => {
              const theme = getCategoryTheme(cat.name);
              return (
                <div key={cat.name} className={`glass-card p-6 rounded-2xl ${theme.border} hover:border-white/20 transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`material-symbols-outlined ${theme.bgClass.split(" ")[1]}`}>{theme.icon}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${theme.bgClass}`}>{t("category." + cat.name.toLowerCase())}</span>
                  </div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t("common.completed")}</p>
                  <h4 className="text-2xl font-black text-on-surface mt-1">
                    {cat.count > 0 ? `${cat.totalProgress} ${t("nav.goals")}` : `0 ${t("nav.goals")}`}
                  </h4>
                  <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${theme.progressBg}`} style={{ width: `${cat.progressRate || 0}%` }}></div>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-[10px] text-on-surface-variant font-bold">
                    <span>{t("goals.progress").toUpperCase()}</span>
                    <span>{cat.progressRate || 0}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend Comparison Widget */}
        <TrendComparison />

        {/* Activity Heatmap Section */}
        <section className="glass-card p-8 rounded-2xl mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
              <h2 className="text-xl font-bold text-on-surface">{t("stats.consistencyHeatmap")}</h2>
              <button
                onClick={handleShareHeatmap}
                className="btn-ghost p-1 rounded-full flex items-center justify-center border-none cursor-pointer"
                title={t("share.title")}
                style={{ display: "inline-flex" }}
              >
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "18px" }}>share</span>
              </button>
            </div>
            <div className="flex items-center gap-2 self-end">
              <span className="text-xs font-semibold text-on-surface-variant">{t("share.less")}</span>
              <div className="flex gap-[3px]">
                <div className="heatmap-cell heatmap-cell-0"></div>
                <div className="heatmap-cell heatmap-cell-1"></div>
                <div className="heatmap-cell heatmap-cell-2"></div>
                <div className="heatmap-cell heatmap-cell-3" style={{ boxShadow: '0 0 8px rgba(78, 222, 163, 0.4)' }}></div>
              </div>
              <span className="text-xs font-semibold text-on-surface-variant">{t("share.more")}</span>
            </div>
          </div>
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-[800px]" id="heatmap-grid">
              {history.map((day) => {
                const d = new Date(day.date);
                const dayName = d.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { day: "numeric", month: "short", weekday: "long" });
                const isFrozen = frozenDates.has(day.date);

                return (
                  <div
                    key={day.date}
                    style={day.count >= 3 ? { boxShadow: '0 0 8px rgba(78, 222, 163, 0.4)' } : undefined}
                    className={`heatmap-cell relative group cursor-pointer transition-all hover:scale-110 ${
                      isFrozen ? "heatmap-cell-frozen" : getHeatmapColorClass(day.count)
                    }`}
                    title={isFrozen ? `Frozen day - ${day.date}` : `${day.date}: ${day.count} completions`}
                  >
                    {isFrozen && (
                      <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: "8px" }}>
                        ❄
                      </span>
                    )}
                    {/* Interactive tooltip bubble indicator */}
                    <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-surface-container-high border border-white/10 text-on-surface font-semibold text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap z-30 transition-all shadow-xl font-sans">
                      {isFrozen ? `Frozen day - ${day.date}` : t("stats.heatmapTooltip", { date: dayName, count: day.count })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-50 px-2">
            {monthsList.map(month => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </section>

        {/* Charts and Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend */}
          <div className="glass-card p-8 rounded-2xl">
            <h3 className="text-xl font-bold text-on-surface mb-6">{t("stats.weeklyTrend")}</h3>
            <div className="h-64 relative flex items-end gap-2 px-4 border-b border-white/10 border-l border-white/10">
              {performanceTrend.map((data, idx) => (
                <div
                  key={idx}
                  style={{ height: `${data.percentage}%` }}
                  className={`flex-1 bg-gradient-to-t from-primary/5 to-primary/40 rounded-t-sm relative group transition-all duration-300 hover:from-primary/20 hover:to-primary/60 cursor-pointer ${
                    idx === performanceTrend.length - 1 ? "border-t-2 border-primary" : ""
                  }`}
                >
                  {/* Top highlight bar on current week */}
                  {idx === performanceTrend.length - 1 && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_8px_rgba(192,193,255,0.8)]"></div>
                  )}
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-container-high border border-white/10 px-2 py-1 rounded text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                    {data.percentage}% ({t("stats.logCount", { count: data.count })})
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              {performanceTrend.map(d => (
                <span key={d.weekLabel}>{d.weekLabel}</span>
              ))}
            </div>
          </div>

          {/* Goal Distribution Donut Chart */}
          <div className="glass-card p-8 rounded-2xl flex flex-col">
            <h3 className="text-xl font-bold text-on-surface mb-6">{t("stats.goalDistribution")}</h3>
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8">
              {/* Dynamic Conic Donut Chart */}
              <div
                className="relative w-48 h-48 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: conicGradientStyle,
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
                }}
              >
                <div className="absolute inset-4 bg-background rounded-full shadow-inner flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-on-surface">{distributionData.total}</span>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{t("stats.totalGoals")}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {distributionData.sectors.map(sector => (
                  <div key={sector.name} className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: sector.color }} />
                    <span className="font-bold text-sm text-on-surface">
                      {t("category." + sector.name.toLowerCase())} ({sector.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Milestones Feed */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-on-surface mb-6">{t("stats.milestones")}</h3>
          <div className="space-y-4">
            {filteredMilestones.map((milestone, idx) => (
              <div
                key={idx}
                className={`glass-card p-5 rounded-2xl flex items-center gap-4 border-white/5 hover:border-white/10 transition-all ${milestone.colorClass}`}
              >
                <div className={`p-3 rounded-full shrink-0 flex items-center justify-center ${milestone.iconColorClass}`}>
                  <span className="material-symbols-outlined text-[24px]">{milestone.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-on-surface">{milestone.title}</h4>
                  <p className="text-sm text-on-surface-variant mt-0.5">{milestone.desc}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-on-surface-variant opacity-70 whitespace-nowrap hidden sm:inline">
                    {milestone.date}
                  </span>
                  <button
                    onClick={() => handleShareMilestone(milestone)}
                    className="btn-ghost p-2 rounded-xl flex items-center justify-center border-none cursor-pointer"
                    title={t("share.title")}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "16px" }}>share</span>
                  </button>
                </div>
              </div>
            ))}
            {filteredMilestones.length === 0 && (
              <div className="glass-card p-8 rounded-2xl text-center text-on-surface-variant text-sm">
                {t("stats.noMilestonesFound")}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Button (FAB) - hidden offline */}
      {!isOffline && (
        <button
          onClick={() => navigate("/new-goal")}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_24px_rgba(192,193,255,0.3)] hover:scale-110 active:scale-95 hover:shadow-[0_12px_28px_rgba(192,193,255,0.45)] transition-all z-50 border-none cursor-pointer"
          title={t("goals.newGoal")}
        >
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      )}

      {/* Share Modal overlay */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type={shareType}
        data={shareData}
      />
    </div>
  );
};

export default Stats;
