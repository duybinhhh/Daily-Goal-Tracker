// src/store/pomodoroStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PomodoroMode = "focus" | "shortBreak" | "longBreak";

export interface PomodoroSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
}

export interface PomodoroSession {
  goalId: string;
  goalTitle: string;
  mode: PomodoroMode;
  remainingSeconds: number;
  isRunning: boolean;
  completedFocusSessions: number;
}

interface PomodoroStats {
  [date: string]: {
    completedSessions: number;
  };
}

interface PomodoroState {
  activeSession: PomodoroSession | null;
  settings: PomodoroSettings;
  stats: PomodoroStats;
  startSession: (goalId: string, goalTitle: string) => void;
  pauseSession: () => void;
  resumeSession: (remainingSeconds: number) => void;
  stopSession: () => void;
  updateRemainingSeconds: (seconds: number) => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  completePhase: () => void;
  getTodayCompletedSessions: () => number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
};

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      settings: DEFAULT_SETTINGS,
      stats: {},

      startSession: (goalId, goalTitle) => {
        const { settings } = get();
        set({
          activeSession: {
            goalId,
            goalTitle,
            mode: "focus",
            remainingSeconds: settings.focusDuration * 60,
            isRunning: true,
            completedFocusSessions: 0,
          },
        });
      },

      pauseSession: () => {
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, isRunning: false }
            : null,
        }));
      },

      resumeSession: (remainingSeconds) => {
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, isRunning: true, remainingSeconds }
            : null,
        }));
      },

      stopSession: () => {
        set({ activeSession: null });
      },

      updateRemainingSeconds: (seconds) => {
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, remainingSeconds: seconds }
            : null,
        }));
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      completePhase: () => {
        const { activeSession, stats, settings } = get();
        if (!activeSession) return;

        const today = new Date().toISOString().split("T")[0];
        let nextMode: PomodoroMode = "focus";
        let nextRemaining = settings.focusDuration * 60;
        let nextCompletedInCycle = activeSession.completedFocusSessions;
        let nextStats = { ...stats };

        if (activeSession.mode === "focus") {
          // Increment stats
          const todayStats = nextStats[today] || { completedSessions: 0 };
          nextStats[today] = {
            completedSessions: todayStats.completedSessions + 1,
          };

          nextCompletedInCycle += 1;
          nextMode = "shortBreak";
          nextRemaining = settings.shortBreakDuration * 60;
        } else {
          // Finished break
          nextMode = "focus";
          nextRemaining = settings.focusDuration * 60;
        }

        set({
          stats: nextStats,
          activeSession: {
            ...activeSession,
            mode: nextMode,
            remainingSeconds: nextRemaining,
            isRunning: false, // Wait for user to start next phase
            completedFocusSessions: nextCompletedInCycle,
          },
        });
      },

      getTodayCompletedSessions: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().stats[today]?.completedSessions || 0;
      },
    }),
    {
      name: "pomodoro-storage",
    }
  )
);
