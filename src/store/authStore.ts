// src/store/authStore.ts
import { create } from "zustand";
import api, {
  getStoredAccessToken,
  setStoredTokens,
  clearStoredTokens,
} from "../services/api";
import { User } from "../types";

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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  isAuthenticated: !!getStoredAccessToken(),
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: () => {
    const token = getStoredAccessToken();
    const userJson = localStorage.getItem("user");
    if (token && userJson) {
      set({
        user: JSON.parse(userJson),
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

      set({
        user,
        isAuthenticated: true,
        loading: false,
      });

      // Silently try to seed some sample goals for this user if they are empty
      try {
        await api.post("/api/seed", { userId: user.id });
      } catch (seedErr) {
        console.warn("Goals seed bypassed:", seedErr);
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

      set({
        user,
        isAuthenticated: true,
        loading: false,
      });

      // Immediately seed welcoming sample goals
      try {
        await api.post("/api/seed", { userId: user.id });
      } catch (seedErr) {
        console.warn("Goals seed bypassed:", seedErr);
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
      set({ user: null, isAuthenticated: false, error: null });
    }
  },
}));
