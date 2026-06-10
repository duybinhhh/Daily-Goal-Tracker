// src/hooks/usePomodoro.ts
import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "../i18n";
import { usePomodoroStore } from "../store/pomodoroStore";
import { playDingSound, showPomodoroNotification } from "../lib/pomodoro";

export function usePomodoro() {
  const { t } = useTranslation();
  const {
    activeSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    updateRemainingSeconds,
    completePhase,
  } = usePomodoroStore();

  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (activeSession?.isRunning) {
      // Calculate endTime based on remaining seconds
      endTimeRef.current = Date.now() + activeSession.remainingSeconds * 1000;

      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;

        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

        if (remaining <= 0) {
          cleanup();
          
          // Play sound
          playDingSound();

          // Show Notification
          const isFocus = activeSession.mode === "focus";
          const title = isFocus ? t("pomodoro.focusComplete") : t("pomodoro.breakComplete");
          const body = isFocus 
            ? t("pomodoro.focusCompleteMsg", { title: activeSession.goalTitle }) 
            : t("pomodoro.breakCompleteMsg");
          
          showPomodoroNotification(title, body);
          
          // If it was focus mode, notify that it finished for the prompt
          if (isFocus) {
            window.dispatchEvent(new CustomEvent("pomodoro-focus-complete", { 
              detail: { goalId: activeSession.goalId, goalTitle: activeSession.goalTitle } 
            }));
          }
          
          completePhase();
        } else {
          updateRemainingSeconds(remaining);
        }
      }, 1000);
    } else {
      cleanup();
      endTimeRef.current = null;
    }

    return cleanup;
  }, [activeSession?.isRunning, activeSession?.mode, activeSession?.goalId, activeSession?.goalTitle, cleanup, completePhase, updateRemainingSeconds, t]);

  const handleStart = useCallback((goalId: string, goalTitle: string) => {
    startSession(goalId, goalTitle);
  }, [startSession]);

  const handlePause = useCallback(() => {
    pauseSession();
  }, [pauseSession]);

  const handleResume = useCallback(() => {
    if (activeSession) {
      resumeSession(activeSession.remainingSeconds);
    }
  }, [activeSession, resumeSession]);

  const handleStop = useCallback(() => {
    stopSession();
  }, [stopSession]);

  return {
    activeSession,
    startPomodoro: handleStart,
    pausePomodoro: handlePause,
    resumePomodoro: handleResume,
    stopPomodoro: handleStop,
  };
}
