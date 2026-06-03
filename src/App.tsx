// src/App.tsx
import React, { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Navbar from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GoalFormPage } from "./pages/GoalFormPage";
import { Stats } from "./pages/Stats";

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
  }, [checkAuth]);

  return (
    <HashRouter>
      <div
        id="app-wrapper"
        className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-600 selection:text-white"
      >
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            {/* Public authentication page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected daily tracker screens */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-goal"
              element={
                <ProtectedRoute>
                  <GoalFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-goal/:id"
              element={
                <ProtectedRoute>
                  <GoalFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <Stats />
                </ProtectedRoute>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
