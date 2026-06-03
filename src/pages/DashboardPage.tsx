// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Flame, Sparkles, FolderKanban, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { useGoals } from "../hooks/useGoals";
import { useAuthStore } from "../store/authStore";
import { GoalCard } from "../components/GoalCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    filteredGoals,
    categories,
    activeCategory,
    setActiveCategory,
    goals,
    loading,
    error,
    refreshAll,
    completeGoalProgress,
    deleteGoal,
  } = useGoals();

  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const totalActCount = goals.filter((g) => g.status === "active").length;
  const doneTodayCount = goals.filter((g) => g.current_count >= g.target_count).length;
  const completionRate = totalActCount > 0 ? Math.round((doneTodayCount / totalActCount) * 100) : 0;

  // Derive high streak stats safely from goals
  const activeStreaks = goals.map((g) => g.streak?.current_streak || 0);
  const bestCurrentStreak = activeStreaks.length > 0 ? Math.max(...activeStreaks) : 0;

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dynamic User Greetings Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              {greeting}, {user?.name || "Achiever"}! <Sparkles className="w-5 h-5 text-amber-400 fill-amber-500/20" />
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Here is your daily layout. Achieve your milestones step-by-step today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshAll}
              className="text-slate-400 py-1.5 px-3 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
            <Link to="/new-goal">
              <Button variant="primary" size="md" className="font-semibold text-xs sm:text-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add New Goal
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 mr-1" />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard Analytics Bento boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block">Today's Progress</span>
              <span className="text-3xl font-extrabold text-slate-100">{doneTodayCount} / {totalActCount}</span>
              <span className="text-xs text-emerald-400 block font-medium">Completed goals count</span>
            </div>
            <div className="relative h-16 w-16 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-full">
              <span className="text-xs font-bold text-slate-100">{completionRate}%</span>
            </div>
          </Card>

          <Card className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block">Active Streak Highs</span>
              <span className="text-3xl font-extrabold text-amber-400 flex items-center gap-1.5">
                <Flame className="w-7 h-7 text-amber-500 fill-amber-500/25" />
                {bestCurrentStreak} days
              </span>
              <span className="text-xs text-slate-400 block">Your best consecutive streak</span>
            </div>
          </Card>

          <Card className="flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block">Metrics Rate</span>
              <div className="h-2 w-full max-w-[180px] bg-slate-950 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="text-slate-400 text-xs block pt-2">{completionRate}% total completion percentage</span>
            </div>
            <div className="h-10 w-10 shrink-0 flex items-center justify-center bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* Category filters chip sliders */}
        {goals.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all border ${
                  activeCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Content view list */}
        {loading ? (
          <div className="text-center py-24 space-y-3">
            <div className="animate-spin h-8 w-8 text-emerald-500 mx-auto border-t-2 border-emerald-500 border-l border-r border-transparent rounded-full" />
            <p className="text-sm text-slate-400">Loading daily layout...</p>
          </div>
        ) : filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onComplete={completeGoalProgress}
                onDelete={deleteGoal}
              />
            ))}
          </div>
        ) : (
          <div className="text-center max-w-md mx-auto py-16 px-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            {goals.length === 0 ? (
              <div className="space-y-4">
                <FolderKanban className="w-12 h-12 text-slate-600 mx-auto stroke-[1.5]" />
                <div>
                  <h3 className="text-base font-bold text-slate-200">No goals found</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Start tracking healthy habits today by writing down your first daily target.
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/new-goal">
                    <Button variant="primary" size="md">
                      <Plus className="w-4 h-4 mr-1.5" />
                      Create first Goal
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <BookOpen className="w-11 h-11 text-slate-600 mx-auto stroke-[1.5]" />
                <div>
                  <h3 className="text-base font-semibold text-slate-200">No habits on category "{activeCategory}"</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    No active daily goals map to this category selector right now.
                  </p>
                </div>
                <div className="pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setActiveCategory("All")}>
                    Clear Filter
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
