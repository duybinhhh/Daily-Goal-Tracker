// src/store/groupStore.ts
import { create } from "zustand";
import api from "../services/api";

export interface GroupMemberProgress {
  user_id: string;
  name: string;
  email: string;
  current_count: number;
  target_count: number;
  streak: {
    current_streak: number;
    longest_streak: number;
  };
  status: string;
}

export interface HabitGroup {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  goal_title: string;
  goal_category: string;
  goal_target_count: number;
  goal_frequency: string;
  created_at: string;
  memberCount: number;
  isJoined: boolean;
}

export interface HabitGroupDetail {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  creator_name: string;
  goal_title: string;
  goal_category: string;
  goal_target_count: number;
  goal_frequency: string;
  created_at: string;
  isJoined: boolean;
  members: GroupMemberProgress[];
}

interface GroupState {
  groups: HabitGroup[];
  activeGroup: HabitGroupDetail | null;
  loading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  fetchGroupById: (id: string) => Promise<void>;
  createGroup: (groupData: {
    name: string;
    description: string;
    goal_title: string;
    goal_category: string;
    goal_target_count: number;
    goal_frequency: string;
  }) => Promise<void>;
  joinGroup: (id: string) => Promise<void>;
  leaveGroup: (id: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroup: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchGroups: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/api/groups");
      set({ groups: response.data.groups, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to load habit groups.",
        loading: false,
      });
    }
  },

  fetchGroupById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/api/groups/${id}`);
      set({ activeGroup: response.data.group, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to load group details.",
        loading: false,
      });
    }
  },

  createGroup: async (groupData) => {
    set({ loading: true, error: null });
    try {
      await api.post("/api/groups", groupData);
      set({ loading: false });
      await get().fetchGroups();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create habit group.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  joinGroup: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/api/groups/${id}/join`);
      set({ loading: false });
      await get().fetchGroupById(id);
      await get().fetchGroups();

      // Award XP (AC-1) - Fire and forget
      try {
        const { useXPStore } = await import("./xpStore");
        const { XP_RULES } = await import("../lib/xpSystem");
        const { awardXP } = useXPStore.getState();
        awardXP(XP_RULES.JOIN_GROUP, "join_group").catch(() => {});
      } catch (xpErr) {
        console.warn("[XP] Award trigger failed:", xpErr);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to join habit group.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  leaveGroup: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/api/groups/${id}/leave`);
      set({ activeGroup: null, loading: false });
      await get().fetchGroups();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to leave habit group.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  deleteGroup: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/groups/${id}`);
      set({ activeGroup: null, loading: false });
      await get().fetchGroups();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to delete habit group.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },
}));
