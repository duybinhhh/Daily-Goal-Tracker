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
  invite_code?: string | null;
  invite_expires_at?: string | null;
  max_members?: number;
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
  removeMember: (groupId: string, userId: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  clearError: () => void;
  createInviteCode: (groupId: string) => Promise<{ inviteCode: string; expiresAt: string }>;
  getGroupByInviteCode: (inviteCode: string) => Promise<{ status: "valid" | "expired" | "full" | "invalid"; group?: any; message?: string }>;
  joinGroupByInviteCode: (inviteCode: string) => Promise<{ success: boolean; groupId: string; alreadyMember?: boolean; message?: string }>;
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

  removeMember: async (groupId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/groups/${groupId}/members/${userId}`);
      set({ loading: false });
      await get().fetchGroupById(groupId);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to remove member.";
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

  createInviteCode: async (groupId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/api/groups/${groupId}/invite`);
      const { inviteCode, expiresAt } = response.data;
      set({ loading: false });
      // Refresh group details to get new invite info
      await get().fetchGroupById(groupId);
      return { inviteCode, expiresAt };
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to generate invite link.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  getGroupByInviteCode: async (inviteCode: string) => {
    try {
      const response = await api.get(`/api/groups/invite/${inviteCode}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || "Link mời không hợp lệ.";
      throw new Error(msg);
    }
  },

  joinGroupByInviteCode: async (inviteCode: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/api/groups/join/${inviteCode}`);
      set({ loading: false });
      
      if (response.data.groupId) {
        await get().fetchGroupById(response.data.groupId);
        await get().fetchGroups();
        
        // Award XP
        try {
          const { useXPStore } = await import("./xpStore");
          const { XP_RULES } = await import("../lib/xpSystem");
          const { awardXP } = useXPStore.getState();
          awardXP(XP_RULES.JOIN_GROUP, "join_group").catch(() => {});
        } catch (xpErr) {
          console.warn("[XP] Award trigger failed:", xpErr);
        }
      }
      
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to join group.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },
}));
