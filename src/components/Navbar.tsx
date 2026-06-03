// src/components/Navbar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import { Target, BarChart2, LogOut, Plus, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { goals } = useGoalStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  const totalGoalCount = goals.length;
  const completedTodayCount = goals.filter((g) => g.current_count >= g.target_count).length;

  return (
    <nav
      id="app-navbar"
      className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Brand */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-950/45 transition-all group-hover:scale-105">
              <Target className="h-5.5 w-5.5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-sm font-bold tracking-tight text-white leading-tight">
                DailyGoal
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-semibold leading-none">
                TRACKER
              </span>
            </div>
          </NavLink>

          {/* Center Links (Primary Nav NavLinks) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-emerald-400 font-semibold border border-slate-800"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`
              }
            >
              <Target className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/stats"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-emerald-400 font-semibold border border-slate-800"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`
              }
            >
              <BarChart2 className="h-4 w-4" />
              <span>Statistics</span>
            </NavLink>
          </div>

          {/* Right Section: Add Button, user details & Logout */}
          <div className="flex items-center gap-3">
            <NavLink
              to="/new-goal"
              className="flex h-9 items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:translate-y-[-1px]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Goal</span>
            </NavLink>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-100 line-clamp-1 max-w-[120px]">
                  {user?.name || "User"}
                </span>
                <span className="flex items-center justify-end gap-1 text-[10px] font-semibold text-emerald-400 mt-0.5">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  {completedTodayCount}/{totalGoalCount} Met
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-all focus:outline-none"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
