// src/components/Sidebar.tsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import { useAICoachStore } from "../store/aiCoachStore";
import { syncOfflineData } from "../services/syncManager";
import { useTranslation } from "../i18n";

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
  const { goals, isOffline, isSyncing } = useGoalStore();
  const { openDrawer } = useAICoachStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const bestStreak = Math.max(0, ...goals.map((g) => g.streak?.current_streak || 0));

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSyncNow = () => {
    if (navigator.onLine) syncOfflineData();
  };

  const handleOpenAICoach = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent("open-ai-coach"));
    openDrawer();
  };

  return (
    <aside
      id="app-sidebar"
      className="shrink-0 hidden md:flex flex-col h-screen sticky top-0"
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

      {/* Offline / Syncing status banner */}
      {isOffline && (
        <div
          className="mx-3 mb-3 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{
            background: "rgba(255, 140, 0, 0.12)",
            border: "1px solid rgba(255, 140, 0, 0.25)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#fb923c" }}>cloud_off</span>
          <div className="flex flex-col leading-tight">
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#fb923c" }}>{t("common.offline")}</span>
            <span style={{ fontSize: "9px", color: "rgba(251,146,60,0.8)", fontWeight: 500 }}>{t("goalCard.offlineQueue")}</span>
          </div>
        </div>
      )}
      {!isOffline && isSyncing && (
        <div
          className="mx-3 mb-3 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{
            background: "rgba(192, 193, 255, 0.08)",
            border: "1px solid rgba(192, 193, 255, 0.2)",
          }}
        >
          <div className="spinner" style={{ width: "14px", height: "14px", color: "var(--color-primary)" }} />
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)" }}>{t("common.syncing")}</span>
        </div>
      )}

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
            <span>{t("goalCard.streakDays", { days: bestStreak })}</span>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1">
        <NavItem to="/" icon="home" label={t("nav.dashboard")} end />
        <NavItem to="/stats" icon="query_stats" label={t("nav.statistics")} />
        <NavItem to="/goals" icon="checklist" label={t("nav.goals")} />
        <NavItem to="/timeline" icon="timeline" label={t("nav.timeline")} />
        <NavItem to="/groups" icon="group" label={t("nav.habitGroups")} />
        <button
          type="button"
          onClick={handleOpenAICoach}
          className="nav-item w-full cursor-pointer border-0 bg-transparent text-left pointer-events-auto"
          style={{ fontFamily: "inherit" }}
        >
          <Brain size={22} />
          <span>AI Coach</span>
        </button>
        <NavItem to="/settings" icon="settings" label={t("nav.settings")} />
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
          title={t("auth.logout")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            logout
          </span>
        </button>
      </div>

      {/* New Goal Button */}
      <div className="px-3 pb-5">
        {isOffline ? (
          <div
            className="btn-primary w-full opacity-50 cursor-not-allowed"
            title={t("common.offline")}
            style={{ pointerEvents: "none" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>cloud_off</span>
            {t("goals.newGoal")}
          </div>
        ) : (
          <NavLink to="/new-goal" className="btn-primary w-full">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              add
            </span>
            {t("goals.newGoal")}
          </NavLink>
        )}
      </div>
    </aside>
  );
}
