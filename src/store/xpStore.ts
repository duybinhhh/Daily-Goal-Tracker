import { create } from 'zustand';
import api from '../services/api';

interface XPState {
  pendingLevelUp: { fromLevel: number; toLevel: number } | null;
  isAwardingXP: boolean;
  awardXP: (amount: number, reason: string) => Promise<void>;
  clearLevelUp: () => void;
}

export const useXPStore = create<XPState>((set, get) => ({
  pendingLevelUp: null,
  isAwardingXP: false,

  awardXP: async (amount: number, reason: string) => {
    if (amount <= 0) return;
    if (get().isAwardingXP) return; // Prevent concurrent calls

    set({ isAwardingXP: true });

    try {
      const response = await api.post('/api/xp/award', { amount, reason });
      const { total_xp: newTotalXP, level: newLevel, previous_level } = response.data;

      // Cập nhật user trong localStorage để Sidebar re-render
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, total_xp: newTotalXP, level: newLevel };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Trigger authStore user update — import inline để tránh circular dependency
      const { useAuthStore } = await import('./authStore');
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, total_xp: newTotalXP, level: newLevel } : null,
      }));

      // AC-4: Kiểm tra level up
      if (previous_level && newLevel > previous_level) {
        set({
          pendingLevelUp: { fromLevel: previous_level, toLevel: newLevel },
        });
      }
    } catch (err) {
      // Silent fail — XP là gamification, không block user flow
      console.warn('[XP] Award XP failed silently:', err);
    } finally {
      set({ isAwardingXP: false });
    }
  },

  clearLevelUp: () => set({ pendingLevelUp: null }),
}));
