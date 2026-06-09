import { create } from "zustand";

interface AICoachStore {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useAICoachStore = create<AICoachStore>((set) => ({
  isOpen: false,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
}));

