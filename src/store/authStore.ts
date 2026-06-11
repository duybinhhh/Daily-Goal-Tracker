// src/store/authStore.ts
import { create } from "zustand";
import api, {
  getStoredAccessToken,
  setStoredTokens,
  clearStoredTokens,
} from "../services/api";
import { User } from "../types";
import { clearCachedMetadata } from "../services/indexedDb";

async function clearSessionGoalData() {
  await Promise.all([
    clearCachedMetadata("goals"),
    clearCachedMetadata("guest_goals"),
    clearCachedMetadata("stats"),
    clearCachedMetadata("history"),
  ]);

  try {
    const { useGoalStore } = await import("./goalStore");
    useGoalStore.setState({
      goals: [],
      stats: null,
      history: [],
      loading: false,
      error: null,
      isSyncing: false,
      showGuestAuthModal: false,
    });
  } catch (error) {
    console.warn("Goal store cleanup skipped:", error);
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, timezone?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  clearError: () => void;
  updateProfile: (name: string, email: string, timezone: string) => Promise<void>;
  updatePrivacy: (showActivityInFeed: boolean) => Promise<void>;
  deleteAccount: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const getStoredUser = (): User | null => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as User;
  } catch (error) {
    console.warn("Invalid stored user cleared:", error);
    clearStoredTokens();
    localStorage.removeItem("user");
    localStorage.removeItem("onboarding_completed");
    return null;
  }
};

const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!getStoredAccessToken() && !!initialUser,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: () => {
    const token = getStoredAccessToken();
    const user = getStoredUser();
    if (token && user) {
      if (localStorage.getItem("onboarding_completed") === "true") {
        user.onboarding_completed = true;
      }
      set({
        user,
        isAuthenticated: true,
        loading: false,
      });
    } else {
      clearStoredTokens();
      localStorage.removeItem("user");
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const { user, accessToken, refreshToken } = response.data;

      setStoredTokens(accessToken, refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      if (user.onboarding_completed) {
        localStorage.setItem("onboarding_completed", "true");
      } else {
        localStorage.removeItem("onboarding_completed");
      }

      set({
        user,
        isAuthenticated: true,
        loading: false,
      });

      // Silently try to seed some sample goals for this user only if onboarding is completed
      if (user.onboarding_completed) {
        try {
          await api.post("/api/seed", { userId: user.id });
        } catch (seedErr) {
          console.warn("Goals seed bypassed:", seedErr);
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Login failed. Please verify credentials.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  register: async (email, password, name, timezone) => {
    set({ loading: true, error: null });
    try {
      const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const response = await api.post("/api/auth/register", {
        email,
        password,
        name,
        timezone: tz,
      });
      const { user, accessToken, refreshToken } = response.data;

      setStoredTokens(accessToken, refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      if (user.onboarding_completed) {
        localStorage.setItem("onboarding_completed", "true");
      } else {
        localStorage.removeItem("onboarding_completed");
      }

      set({
        user,
        isAuthenticated: true,
        loading: false,
      });

      // Immediately seed welcoming sample goals only if onboarding is completed
      if (user.onboarding_completed) {
        try {
          await api.post("/api/seed", { userId: user.id });
        } catch (seedErr) {
          console.warn("Goals seed bypassed:", seedErr);
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Registration failed. Try again.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.warn("Server-side logout ignored:", err);
    } finally {
      clearStoredTokens();
      localStorage.removeItem("user");
      localStorage.removeItem("onboarding_completed");
      await clearSessionGoalData();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  updateProfile: async (name, email, timezone) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put("/api/auth/profile", { name, email, timezone });
      const { user, accessToken } = response.data;
      
      localStorage.setItem("user", JSON.stringify(user));
      if (accessToken) {
        const currentRefreshToken = localStorage.getItem("refreshToken") || "";
        setStoredTokens(accessToken, currentRefreshToken);
      }

      set({
        user,
        loading: false,
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to update profile.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  updatePrivacy: async (showActivityInFeed) => {
    set({ loading: true, error: null });
    try {
      await api.patch("/api/friends/privacy", { showActivityInFeed });
      set((state) => {
        const updatedUser = state.user ? { ...state.user, show_activity_in_feed: showActivityInFeed } : null;
        if (updatedUser) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        return { user: updatedUser, loading: false };
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to update privacy settings.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  deleteAccount: async () => {
    set({ loading: true, error: null });
    try {
      await api.delete("/api/auth/profile");
      clearStoredTokens();
      localStorage.removeItem("user");
      localStorage.removeItem("onboarding_completed");
      await clearSessionGoalData();
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to delete account.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  completeOnboarding: async () => {
    localStorage.setItem("onboarding_completed", "true");
    try {
      await api.put("/api/auth/profile", { onboarding_completed: true });
    } catch (err) {
      console.warn("Server-side onboarding update bypassed:", err);
    }
    set((state) => {
      const updatedUser = state.user ? { ...state.user, onboarding_completed: true } : null;
      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },
}));
