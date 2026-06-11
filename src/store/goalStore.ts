// src/store/goalStore.ts
import { create } from "zustand";
import api from "../services/api";
import { useAuthStore } from "./authStore";
import { Goal, GoalLog, DashboardStats, HistoryData } from "../types";
import {
  getCachedMetadata,
  setCachedMetadata,
  getPendingQueue,
  addToSyncQueue,
  removeFromSyncQueue,
  getSyncAction,
} from "../services/indexedDb";

export type GuestAuthTrigger =
  | "create_goal"
  | "sync"
  | "groups"
  | "discipline_room"
  | "friends"
  | "stats"
  | "ai_coach";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sanitize API errors: replace raw Prisma/DB technical messages with
 * user-friendly text before they ever reach the UI.
 */
function sanitizeApiError(error: any): string {
  const isNetworkOrServerError =
    !error.response ||
    error.code === "ERR_NETWORK" ||
    (error.response?.status ?? 0) >= 500 ||
    error.response?.status === 503;

  if (isNetworkOrServerError) {
    return "Unable to connect to the server. Please check your network connection and try again.";
  }

  const msg: string = error.response?.data?.message || error.message || "";

  // Catch any Prisma/DB technical messages that slipped through
  if (
    msg.includes("prisma.") ||
    msg.includes("Can't reach") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("Connection refused") ||
    msg.includes("PrismaClient") ||
    msg.includes("supabase.com") ||
    msg.includes("server/db.ts") ||
    msg.includes("D:\\Download")
  ) {
    return "Unable to connect to the server. Please check your network connection and try again.";
  }

  return msg || "An unexpected error occurred. Please try again.";
}

interface CompleteGoalResponse {
  success: boolean;
  message: string;
  goal: Goal;
  log: GoalLog;
}

function getLogDedupeKey(log: Pick<GoalLog, "goal_id" | "completed_at" | "note">): string {
  return [
    log.goal_id,
    log.completed_at,
    (log.note || "").trim(),
  ].join("|");
}

function normalizeHistory(history: HistoryData[]): HistoryData[] {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const days = new Map<string, HistoryData>();

  history.forEach((day) => {
    const existingDay = days.get(day.date) || { date: day.date, count: 0, logs: [] };

    (day.logs || []).forEach((log) => {
      const key = getLogDedupeKey(log);
      if (seenIds.has(log.id) || seenKeys.has(key)) {
        return;
      }

      seenIds.add(log.id);
      seenKeys.add(key);
      existingDay.logs.push(log);
    });

    existingDay.count = existingDay.logs.length;
    days.set(day.date, existingDay);
  });

  return Array.from(days.values()).sort((a, b) => a.date.localeCompare(b.date));
}

interface GoalState {
  goals: Goal[];
  stats: DashboardStats | null;
  history: HistoryData[];
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  isSyncing: boolean;
  showGuestAuthModal: boolean;
  guestAuthTrigger: GuestAuthTrigger;
  setIsOffline: (isOffline: boolean) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setShowGuestAuthModal: (show: boolean, trigger?: GuestAuthTrigger) => void;
  clearError: () => void;
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
  archiveGoal: (id: string) => Promise<void>;
  restoreGoal: (id: string) => Promise<void>;
  bulkArchiveGoals: (ids: string[]) => Promise<void>;
  bulkPauseGoals: (ids: string[]) => Promise<void>;
  bulkDeleteGoals: (ids: string[]) => Promise<void>;
  completeGoalProgress: (id: string, note?: string) => Promise<CompleteGoalResponse>;
  deleteLogProgress: (logId: string, goalId?: string) => Promise<void>;
}

let lastHistoryFrom: string | undefined = undefined;
let lastHistoryTo: string | undefined = undefined;

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  stats: null,
  history: [],
  loading: false,
  error: null,
  isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  isSyncing: false,
  showGuestAuthModal: false,
  guestAuthTrigger: "create_goal",

  setIsOffline: (isOffline) => set({ isOffline }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setShowGuestAuthModal: (show, trigger = "create_goal") => set({ showGuestAuthModal: show, guestAuthTrigger: trigger }),
  clearError: () => set({ error: null }),

  fetchGoals: async () => {
    set({ loading: true, error: null });
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    const mergePending = async (fetchedGoals: Goal[]) => {
      const pending = await getPendingQueue();
      if (pending.length === 0) return fetchedGoals;
      
      return fetchedGoals.map((g: Goal) => {
        const pendingCompletions = pending.filter((p) => p.goalId === g.id && p.action === "complete");
        if (pendingCompletions.length > 0) {
          const newCount = g.current_count + pendingCompletions.length;
          return {
            ...g,
            current_count: newCount,
            status: newCount >= g.target_count ? "completed" : g.status,
          };
        }
        return g;
      });
    };

    const loadCachedGoals = async () => {
      const cacheKey = useAuthStore.getState().isAuthenticated ? "goals" : "guest_goals";
      const cached = await getCachedMetadata(cacheKey);
      if (cached) {
        const goalsWithPending = await mergePending(cached);
        set({ goals: goalsWithPending, loading: false });
        return true;
      }
      return false;
    };

    if (!isAuthenticated) {
      const loaded = await loadCachedGoals();
      set({ loading: false });
      if (!loaded) set({ goals: [] });
      return;
    }

    if (!navigator.onLine) {
      const loaded = await loadCachedGoals();
      if (loaded) return;
    }

    try {
      const response = await api.get("/api/goals");
      const serverGoals = response.data.goals;
      
      // Cache the raw server data
      await setCachedMetadata("goals", serverGoals);
      
      // Always merge pending offline queue, in case sync hasn't finished yet
      const goalsWithPending = await mergePending(serverGoals);
      
      set({ goals: goalsWithPending, loading: false });
    } catch (error: any) {
      const isNetworkOrServerError = !error.response || error.code === "ERR_NETWORK" || (error.response?.status ?? 0) >= 500;
      if (isNetworkOrServerError) {
        const loaded = await loadCachedGoals();
        if (loaded) return;
      }
      // Don't show fetch error if we have cached data from a previous load
      const hasCachedGoals = (await getCachedMetadata("goals")) !== null;
      if (hasCachedGoals) {
        set({ loading: false });
        return;
      }
      const msg = sanitizeApiError(error);
      set({ error: msg, loading: false });
    }
  },

  fetchStats: async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      const guestGoals = await getCachedMetadata("guest_goals");
      const activeGoals = Array.isArray(guestGoals) ? guestGoals.filter((goal: Goal) => !goal.is_archived && goal.status !== "paused") : [];
      const completedToday = activeGoals.filter((goal: Goal) => goal.current_count >= goal.target_count).length;
      const totalProgress = activeGoals.reduce((sum: number, goal: Goal) => sum + Math.min(1, goal.current_count / Math.max(1, goal.target_count)), 0);
      set({
        stats: {
          totalGoals: Array.isArray(guestGoals) ? guestGoals.length : 0,
          activeGoals: activeGoals.length,
          completedGoalsToday: completedToday,
          overallCompletionRate: activeGoals.length ? Math.round((totalProgress / activeGoals.length) * 100) : 0,
          bestCurrentStreak: 0,
          bestLongestStreak: 0,
        },
      });
      return;
    }

    const loadCachedStats = async () => {
      const cached = await getCachedMetadata("stats");
      if (cached) {
        set({ stats: cached });
        return true;
      }
      return false;
    };

    if (!navigator.onLine) {
      const loaded = await loadCachedStats();
      if (loaded) return;
    }

    try {
      const response = await api.get("/api/stats/dashboard");
      set({ stats: response.data.stats });
      // Cache it
      await setCachedMetadata("stats", response.data.stats);
    } catch (error: any) {
      const isNetworkOrServerError = !error.response || error.code === "ERR_NETWORK" || (error.response?.status ?? 0) >= 500;
      if (isNetworkOrServerError) {
        await loadCachedStats();
        return;
      }
      console.error("Failed to fetch dashboard stats", sanitizeApiError(error));
    }
  },

  fetchHistory: async (from, to) => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ history: [] });
      return;
    }

    if (from !== undefined) lastHistoryFrom = from;
    if (to !== undefined) lastHistoryTo = to;

    const activeFrom = from !== undefined ? from : lastHistoryFrom;
    const activeTo = to !== undefined ? to : lastHistoryTo;

    const mergeHistoryPending = async (fetchedHistory: HistoryData[]) => {
      const pending = await getPendingQueue();
      const normalizedHistory = normalizeHistory(fetchedHistory);
      if (pending.length === 0) return normalizedHistory;
      
      // Deep clone to avoid mutating cache directly
      const newHistory: HistoryData[] = JSON.parse(JSON.stringify(normalizedHistory));
      const seenLogIds = new Set<string>();
      const seenLogKeys = new Set<string>();

      newHistory.forEach((h) => {
        h.logs.forEach((log) => {
          seenLogIds.add(log.id);
          seenLogKeys.add(getLogDedupeKey(log));
        });
      });
      
      pending.forEach((p) => {
        if (p.action === "complete") {
          const dateStr = p.payload.completed_at?.split("T")[0] || new Date().toISOString().split("T")[0];
          const newLog: GoalLog = {
            id: p.id,
            goal_id: p.goalId,
            user_id: "local",
            completed_at: p.payload.completed_at || new Date().toISOString(),
            note: p.payload.note || null,
            created_at: p.payload.completed_at || new Date().toISOString(),
          };
          const dedupeKey = getLogDedupeKey(newLog);

          if (seenLogIds.has(newLog.id) || seenLogKeys.has(dedupeKey)) {
            return;
          }

          seenLogIds.add(newLog.id);
          seenLogKeys.add(dedupeKey);

          const dayIndex = newHistory.findIndex((h: HistoryData) => h.date === dateStr);
          
          if (dayIndex >= 0) {
            newHistory[dayIndex].logs.push(newLog);
            newHistory[dayIndex].count++;
          } else {
            newHistory.push({
              date: dateStr,
              count: 1,
              logs: [newLog]
            });
          }
        }
      });
      return normalizeHistory(newHistory);
    };

    const loadCachedHistory = async () => {
      const cached = await getCachedMetadata("history");
      if (cached) {
        const merged = await mergeHistoryPending(cached);
        set({ history: merged });
        return true;
      }
      return false;
    };

    if (!navigator.onLine) {
      const loaded = await loadCachedHistory();
      if (loaded) return;
    }

    try {
      const params: any = {};
      if (activeFrom) params.from = activeFrom;
      if (activeTo) params.to = activeTo;
      const response = await api.get("/api/stats/history", { params });
      
      const serverHistory = normalizeHistory(response.data.history);
      await setCachedMetadata("history", serverHistory);
      
      const mergedHistory = await mergeHistoryPending(serverHistory);
      set({ history: mergedHistory });
    } catch (error: any) {
      const isNetworkOrServerError = !error.response || error.code === "ERR_NETWORK" || (error.response?.status ?? 0) >= 500;
      if (isNetworkOrServerError) {
        await loadCachedHistory();
        return;
      }
      console.error("Failed to fetch statistics histories", sanitizeApiError(error));
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
      const msg = sanitizeApiError(error);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  updateGoal: async (id, goalData) => {
    set({ loading: true, error: null });
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      let updatedGoal: Goal | null = null;
      set((state) => {
        const newGoals = state.goals.map((g) => {
          if (g.id === id) {
            updatedGoal = { ...g, ...goalData, updated_at: new Date().toISOString() };
            return updatedGoal;
          }
          return g;
        });
        return { goals: newGoals, loading: false };
      });
      await setCachedMetadata("guest_goals", get().goals);
      get().fetchStats();
      return;
    }

    try {
      const response = await api.put(`/api/goals/${id}`, goalData);
      const updatedGoal = response.data.goal;

      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedGoal } : g)),
        loading: false,
      }));

      get().fetchStats();
    } catch (error: any) {
      const msg = sanitizeApiError(error);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  deleteGoal: async (id) => {
    set({ loading: true, error: null });
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        loading: false,
      }));
      await setCachedMetadata("guest_goals", get().goals);
      get().fetchStats();
      return;
    }

    try {
      await api.delete(`/api/goals/${id}`);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        loading: false,
      }));
      get().fetchStats();
    } catch (error: any) {
      const msg = sanitizeApiError(error);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  archiveGoal: async (id) => {
    set({ loading: true, error: null });
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, is_archived: true, archived_at: new Date().toISOString() } : g)),
        loading: false,
      }));
      await setCachedMetadata("guest_goals", get().goals);
      get().fetchStats();
      return;
    }

    try {
      const response = await api.put(`/api/goals/${id}`, { is_archived: true });
      const updatedGoal = response.data.goal;
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedGoal } : g)),
        loading: false,
      }));
      get().fetchStats();
    } catch (error: any) {
      const msg = sanitizeApiError(error);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  restoreGoal: async (id) => {
    set({ loading: true, error: null });
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, is_archived: false, archived_at: null } : g)),
        loading: false,
      }));
      await setCachedMetadata("guest_goals", get().goals);
      get().fetchStats();
      return;
    }

    try {
      const response = await api.put(`/api/goals/${id}`, { is_archived: false });
      const updatedGoal = response.data.goal;
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedGoal } : g)),
        loading: false,
      }));
      get().fetchStats();
    } catch (error: any) {
      const msg = sanitizeApiError(error);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  bulkArchiveGoals: async (ids) => {
    set({ loading: true, error: null });
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      set((state) => ({
        goals: state.goals.map((g) => (ids.includes(g.id) ? { ...g, is_archived: true, archived_at: new Date().toISOString() } : g)),
        loading: false,
      }));
      await setCachedMetadata("guest_goals", get().goals);
      get().fetchStats();
      return;
    }

    try {
      await api.put(`/api/goals/bulk/archive`, { goalIds: ids });
      set((state) => ({
        goals: state.goals.map((g) => (ids.includes(g.id) ? { ...g, is_archived: true, archived_at: new Date().toISOString() } : g)),
        loading: false,
      }));
      get().fetchStats();
    } catch (error: any) {
      const msg = sanitizeApiError(error);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  bulkPauseGoals: async (ids) => {
    set({ loading: true, error: null });
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      set((state) => ({
        goals: state.goals.map((g) => (ids.includes(g.id) ? { ...g, status: "paused" } : g)),
        loading: false,
      }));
      await setCachedMetadata("guest_goals", get().goals);
      get().fetchStats();
      return;
    }

    try {
      await api.put(`/api/goals/bulk/pause`, { goalIds: ids });
      set((state) => ({
        goals: state.goals.map((g) => (ids.includes(g.id) ? { ...g, status: "paused" } : g)),
        loading: false,
      }));
      get().fetchStats();
    } catch (error: any) {
      const msg = sanitizeApiError(error);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  bulkDeleteGoals: async (ids) => {
    set({ loading: true, error: null });
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      set((state) => ({
        goals: state.goals.filter((g) => !ids.includes(g.id)),
        loading: false,
      }));
      await setCachedMetadata("guest_goals", get().goals);
      get().fetchStats();
      return;
    }

    try {
      await api.post(`/api/goals/bulk/delete`, { goalIds: ids });
      set((state) => ({
        goals: state.goals.filter((g) => !ids.includes(g.id)),
        loading: false,
      }));
      get().fetchStats();
    } catch (error: any) {
      const msg = sanitizeApiError(error);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  completeGoalProgress: async (id, note) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    const isOffline = !navigator.onLine;
    const logId = generateUUID();
    const completedAt = new Date().toISOString();

    if (!isAuthenticated) {
      // Update local state in memory immediately
      let updatedGoal: Goal | null = null;
      set((state) => {
        const newGoals = state.goals.map((g) => {
          if (g.id === id) {
            const nextCount = g.current_count + 1;
            updatedGoal = {
              ...g,
              current_count: nextCount,
              status: nextCount >= g.target_count ? "completed" : "active",
            };
            return updatedGoal;
          }
          return g;
        });
        return { goals: newGoals };
      });

      // Save updated guest goals to IndexedDB
      await setCachedMetadata("guest_goals", get().goals);

      // Refresh local stats
      get().fetchStats();

      // Show guest auth prompt
      get().setShowGuestAuthModal(true, "sync");

      // Return simulated response
      return {
        success: true,
        message: "Guest progress updated locally.",
        goal: updatedGoal!,
        log: {
          id: logId,
          goal_id: id,
          user_id: "guest",
          completed_at: completedAt,
          note: note || null,
          created_at: completedAt,
        },
      };
    }

    if (isOffline) {
      // Save to syncQueue in IndexedDB
      await addToSyncQueue({
        id: logId,
        action: "complete",
        goalId: id,
        payload: { note, completed_at: completedAt },
        timestamp: Date.now(),
      });

      // Update local state in memory immediately
      let updatedGoal: Goal | null = null;
      set((state) => {
        const newGoals = state.goals.map((g) => {
          if (g.id === id) {
            const nextCount = g.current_count + 1;
            updatedGoal = {
              ...g,
              current_count: nextCount,
              status: nextCount >= g.target_count ? "completed" : "active",
            };
            return updatedGoal;
          }
          return g;
        });
        return { goals: newGoals };
      });

      // Return simulated response so the dashboard countdown operates
      return {
        success: true,
        message: "Offline progress queued.",
        goal: updatedGoal!,
        log: {
          id: logId,
          goal_id: id,
          user_id: "offline",
          completed_at: completedAt,
          note: note || null,
          created_at: completedAt,
        },
      };
    }

    try {
      const response = await api.post(`/api/goals/${id}/complete`, {
        note,
        completed_at: completedAt,
        log_id: logId,
      });
      const updatedGoal = response.data.goal;

      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedGoal } : g)),
      }));

      // Immediately refresh stats metrics + logs history
      get().fetchStats();
      get().fetchHistory();
      
      // Award XP (AC-1) - Fire and forget
      try {
        const { useXPStore } = await import("./xpStore");
        const { XP_RULES, getStreakMilestoneXP } = await import("../lib/xpSystem");
        const { awardXP } = useXPStore.getState();

        let totalAward = XP_RULES.CHECK_IN;
        const reasons = ["check_in"];

        // +25 XP if fully completed today
        if (updatedGoal.current_count >= updatedGoal.target_count) {
          totalAward += XP_RULES.COMPLETE_DAY;
          reasons.push("complete_day");
        }

        // Streak milestone XP
        const newStreak = updatedGoal.streak?.current_streak ?? 0;
        const milestoneXP = getStreakMilestoneXP(newStreak);
        if (milestoneXP > 0) {
          totalAward += milestoneXP;
          reasons.push(`streak_milestone_${newStreak}`);
        }

        awardXP(totalAward, reasons.join("+")).catch(() => {});
      } catch (xpErr) {
        console.warn("[XP] Award trigger failed:", xpErr);
      }

      // Return log data so caller can use its ID
      return response.data;
    } catch (error: any) {
      const msg = sanitizeApiError(error);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  deleteLogProgress: async (logId, goalId) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      if (goalId) {
        set((state) => {
          const newGoals = state.goals.map((g) => {
            if (g.id === goalId) {
              const nextCount = Math.max(0, g.current_count - 1);
              return {
                ...g,
                current_count: nextCount,
                status: nextCount >= g.target_count ? "completed" : "active",
              };
            }
            return g;
          });
          return { goals: newGoals };
        });

        // Save updated guest goals to IndexedDB
        await setCachedMetadata("guest_goals", get().goals);
        
        // Refresh local stats
        get().fetchStats();
      }
      return;
    }

    const pendingAction = await getSyncAction(logId);
    if (pendingAction) {
      const targetGoalId = goalId || pendingAction.goalId;
      await removeFromSyncQueue(logId);
      set((state) => {
        const newGoals = state.goals.map((g) => {
          if (g.id === targetGoalId) {
            const nextCount = Math.max(0, g.current_count - 1);
            return {
              ...g,
              current_count: nextCount,
              status: nextCount >= g.target_count ? "completed" : "active",
            };
          }
          return g;
        });
        return { goals: newGoals };
      });
      return;
    }

    try {
      const response = await api.delete(`/api/goals/logs/${logId}`);
      const updatedGoal = response.data.goal;

      set((state) => ({
        goals: state.goals.map((g) => (g.id === updatedGoal.id ? { ...g, ...updatedGoal } : g)),
      }));

      // Immediately refresh stats metrics + logs history
      get().fetchStats();
      get().fetchHistory();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to delete progress log.";
      set({ error: msg });
      throw new Error(msg);
    }
  },
}));
