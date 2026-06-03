// src/pages/Stats.tsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart2, Flame, Award, Zap, Calendar, Layers, Clock, Heart, Briefcase, BookOpen, CircleDot, RefreshCw } from "lucide-react";
import { useGoalStore } from "../store/goalStore";
import { useAuthStore } from "../store/authStore";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export const Stats: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { stats, history, loading, fetchStats, fetchHistory, goals } = useGoalStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      // Fetch past 28 days of logs history
      const fromDate = new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const toDate = new Date().toISOString().split("T")[0];
      fetchHistory(fromDate, toDate);
    }
  }, [isAuthenticated, fetchStats, fetchHistory]);

  const totalGoalsCount = goals.length;

  // Render mock categories distribution based on current goals
  const categoryStats = React.useMemo(() => {
    const categories: { [key: string]: { name: string; count: number; color: string; icon: any } } = {
      learning: { name: "Learning", count: 0, color: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: BookOpen },
      fitness: { name: "Fitness", count: 0, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Zap },
      work: { name: "Work", count: 0, color: "bg-sky-500/10 text-sky-400 border-sky-500/20", icon: Briefcase },
      health: { name: "Health", count: 0, color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: Heart },
      finance: { name: "Finance", count: 0, color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: CircleDot },
      routine: { name: "Routine", count: 0, color: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Clock },
    };

    goals.forEach((g) => {
      const catKey = g.category.toLowerCase();
      if (categories[catKey]) {
        categories[catKey].count += 1;
      }
    });

    return Object.values(categories).filter((c) => c.count > 0);
  }, [goals]);

  // Heatmap levels helper
  const getHeatmapColorClass = (count: number): string => {
    if (count === 0) return "bg-slate-900 border-slate-800 text-slate-600";
    if (count === 1) return "bg-emerald-950/40 border-emerald-900/50 text-emerald-400";
    if (count === 2) return "bg-emerald-900/60 border-emerald-800/60 text-emerald-300";
    return "bg-emerald-600 border-emerald-500 text-white";
  };

  const handleRefresh = () => {
    fetchStats();
    const fromDate = new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const toDate = new Date().toISOString().split("T")[0];
    fetchHistory(fromDate, toDate);
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 text-emerald-500 mb-3 border-t-2 border-emerald-500 border-l border-r border-transparent rounded-full" />
        <p className="text-sm text-slate-400">Loading performance statistics analytics...</p>
      </div>
    );
  }

  // Get past 7 days strictly for the Weekly Trend charts list
  const weeklyHistory = history.slice(-7);

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header line */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart2 className="h-7 w-7 text-emerald-400" /> Goal Analytics Review
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Analyze historical progress logs, consecutive streaks, and core habits categorization metrics.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-slate-400 py-1.5 px-3 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh Stats
          </Button>
        </div>

        {totalGoalsCount === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-800 p-12 text-center bg-slate-900/20 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-slate-400 border border-slate-800">
              <BarChart2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">No analytic metrics loaded yet</h3>
              <p className="text-xs text-slate-400 max-w-[340px] mx-auto mt-1 leading-relaxed">
                Add at least one daily goal and log completion progress to open detailed analytics charts and habits mapping history.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Highlights Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Card className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Award className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Overall Progress</p>
                  <p className="text-2xl font-black text-slate-100 mt-2 leading-none">{stats.overallCompletionRate}%</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">Average accomplishment rate</p>
                </div>
              </Card>

              <Card className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Flame className="h-6 w-6 fill-amber-500/10" />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Best Current Streak</p>
                  <p className="text-2xl font-black text-amber-400 mt-2 leading-none">{stats.bestCurrentStreak} days</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">Consecutive logged days</p>
                </div>
              </Card>

              <Card className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                  <Zap className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Longest Streak</p>
                  <p className="text-2xl font-black text-teal-400 mt-2 leading-none">{stats.bestLongestStreak} days</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">All-time record high point</p>
                </div>
              </Card>
            </div>

            {/* Daily History patterns & Category counts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Trend Card */}
              <Card className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" /> Weekly Completion history
                </h3>
                {loading ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 text-emerald-500 border-t-2 border-emerald-500 border-l border-transparent rounded-full" />
                  </div>
                ) : weeklyHistory.length > 0 ? (
                  <div className="space-y-3.5 pt-2">
                    {weeklyHistory.map((day) => {
                      const d = new Date(day.date);
                      const displayWeekday = d.toLocaleDateString(undefined, { weekday: "short" });
                      const dayOfMonth = d.getDate();
                      
                      // Percent counts bar
                      const widthPct = day.count > 0 ? Math.min(100, Math.round((day.count / stats.totalGoals) * 100)) : 0;

                      return (
                        <div key={day.date} className="flex items-center justify-between text-xs gap-3">
                          <span className="w-16 text-slate-400 font-bold uppercase text-[10px] shrink-0">
                            {displayWeekday} ({dayOfMonth})
                          </span>

                          <div className="flex-1 h-5 rounded-md overflow-hidden bg-slate-950 border border-slate-900 relative">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-md transition-all duration-300"
                              style={{ width: `${widthPct || 8}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-300">
                              {day.count} progress logs completed
                            </span>
                          </div>

                          <span className="w-10 text-right text-emerald-400 font-extrabold shrink-0">
                            {widthPct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-10 text-center">No progress logged in the past week.</p>
                )}
              </Card>

              {/* Lĩnh vực / Category breakdown cards */}
              <Card className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" /> Habits Categorization Focus
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 pt-2">
                  {categoryStats.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.name}
                        className="flex items-center gap-3 bg-slate-950/50 p-4 border border-slate-800/40 rounded-xl"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{cat.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            {cat.count} goal{cat.count > 1 ? "s" : ""} registered
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Heatmap calendar log grid */}
            <Card className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/40 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400" /> Activity Calendar grid (Past 4 Weeks)
                </h3>
                <span className="text-[10px] text-slate-500 font-medium font-mono">
                  Calculated based on calendar daily check-ins
                </span>
              </div>

              <div className="pt-2">
                <div className="grid grid-cols-7 gap-2.5 max-w-[340px] sm:max-w-[420px] mx-auto">
                  {history.map((day) => {
                    const d = new Date(day.date);
                    const dayNum = d.getDate();
                    const dayName = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });

                    return (
                      <div
                        key={day.date}
                        className={`aspect-square w-full rounded-lg border flex flex-col items-center justify-center text-[10px] font-black transition-all hover:scale-110 shadow-sm relative group cursor-pointer ${getHeatmapColorClass(
                          day.count
                        )}`}
                      >
                        <span>{dayNum}</span>

                        {/* Interactive tooltip bubble indicator */}
                        <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-slate-900 border border-slate-800 text-white font-semibold text-[9px] rounded-lg px-2.5 py-1 whitespace-nowrap z-30 transition-all shadow-xl font-sans">
                          {dayName}: {day.count} completion log{day.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-500">
                  <span>Less Active</span>
                  <div className="h-3.5 w-3.5 rounded bg-slate-900 border border-slate-800" />
                  <div className="h-3.5 w-3.5 rounded bg-emerald-950/40 border border-emerald-900/50" />
                  <div className="h-3.5 w-3.5 rounded bg-emerald-900/60 border border-emerald-800/60" />
                  <div className="h-3.5 w-3.5 rounded bg-emerald-600 border border-emerald-500" />
                  <span>More Active</span>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Stats;
