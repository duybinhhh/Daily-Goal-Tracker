// src/App.tsx
import React, { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GoalFormPage } from "./pages/GoalFormPage";
import { Stats } from "./pages/Stats";
import { SettingsPage } from "./pages/SettingsPage";
import TimelinePage from "./pages/TimelinePage";
import GoalsPage from "./pages/GoalsPage";

// Auth Guard for protected workspace screens
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
    const savedTheme = localStorage.getItem("setting_theme") || "light";
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [checkAuth]);

  return (
    <HashRouter>
      <Routes>
        {/* Public authentication page — no sidebar */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected pages — with persistent sidebar */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
}

function AppLayout() {
  return (
    <div
      id="app-wrapper"
      className="flex flex-col md:flex-row"
      style={{
        width: "100vw",
        height: "100vh",
        background: "var(--color-background)",
        color: "var(--color-on-background)",
      }}
    >
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Scrollable main area — fills remaining width */}
      <div
        id="main-scroll-area"
        className="flex-1 min-h-0 flex flex-col md:h-screen"
        style={{
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/new-goal" element={<GoalFormPage />} />
          <Route path="/edit-goal/:id" element={<GoalFormPage />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
}
