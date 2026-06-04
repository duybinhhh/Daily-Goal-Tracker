// src/components/Sidebar.tsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `nav-item ${isActive ? "nav-item-active" : ""}`
    }
  >
    <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
      {icon}
    </span>
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { goals } = useGoalStore();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const bestStreak = Math.max(0, ...goals.map((g) => g.streak?.current_streak || 0));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      id="app-sidebar"
      className="shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        width: "220px",
        borderRight: "1px solid var(--border-subtle)",
        background: "var(--sidebar-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 mb-2">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{ background: "var(--color-primary)" }}
        >
          <span
            className="material-symbols-outlined ms-filled"
            style={{ fontSize: "20px", color: "var(--color-on-primary)" }}
          >
            bolt
          </span>
        </div>
        <div className="flex flex-col leading-tight">
          <span
            className="font-bold tracking-tight"
            style={{ fontSize: "16px", color: "var(--color-on-surface)" }}
          >
            DailyGoal
          </span>
          <span
            className="uppercase tracking-widest"
            style={{ fontSize: "9px", color: "var(--color-outline)", fontWeight: 600 }}
          >
            TRACKER
          </span>
        </div>
      </div>

      {/* Streak Badge */}
      {bestStreak > 0 && (
        <div className="px-4 mb-3" style={{ display: "flex", justifyContent: "center" }}>
          <div className="streak-badge">
            <span
              className="material-symbols-outlined ms-filled"
              style={{ fontSize: "14px" }}
            >
              local_fire_department
            </span>
            <span>{bestStreak} Day Streak</span>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1">
        <NavItem to="/" icon="home" label="Dashboard" end />
        <NavItem to="/stats" icon="query_stats" label="Statistics" />
        <NavItem to="/timeline" icon="timeline" label="Timeline" />
        <NavItem to="/settings" icon="settings" label="Settings" />
      </nav>

      {/* User section */}
      <div
        className="mx-3 mb-3 p-3 rounded-2xl flex items-center gap-3"
        style={{
          background: "var(--color-surface-container)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
          style={{
            background: "color-mix(in srgb, var(--color-primary) 20%, var(--color-surface-container-high))",
            color: "var(--color-primary)",
            border: "1px solid rgba(192,193,255,0.2)",
          }}
        >
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold truncate"
            style={{ fontSize: "13px", color: "var(--color-on-surface)" }}
          >
            {user?.name || "User"}
          </p>
          <p
            className="uppercase tracking-widest truncate"
            style={{ fontSize: "9px", color: "var(--color-outline)", fontWeight: 600 }}
          >
            Pro Member
          </p>
        </div>
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-danger-ghost"
          title="Sign Out"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            logout
          </span>
        </button>
      </div>

      {/* New Goal Button */}
      <div className="px-3 pb-5">
        <NavLink to="/new-goal" className="btn-primary w-full">
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            add
          </span>
          New Goal
        </NavLink>
      </div>
    </aside>
  );
}
