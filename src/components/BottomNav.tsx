// src/components/BottomNav.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Brain } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useAICoachStore } from "../store/aiCoachStore";
import { useTranslation } from "../i18n";

interface BottomNavItemProps {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center flex-1 py-1.5 transition-all text-center select-none ${
        isActive
          ? "text-[var(--color-primary)] font-semibold"
          : "text-[var(--color-on-surface-variant)] opacity-70 hover:opacity-100"
      }`
    }
  >
    <span className="material-symbols-outlined ms-filled" style={{ fontSize: "22px" }}>
      {icon}
    </span>
    <span style={{ fontSize: "9px", marginTop: "2px", letterSpacing: "0.02em" }}>{label}</span>
  </NavLink>
);

export default function BottomNav() {
  const { isAuthenticated } = useAuthStore();
  const { openDrawer } = useAICoachStore();
  const { t } = useTranslation();

  if (!isAuthenticated) return null;

  const handleOpenAICoach = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent("open-ai-coach"));
    openDrawer();
  };

  return (
    <nav
      id="mobile-bottom-nav"
      className="flex md:hidden sticky bottom-0 z-50 w-full"
      style={{
        height: "60px",
        background: "var(--sidebar-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <BottomNavItem to="/" icon="home" label={t("nav.home")} end />
      <BottomNavItem to="/stats" icon="query_stats" label={t("nav.stats")} />
      <BottomNavItem to="/goals" icon="checklist" label={t("nav.goals")} />
      <BottomNavItem to="/friends" icon="people" label="Bạn bè" />
      <BottomNavItem to="/discipline-room" icon="video_camera_front" label="Kỷ luật" />
      <BottomNavItem to="/groups" icon="group" label={t("nav.groups")} />
      <BottomNavItem to="/timeline" icon="timeline" label={t("nav.timeline")} />
      <button
        type="button"
        onClick={handleOpenAICoach}
        className="flex min-w-[54px] flex-1 cursor-pointer flex-col items-center justify-center border-0 bg-transparent py-1.5 text-center text-[var(--color-on-surface-variant)] opacity-70 transition-all hover:opacity-100 pointer-events-auto"
        style={{ fontFamily: "inherit" }}
      >
        <Brain size={22} />
        <span style={{ fontSize: "9px", marginTop: "2px", letterSpacing: "0.02em" }}>AI Coach</span>
      </button>
      <BottomNavItem to="/settings" icon="settings" label={t("nav.settings")} />
    </nav>
  );
}
