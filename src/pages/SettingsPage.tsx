// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import { useTranslation } from "../i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import {
  checkNotificationPermission,
  getActiveSubscription,
  subscribeToPush,
  unsubscribeFromPush
} from "../services/pushNotification";

export function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateProfile, deleteAccount, logout, loading, error, clearError } = useAuthStore();
  const { goals, fetchGoals, isOffline } = useGoalStore();
  const navigate = useNavigate();

  // Local settings states (saved to localStorage for client preferences, or server for profile)
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");

  const [streakNotify, setStreakNotify] = useState(() => {
    return localStorage.getItem("setting_streakNotify") !== "false";
  });
  const [dailyRemind, setDailyRemind] = useState(() => {
    return localStorage.getItem("setting_dailyRemind") !== "false";
  });
  const [goalRemind, setGoalRemind] = useState(() => {
    return localStorage.getItem("setting_goalRemind") !== "false";
  });
  const [motionFx, setMotionFx] = useState(() => {
    return localStorage.getItem("setting_motionFx") !== "false";
  });
  const [glassOpacity, setGlassOpacity] = useState(() => {
    const saved = localStorage.getItem("setting_glassOpacity");
    return saved ? parseFloat(saved) : 0.65;
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("setting_theme") || "light";
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [activeReminders, setActiveReminders] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Check active push subscription on mount
  useEffect(() => {
    async function loadSubscriptionStatus() {
      try {
        const sub = await getActiveSubscription();
        setActiveReminders(!!sub);
      } catch (err) {
        console.error("Failed to load push subscription status:", err);
      }
    }
    loadSubscriptionStatus();
  }, []);

  const handleActiveRemindersChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSubscribing(true);
    setErrorMessage(null);
    try {
      if (checked) {
        const sub = await subscribeToPush();
        setActiveReminders(!!sub);
      } else {
        await unsubscribeFromPush();
        setActiveReminders(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update notification settings. Please check your browser permissions.");
      setActiveReminders(!checked);
    } finally {
      setSubscribing(false);
    }
  };

  // Apply glass opacity slider value in real-time
  useEffect(() => {
    document.documentElement.style.setProperty("--glass-opacity", String(glassOpacity));
    localStorage.setItem("setting_glassOpacity", String(glassOpacity));
  }, [glassOpacity]);

  // Apply theme on load
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("setting_theme", newTheme);
  };

  // Keep other settings updated in localStorage
  useEffect(() => {
    localStorage.setItem("setting_streakNotify", String(streakNotify));
  }, [streakNotify]);

  useEffect(() => {
    localStorage.setItem("setting_dailyRemind", String(dailyRemind));
  }, [dailyRemind]);

  useEffect(() => {
    localStorage.setItem("setting_goalRemind", String(goalRemind));
  }, [goalRemind]);

  useEffect(() => {
    localStorage.setItem("setting_motionFx", String(motionFx));
  }, [motionFx]);

  // Fetch goals if empty so export data has content
  useEffect(() => {
    if (goals.length === 0) {
      fetchGoals();
    }
  }, [goals.length, fetchGoals]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      setErrorMessage("Saving profile requires a network connection. Local preferences (theme, notifications) are saved automatically.");
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    clearError();

    try {
      await updateProfile(name, email, timezone);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setTimezone(user?.timezone || "UTC");
    setStreakNotify(true);
    setDailyRemind(true);
    setGoalRemind(true);
    setMotionFx(true);
    setGlassOpacity(0.65);
    setErrorMessage(null);

    const savedTheme = localStorage.getItem("setting_theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

  const handleDeleteAccount = async () => {
    if (isOffline) {
      setErrorMessage("Deleting account requires a network connection. Please try again when online.");
      setShowDeleteConfirm(false);
      return;
    }
    try {
      await deleteAccount();
      navigate("/login");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete account.");
      setShowDeleteConfirm(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        timezone: user?.timezone,
      },
      goals: goals,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `momentum_goal_tracker_data_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const bestStreak = Math.max(0, ...goals.map((g) => g.streak?.current_streak || 0));

  return (
    <div className="flex-1 min-h-screen p-6 md:p-10 animate-fade-in relative z-10">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
            {t("settings.title")}
          </h2>
          <p className="text-on-surface-variant text-sm md:text-base mt-1">
            {t("settings.profileDesc")}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-3">
            <span className="material-symbols-outlined">warning</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined ms-filled">check_circle</span>
            <span>{t("settings.profileSaved")}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Section (Large Bento) */}
            <section className="md:col-span-2 glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative shrink-0">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-primary shadow-[0_0_30px_rgba(192,193,255,0.2)]"
                      style={{
                        background: "color-mix(in srgb, var(--color-primary) 15%, var(--color-surface-container-high))",
                        border: "2px solid var(--color-primary)",
                      }}
                    >
                      {(user?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">{user?.name || "User"}</h3>
                    <p className="text-sm text-on-surface-variant">{user?.email || "No Email"}</p>
                    <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-secondary/15 text-secondary text-[10px] font-bold rounded-full uppercase tracking-wider">
                      <span className="material-symbols-outlined ms-filled text-[12px]">local_fire_department</span>
                      {t("dashboard.streakBadge")}: {bestStreak} {t("common.days")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block ml-1">
                      {t("settings.name")}
                    </label>
                    <div className="flex items-center bg-surface-container-low/60 border border-white/5 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all">
                      <span className="material-symbols-outlined text-primary mr-3 text-[20px]">person</span>
                      <input
                        className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-on-surface outline-none"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block ml-1">
                      {t("settings.email")}
                    </label>
                    <div className="flex items-center bg-surface-container-low/60 border border-white/5 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all">
                      <span className="material-symbols-outlined text-primary mr-3 text-[20px]">mail</span>
                      <input
                        className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-on-surface outline-none"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block ml-1">
                      {t("settings.timezone")}
                    </label>
                    <div className="flex items-center bg-surface-container-low/60 border border-white/5 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all">
                      <span className="material-symbols-outlined text-primary mr-3 text-[20px]">public</span>
                      <select
                        className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-on-surface outline-none appearance-none cursor-pointer"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        <option value="UTC" className="bg-surface-container-high text-on-surface">UTC (GMT+0)</option>
                        <option value="Asia/Ho_Chi_Minh" className="bg-surface-container-high text-on-surface">Asia/Ho_Chi_Minh (ICT, GMT+7)</option>
                        <option value="America/New_York" className="bg-surface-container-high text-on-surface">America/New_York (EST, GMT-5)</option>
                        <option value="America/Los_Angeles" className="bg-surface-container-high text-on-surface">America/Los_Angeles (PST, GMT-8)</option>
                        <option value="Europe/London" className="bg-surface-container-high text-on-surface">Europe/London (GMT/BST)</option>
                        <option value="Asia/Tokyo" className="bg-surface-container-high text-on-surface">Asia/Tokyo (JST, GMT+9)</option>
                        <option value="Australia/Sydney" className="bg-surface-container-high text-on-surface">Australia/Sydney (AEST, GMT+10)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
            </section>

            {/* Streak Notification Card */}
            <section className="glass-card p-6 flex flex-col justify-center items-center text-center border-t-2 border-t-secondary/30 relative overflow-hidden">
              <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="material-symbols-outlined text-[28px] text-secondary ms-filled">
                  local_fire_department
                </span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-1">{t("settings.streakAlerts")}</h3>
              <p className="text-xs text-on-surface-variant max-w-[200px]">
                {t("settings.notificationsDesc")}
              </p>
              <div className="mt-6">
                <input
                  type="checkbox"
                  id="streak-notify"
                  className="hidden switch-checkbox"
                  checked={streakNotify}
                  onChange={(e) => setStreakNotify(e.target.checked)}
                />
                <label
                  htmlFor="streak-notify"
                  className="switch-label relative inline-block w-12 h-6 bg-white/10 rounded-full cursor-pointer transition-colors duration-300"
                >
                  <span className="switch-dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md"></span>
                </label>
              </div>
            </section>

            {/* Mobile Widget & Shortcut Setup Guide */}
            <section className="glass-card p-6 space-y-6 md:col-span-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                  <span className="material-symbols-outlined text-[22px] ms-filled">bolt</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">{t("settings.pwaTitle")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-on-surface">{t("settings.pwaDesc")}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t("settings.pwaSteps")}
                  </p>
                  <ol className="list-decimal list-inside text-xs text-on-surface-variant space-y-1.5 ml-1">
                    <li>{t("settings.pwaStep1")}</li>
                    <li>{t("settings.pwaStep2")}</li>
                    <li>{t("settings.pwaStep3")}</li>
                    <li>{t("settings.pwaStep4")} <a href="/#/quick-checkin" className="text-primary hover:underline font-semibold">/#/quick-checkin</a></li>
                  </ol>
                </div>
                <div className="flex flex-col justify-center items-center p-4 bg-surface-container-low/40 rounded-xl border border-white/5 text-center">
                  <span className="material-symbols-outlined text-4xl text-primary animate-pulse mb-3">install_mobile</span>
                  <h5 className="font-bold text-sm text-on-surface mb-1">{t("settings.pwaTryTitle")}</h5>
                  <p className="text-xs text-on-surface-variant max-w-[240px] mb-4">
                    {t("settings.pwaTryDesc")}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quick-checkin")}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <span>{t("settings.pwaTryBtn")}</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Notifications & Reminders */}
            <section className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <span className="material-symbols-outlined text-[22px]">notifications</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">{t("settings.notifications")}</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{t("settings.dailyReminder")}</p>
                    <p className="text-[11px] text-on-surface-variant">{t("settings.dailyReminderDesc")}</p>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="daily-remind"
                      className="hidden switch-checkbox"
                      checked={dailyRemind}
                      onChange={(e) => setDailyRemind(e.target.checked)}
                    />
                    <label
                      htmlFor="daily-remind"
                      className="switch-label relative inline-block w-12 h-6 bg-white/10 rounded-full cursor-pointer transition-colors duration-300"
                    >
                      <span className="switch-dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md"></span>
                    </label>
                  </div>
                </div>
                <div className="h-[1px] bg-white/5"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{t("settings.goalReminder")}</p>
                    <p className="text-[11px] text-on-surface-variant">{t("settings.goalReminderDesc")}</p>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="goal-remind"
                      className="hidden switch-checkbox"
                      checked={goalRemind}
                      onChange={(e) => setGoalRemind(e.target.checked)}
                    />
                    <label
                      htmlFor="goal-remind"
                      className="switch-label relative inline-block w-12 h-6 bg-white/10 rounded-full cursor-pointer transition-colors duration-300"
                    >
                      <span className="switch-dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md"></span>
                    </label>
                  </div>
                </div>
                <div className="h-[1px] bg-white/5"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{t("settings.activeReminders")}</p>
                    <p className="text-[11px] text-on-surface-variant">{t("settings.activeRemindersDesc")}</p>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="active-reminders"
                      className="hidden switch-checkbox"
                      checked={activeReminders}
                      disabled={subscribing}
                      onChange={handleActiveRemindersChange}
                    />
                    <label
                      htmlFor="active-reminders"
                      className="switch-label relative inline-block w-12 h-6 bg-white/10 rounded-full cursor-pointer transition-colors duration-300"
                      style={{ opacity: subscribing ? 0.6 : 1 }}
                    >
                      <span className="switch-dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md"></span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                  <span className="text-[22px]">❄</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">Streak Freeze Tokens</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Use tokens to protect your streak when you are busy. Tokens reset to 3 on the first day of each month.
              </p>
              <div className="flex items-center gap-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm transition-all"
                    style={{
                      background: i < 3 ? "rgba(56,189,248,0.15)" : "var(--color-surface-variant)",
                      border: i < 3 ? "1px solid rgba(56,189,248,0.4)" : "1px solid transparent",
                      opacity: i < 3 ? 1 : 0.3,
                    }}
                  >
                    ❄
                  </div>
                ))}
                <span className="text-xs text-on-surface-variant">
                  3/3 tokens left this month
                </span>
              </div>
            </section>

            {/* Appearance Section */}
            <section className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-tertiary/10 rounded-xl text-tertiary">
                  <span className="material-symbols-outlined text-[22px]">palette</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">{t("settings.appearance")}</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{t("settings.theme")}</p>
                    <p className="text-[11px] text-on-surface-variant">{t("settings.themeDesc")}</p>
                  </div>
                  <div>
                    <select
                      className="bg-surface-container-low/60 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-on-surface outline-none cursor-pointer"
                      value={theme}
                      onChange={(e) => handleThemeChange(e.target.value)}
                    >
                      <option value="dark" className="bg-surface-container-high text-on-surface">{t("settings.themeDark")}</option>
                      <option value="light" className="bg-surface-container-high text-on-surface">{t("settings.themeLight")}</option>
                    </select>
                  </div>
                </div>
                <div className="h-[1px] bg-white/5"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{t("settings.motionEffects")}</p>
                    <p className="text-[11px] text-on-surface-variant">{t("settings.motionEffectsDesc")}</p>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="motion-fx"
                      className="hidden switch-checkbox"
                      checked={motionFx}
                      onChange={(e) => setMotionFx(e.target.checked)}
                    />
                    <label
                      htmlFor="motion-fx"
                      className="switch-label relative inline-block w-12 h-6 bg-white/10 rounded-full cursor-pointer transition-colors duration-300"
                    >
                      <span className="switch-dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md"></span>
                    </label>
                  </div>
                </div>
                <div className="h-[1px] bg-white/5"></div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-on-surface">{t("settings.glassOpacity")}</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <input
                      type="range"
                      min="0.2"
                      max="0.95"
                      step="0.05"
                      className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      value={glassOpacity}
                      onChange={(e) => setGlassOpacity(parseFloat(e.target.value))}
                    />
                    <span className="text-[10px] font-mono text-on-surface-variant w-8 text-right">
                      {Math.round(glassOpacity * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Language Section */}
            <section className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <span className="material-symbols-outlined text-[22px]">language</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">{t("settings.language")}</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{t("settings.language")}</p>
                  <p className="text-[11px] text-on-surface-variant">{t("settings.languageDesc")}</p>
                </div>
                <LanguageSwitcher />
              </div>
            </section>

            {/* Account & Data */}
            <section className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-error/10 rounded-xl text-error">
                  <span className="material-symbols-outlined text-[22px]">shield</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">{t("settings.dangerZone")}</h3>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between py-2 text-sm text-on-surface hover:text-primary transition-colors group text-left"
                >
                  <span>{t("settings.exportData")}</span>
                  <span className="material-symbols-outlined text-[18px] opacity-50 group-hover:opacity-100 transition-opacity">
                    download
                  </span>
                </button>
                <div className="h-[1px] bg-white/5"></div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-between py-2 text-sm text-on-surface-variant hover:text-error transition-colors group text-left"
                >
                  <span>{t("settings.deleteAccount")}</span>
                  <span className="material-symbols-outlined text-[18px] opacity-50 group-hover:opacity-100 transition-opacity">
                    delete_forever
                  </span>
                </button>
                <div className="h-[1px] bg-white/5"></div>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="w-full py-2 mt-2 bg-white/5 hover:bg-white/10 text-on-surface rounded-xl text-xs font-semibold text-center transition-colors"
                >
                  {t("auth.logout")}
                </button>
              </div>
            </section>
          </div>

          {/* Bottom Action Footer (Sticky Floating Bar) */}
          <div className="glass-card sticky bottom-[76px] md:bottom-6 z-30 flex justify-end items-center gap-4 p-4 mt-8 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-5 py-2.5 text-sm text-on-surface-variant hover:text-on-surface font-semibold transition-colors cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold shadow-[0_8px_24px_rgba(192,193,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-sm cursor-pointer"
            >
              {saving ? t("common.saving") : t("settings.saveProfile")}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 space-y-6 border border-error/20">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-xl font-bold text-on-surface">{t("settings.deleteAccount")}</h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              {t("settings.deleteAccountDesc")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors text-on-surface"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-error text-on-error hover:bg-error-container rounded-xl text-sm font-bold shadow-[0_8px_24px_rgba(255,180,171,0.2)] transition-all"
              >
                {t("settings.confirmDeleteAccount")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
