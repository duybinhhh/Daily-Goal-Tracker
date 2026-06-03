// src/store/goalStore.ts
import { create } from "zustand";
import api from "../services/api";
import { Goal, DashboardStats, HistoryData } from "../types";

interface GoalState {
  goals: Goal[];
  stats: DashboardStats | null;
  history: HistoryData[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchHistory: (from?: string, to?: string) => Promise<void>;
  createGoal: (goalData: {
    title: string;
    description: string;
    category: string;
    target_count: number;
    frequency: string;
    due_date?: string | null;
  }) => Promise<void>;
  updateGoal: (id: string, goalData: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  completeGoalProgress: (id: string, note?: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  stats: null,
  history: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/api/goals");
      set({ goals: response.data.goals, loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to fetch goals.";
      set({ error: msg, loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.get("/api/stats/dashboard");
      set({ stats: response.data.stats });
    } catch (error: any) {
      console.error("Failed to fetch dashboard stats", error);
    }
  },

  fetchHistory: async (from, to) => {
    try {
      const params: any = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await api.get("/api/stats/history", { params });
      set({ history: response.data.history });
    } catch (error: any) {
      console.error("Failed to fetch statistics histories", error);
    }
  },

  createGoal: async (goalData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/api/goals", goalData);
      const newGoal = response.data.goal;
      
      set((state) => ({
        goals: [newGoal, ...state.goals],
        loading: false,
      }));

      // Automatically refresh overview stats
      get().fetchStats();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create a new goal.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  updateGoal: async (id, goalData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/api/goals/${id}`, goalData);
      const updatedGoal = response.data.goal;

      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedGoal } : g)),
        loading: false,
      }));

      get().fetchStats();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to update the goal.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  deleteGoal: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/goals/${id}`);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        loading: false,
      }));
      get().fetchStats();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to delete the goal.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  completeGoalProgress: async (id, note) => {
    try {
      const response = await api.post(`/api/goals/${id}/complete`, { note });
      const updatedGoal = response.data.goal;

      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedGoal } : g)),
      }));

      // Immediately refresh stats metrics + logs history
      get().fetchStats();
      get().fetchHistory();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to complete goal progress.";
      set({ error: msg });
      throw new Error(msg);
    }
  },
}));
