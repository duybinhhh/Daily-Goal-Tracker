// src/App.tsx
import React, { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import { AICoachDrawer } from "./components/AICoachDrawer";
import { InAppReminderCenter } from "./components/InAppReminderCenter";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GoalFormPage } from "./pages/GoalFormPage";
import { Stats } from "./pages/Stats";
import { SettingsPage } from "./pages/SettingsPage";
import TimelinePage from "./pages/TimelinePage";
import FriendsPage from "./pages/FriendsPage";
import GoalsPage from "./pages/GoalsPage";
import GroupsPage from "./pages/GroupsPage";
import { QuickCheckInPage } from "./pages/QuickCheckInPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import JoinGroupPage from "./pages/JoinGroupPage";

import { useGoalStore } from "./store/goalStore";
import { syncOfflineData } from "./services/syncManager";
import { LanguageProvider } from "./i18n";
import LevelUpModal from "./components/LevelUpModal";


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

// Redirect Handler for US-15 AC-1
interface RedirectHandlerProps {
  children: React.ReactNode;
}

const RedirectHandler: React.FC<RedirectHandlerProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { goals, fetchGoals } = useGoalStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (location.pathname !== "/onboarding") {
        fetchGoals().catch((err) => console.error("Error fetching goals in RedirectHandler:", err));
      }
    }
  }, [isAuthenticated, user, location.pathname, fetchGoals]);

  useEffect(() => {
    if (isAuthenticated && user && location.pathname !== "/onboarding") {
      const notCompletedOnboarding = user.onboarding_completed === false;
      const hasNoGoals = goals.length === 0;
      const isNewUser = user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 5 * 60 * 1000;

      if (notCompletedOnboarding && hasNoGoals && isNewUser) {
        navigate("/onboarding");
      }
    }
  }, [isAuthenticated, user, goals, location.pathname, navigate]);

  return <>{children}</>;
};

export default function App() {
  const { checkAuth } = useAuthStore();
  const { setIsOffline } = useGoalStore();
  const syncInitialized = React.useRef(false);

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

    // Debounce timer ref for online event
    let onlineDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOffline(false);
      // Debounce: network "online" can fire multiple times in quick succession
      if (onlineDebounceTimer) clearTimeout(onlineDebounceTimer);
      onlineDebounceTimer = setTimeout(() => {
        syncOfflineData();
      }, 500);
    };
    const handleOffline = () => {
      setIsOffline(true);
      if (onlineDebounceTimer) clearTimeout(onlineDebounceTimer);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Run initial connectivity verification — only once (guards against StrictMode double-invoke)
    setIsOffline(!navigator.onLine);
    if (navigator.onLine && !syncInitialized.current) {
      syncInitialized.current = true;
      syncOfflineData();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (onlineDebounceTimer) clearTimeout(onlineDebounceTimer);
    };
  }, [checkAuth, setIsOffline]);


  return (
    <LanguageProvider>
      <HashRouter>
        <RedirectHandler>
          <Routes>
            {/* Public authentication page — no sidebar */}
            <Route path="/login" element={<LoginPage />} />

            {/* Join page — handles its own auth logic */}
            <Route path="/join/:inviteCode" element={<JoinGroupPage />} />

            {/* Onboarding page — no sidebar, but protected */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

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
        </RedirectHandler>
      </HashRouter>
      <LevelUpModal />
    </LanguageProvider>
  );
}

import { PomodoroWidget } from "./components/pomodoro/PomodoroWidget";

function AppLayout() {
  const [isAICoachOpen, setIsAICoachOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOpenAICoach = () => setIsAICoachOpen(true);
    window.addEventListener("open-ai-coach", handleOpenAICoach);
    return () => window.removeEventListener("open-ai-coach", handleOpenAICoach);
  }, []);

  React.useEffect(() => {
    const handleOpenCheckIn = (e: any) => {
      // In this project, check-in is handled in DashboardPage via handleLogProgress
      // or we can redirect to a specific check-in page if goalId is provided
      // For simplicity, let's see if we can trigger the note input on the Dashboard
      // or just navigate to the dashboard with a search param.
      // Another option: navigate to /quick-checkin
      window.location.hash = `#/quick-checkin?goalId=${e.detail}`;
    };
    window.addEventListener("open-check-in", handleOpenCheckIn);
    return () => window.removeEventListener("open-check-in", handleOpenCheckIn);
  }, []);

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
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/quick-checkin" element={<QuickCheckInPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Bottom Nav for Mobile */}
      <BottomNav />

      <InAppReminderCenter />

      <AICoachDrawer isOpen={isAICoachOpen} onClose={() => setIsAICoachOpen(false)} />

      <PomodoroWidget />
    </div>
  );
}
