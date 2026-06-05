// src/components/BottomNav.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

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

  if (!isAuthenticated) return null;

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
      <BottomNavItem to="/" icon="home" label="Home" end />
      <BottomNavItem to="/stats" icon="query_stats" label="Stats" />
      <BottomNavItem to="/goals" icon="checklist" label="Goals" />
      <BottomNavItem to="/groups" icon="group" label="Groups" />
      <BottomNavItem to="/timeline" icon="timeline" label="Timeline" />
      <BottomNavItem to="/settings" icon="settings" label="Settings" />
    </nav>
  );
}
