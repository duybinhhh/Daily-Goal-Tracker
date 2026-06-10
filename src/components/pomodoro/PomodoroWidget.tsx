// src/components/pomodoro/PomodoroWidget.tsx
import React, { useState, useEffect } from "react";
import { usePomodoro } from "../../hooks/usePomodoro";
import { usePomodoroStore } from "../../store/pomodoroStore";
import { formatTime } from "../../lib/pomodoro";
import { Play, Pause, Square, ChevronDown, ChevronUp, X, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../../i18n";

export const PomodoroWidget: React.FC = () => {
  const { t } = useTranslation();
  const { activeSession, pausePomodoro, resumePomodoro, stopPomodoro } = usePomodoro();
  const { settings, updateSettings } = usePomodoroStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogPrompt, setShowLogPrompt] = useState(false);

  useEffect(() => {
    const handleFocusComplete = () => {
      setShowLogPrompt(true);
    };

    window.addEventListener("pomodoro-focus-complete", handleFocusComplete);
    return () => window.removeEventListener("pomodoro-focus-complete", handleFocusComplete);
  }, []);

  if (!activeSession) return null;

  const modeColors = {
    focus: "var(--color-error)",
    shortBreak: "var(--color-secondary)",
  };

  const modeLabels = {
    focus: t("pomodoro.focus"),
    shortBreak: t("pomodoro.shortBreak"),
  };

  const handleLogNow = () => {
    setShowLogPrompt(false);
    // Open check-in flow - this might require a custom event or a store call
    window.dispatchEvent(new CustomEvent("open-check-in", { detail: activeSession.goalId }));
  };

  return (
    <>
      <div
        className="pomodoro-widget-container"
        style={{
          position: "fixed",
          right: "16px",
          bottom: "16px",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          alignItems: "flex-end",
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        <AnimatePresence>
          {showLogPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="glass-card"
              style={{
                padding: "16px",
                width: "280px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                border: "1px solid var(--color-primary)",
                background: "var(--color-surface-container-high)",
              }}
            >
              <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", textAlign: "center" }}>
                {t("pomodoro.logPrompt", { title: activeSession.goalTitle })}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, fontSize: "12px", padding: "8px" }}
                  onClick={handleLogNow}
                >
                  {t("pomodoro.logNow")}
                </button>
                <button
                  className="btn-ghost"
                  style={{ flex: 1, fontSize: "12px", padding: "8px", border: "1px solid var(--border-subtle)" }}
                  onClick={() => setShowLogPrompt(false)}
                >
                  {t("pomodoro.skip")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          className="glass-card"
          style={{
            width: isMinimized ? "auto" : "280px",
            padding: isMinimized ? "8px 12px" : "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            border: `1px solid ${modeColors[activeSession.mode]}`,
            background: "var(--color-surface-container-high)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: modeColors[activeSession.mode],
                  flexShrink: 0,
                  animation: activeSession.isRunning ? "pulse 2s infinite" : "none",
                }}
              />
              {!isMinimized && (
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeSession.goalTitle}
                </span>
              )}
              {isMinimized && (
                <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace" }}>
                  {formatTime(activeSession.remainingSeconds)}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button className="btn-ghost" style={{ padding: "4px" }} onClick={() => setShowSettings(!showSettings)}>
                <Settings size={16} />
              </button>
              <button className="btn-ghost" style={{ padding: "4px" }} onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button className="btn-ghost" style={{ padding: "4px" }} onClick={stopPomodoro}>
                <X size={16} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showSettings && !isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>{t("pomodoro.focusDuration")}</span>
                  <input
                    type="number"
                    min="1"
                    className="bg-surface-container-low border border-white/5 rounded-lg px-2 py-1 text-[11px] w-14 outline-none"
                    value={settings.focusDuration}
                    onChange={(e) => updateSettings({ focusDuration: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>{t("pomodoro.shortBreakDuration")}</span>
                  <input
                    type="number"
                    min="1"
                    className="bg-surface-container-low border border-white/5 rounded-lg px-2 py-1 text-[11px] w-14 outline-none"
                    value={settings.shortBreakDuration}
                    onChange={(e) => updateSettings({ shortBreakDuration: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isMinimized && (
            <>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-outline)", marginBottom: "4px" }}>
                  {modeLabels[activeSession.mode]}
                </p>
                <h2 style={{ fontSize: "42px", fontWeight: 800, fontFamily: "monospace", letterSpacing: "-0.05em", margin: 0, lineHeight: 1 }}>
                  {formatTime(activeSession.remainingSeconds)}
                </h2>
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                {activeSession.isRunning ? (
                  <button className="btn-primary" style={{ borderRadius: "12px", width: "48px", height: "48px", padding: 0 }} onClick={pausePomodoro}>
                    <Pause fill="currentColor" size={20} />
                  </button>
                ) : (
                  <button className="btn-primary" style={{ borderRadius: "12px", width: "48px", height: "48px", padding: 0 }} onClick={resumePomodoro}>
                    <Play fill="currentColor" size={20} />
                  </button>
                )}
                <button className="btn-ghost" style={{ borderRadius: "12px", width: "48px", height: "48px", padding: 0, border: "1px solid var(--border-subtle)" }} onClick={stopPomodoro}>
                  <Square fill="currentColor" size={18} />
                </button>
              </div>

              {activeSession.mode === "focus" && (
                <p style={{ fontSize: "10px", textAlign: "center", color: "var(--color-outline)", marginTop: "4px" }}>
                  {t("pomodoro.sessionCount", { count: activeSession.completedFocusSessions + 1 })}
                </p>
              )}
            </>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 768px) {
          .pomodoro-widget-container {
            left: 16px;
            right: 16px;
            bottom: calc(76px + env(safe-area-inset-bottom));
            align-items: stretch !important;
          }
          .pomodoro-widget-container > div {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
};
