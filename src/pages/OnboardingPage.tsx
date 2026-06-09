import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Confetti } from "../components/Confetti";
import { useTranslation } from "../i18n";

const CATEGORIES = [
  { id: "health", icon: "💪" },
  { id: "learning", icon: "📚" },
  { id: "mindfulness", icon: "🧘" },
  { id: "productivity", icon: "⚡" },
  { id: "social", icon: "🤝" },
  { id: "finance", icon: "💰" }
];

export const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding } = useAuthStore();
  const { createGoal } = useGoalStore();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [goalTitle, setGoalTitle] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trigger completeOnboarding automatically when Step 4 is reached
  useEffect(() => {
    if (step === 4) {
      completeOnboarding();
    }
  }, [step, completeOnboarding]);

  const handleSkip = async () => {
    await completeOnboarding();
    navigate("/");
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!selectedCategory) {
        setErrorMsg(t("onboarding.selectCategoryHint"));
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleSubmitGoal = async () => {
    if (!goalTitle.trim()) {
      setErrorMsg(t("goals.titleRequired"));
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createGoal({
        title: goalTitle.trim(),
        description: "",
        category: selectedCategory,
        frequency: "daily",
        target_count: 1,
      });
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || t("onboarding.createGoalError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onboardingSteps = [
    { step: 1, label: t("onboarding.stepWelcome") },
    { step: 2, label: t("onboarding.stepCategory") },
    { step: 3, label: t("onboarding.stepGoal") },
    { step: 4, label: t("onboarding.stepDone") }
  ];

  const currentCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-background)",
        color: "var(--color-on-background)",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .onboarding-step-container {
          animation: slideInFromRight 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .category-card {
          cursor: pointer;
          border-radius: 0.75rem;
          padding: 16px;
          border: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.02);
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
        }
        .category-card:hover {
          border-color: var(--border-subtle-hover);
          background: var(--bg-hover);
          transform: translateY(-2px);
        }
        .category-card.selected {
          border-color: var(--color-primary);
          background: var(--color-primary-container);
          color: var(--color-on-primary-container);
        }
        html.light .category-card.selected {
          color: var(--color-on-primary-container);
        }
      `}</style>

      {/* Sticky Progress Bar at the top (AC-7) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          padding: "16px 24px",
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "600px",
            margin: "0 auto",
            position: "relative",
          }}
        >
          {onboardingSteps.map((s, idx) => (
            <React.Fragment key={s.step}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    transition: "all 300ms ease",
                    background:
                      s.step === step
                        ? "var(--color-primary)"
                        : s.step < step
                        ? "var(--color-secondary)"
                        : "var(--color-surface-container)",
                    color:
                      s.step === step
                        ? "var(--color-on-primary)"
                        : s.step < step
                        ? "var(--color-on-secondary)"
                        : "var(--color-outline)",
                    border:
                      s.step >= step
                        ? s.step === step
                          ? "none"
                          : "2px solid var(--color-outline-variant)"
                        : "none",
                  }}
                >
                  {s.step < step ? (
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      check
                    </span>
                  ) : (
                    s.step
                  )}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    marginTop: "6px",
                    fontWeight: s.step === step ? 600 : 500,
                    color: s.step === step ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                  }}
                >
                  {s.label}
                </span>
              </div>

              {idx < onboardingSteps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    margin: "0 8px",
                    marginTop: "-16px",
                    background: s.step < step ? "var(--color-secondary)" : "var(--color-outline-variant)",
                    transition: "background 300ms ease",
                    zIndex: 1,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Skip Button (AC-6) */}
      {step < 4 && (
        <button
          onClick={handleSkip}
          style={{
            position: "absolute",
            top: "84px",
            right: "24px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-primary)",
            fontSize: "14px",
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          {t("onboarding.skip")}
        </button>
      )}

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
        }}
      >
        <div
          className="glass-card onboarding-step-container w-full max-w-lg p-6 md:p-8"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            background: "var(--sidebar-bg)",
            border: "1px solid var(--border-subtle)",
          }}
          key={step} // Key triggers keyframe animation on step changes
        >
          {errorMsg && (
            <div
              style={{
                marginBottom: "20px",
                padding: "10px 14px",
                background: "rgba(255,180,171,0.08)",
                border: "1px solid rgba(255,180,171,0.2)",
                borderRadius: "0.75rem",
                color: "var(--color-error)",
                fontSize: "13px",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Welcome (AC-2) */}
          {step === 1 && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "64px",
                  height: "64px",
                  borderRadius: "1.25rem",
                  background: "var(--color-primary)",
                  marginBottom: "24px",
                  boxShadow: "0 8px 32px rgba(192,193,255,0.25)",
                }}
              >
                <span
                  className="material-symbols-outlined ms-filled"
                  style={{ fontSize: "32px", color: "var(--color-on-primary)" }}
                >
                  bolt
                </span>
              </div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "var(--color-on-surface)",
                  marginBottom: "12px",
                  letterSpacing: "-0.02em",
                }}
              >
                {t("onboarding.step1Title", { name: user?.name || (language === "vi" ? "Bạn mới" : "new friend") })}
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-on-surface-variant)",
                  marginBottom: "32px",
                }}
              >
                {t("onboarding.step1Subtitle")}
              </p>

              {/* 3 bullet points */}
              <div
                style={{
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  maxWidth: "400px",
                  margin: "0 auto 32px auto",
                  padding: "20px",
                  borderRadius: "0.75rem",
                  background: "rgba(0, 0, 0, 0.1)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "18px" }}>✅</span>
                  <span style={{ fontSize: "13px", color: "var(--color-on-surface)", fontWeight: 500 }}>
                    {t("onboarding.benefit1")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "18px" }}>📊</span>
                  <span style={{ fontSize: "13px", color: "var(--color-on-surface)", fontWeight: 500 }}>
                    {t("onboarding.benefit2")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "18px" }}>🔔</span>
                  <span style={{ fontSize: "13px", color: "var(--color-on-surface)", fontWeight: 500 }}>
                    {t("onboarding.benefit3")}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleNextStep}
                style={{ width: "100%", padding: "14px" }}
              >
                {t("onboarding.start")}
              </Button>
            </div>
          )}

          {/* STEP 2: Choose Category (AC-3) */}
          {step === 2 && (
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--color-on-surface)",
                  marginBottom: "8px",
                  textAlign: "center",
                }}
              >
                {t("onboarding.step2Title")}
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-on-surface-variant)",
                  marginBottom: "24px",
                  textAlign: "center",
                }}
              >
                {t("onboarding.step2Subtitle")}
              </p>

              {/* Grid categories */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: "12px",
                  marginBottom: "32px",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className={`category-card ${selectedCategory === cat.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setErrorMsg(null);
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{cat.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>{t("category." + cat.id as any)}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  variant="ghost"
                  onClick={handlePrevStep}
                  style={{ flex: 1, padding: "12px" }}
                >
                  {t("common.back")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={!selectedCategory}
                  style={{ flex: 2, padding: "12px" }}
                >
                  {t("common.next")}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Create Goal (AC-4) */}
          {step === 3 && (
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--color-on-surface)",
                  marginBottom: "8px",
                  textAlign: "center",
                }}
              >
                {t("onboarding.step3Title")}
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-on-surface-variant)",
                  marginBottom: "24px",
                  textAlign: "center",
                }}
              >
                {t("onboarding.step3Subtitle")}
              </p>

              {/* Goal form input */}
              <Input
                id="goal-title-input"
                label={t("onboarding.firstGoalLabel")}
                placeholder={t("onboarding.firstGoalPlaceholder")}
                value={goalTitle}
                onChange={(e) => {
                  setGoalTitle(e.target.value);
                  setErrorMsg(null);
                }}
                maxLength={100}
                required
              />

              {/* Display category readonly */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--color-on-surface-variant)",
                    marginBottom: "6px",
                  }}
                >
                  {t("goals.category")}
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "0.75rem",
                    color: "var(--color-on-surface)",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{currentCategoryObj?.icon}</span>
                  <span>{currentCategoryObj ? t("category." + currentCategoryObj.id as any) : ""}</span>
                </div>
              </div>

              {/* Display frequency readonly */}
              <div style={{ marginBottom: "32px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--color-on-surface-variant)",
                    marginBottom: "6px",
                  }}
                >
                  {t("goals.frequency")}
                </label>
                <select
                  disabled
                  value="daily"
                  className="m-input"
                  style={{
                    cursor: "not-allowed",
                    opacity: 0.8,
                    appearance: "none",
                  }}
                >
                  <option value="daily">{t("onboarding.defaultFrequency")} ({t("common.daily")})</option>
                </select>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  variant="ghost"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: "12px" }}
                >
                  {t("common.back")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmitGoal}
                  isLoading={isSubmitting}
                  disabled={!goalTitle.trim()}
                  style={{ flex: 2, padding: "12px" }}
                >
                  {t("onboarding.createAndContinue")}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Completed (AC-5) */}
          {step === 4 && (
            <div style={{ textAlign: "center" }}>
              <Confetti />
              
              {/* Trophy symbol */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "color-mix(in srgb, var(--color-secondary) 15%, transparent)",
                  border: "2px dashed var(--color-secondary)",
                  color: "var(--color-secondary)",
                  marginBottom: "24px",
                  animation: "spin 10s linear infinite",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "36px", animation: "none" }}
                >
                  trophy
                </span>
              </div>

              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--color-on-surface)",
                  marginBottom: "12px",
                  letterSpacing: "-0.02em",
                }}
              >
                {t("onboarding.step4Subtitle")}
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-on-surface-variant)",
                  marginBottom: "32px",
                  lineHeight: "1.6",
                }}
              >
                {t("onboarding.step4Desc")}
              </p>

              <Button
                variant="primary"
                onClick={() => navigate("/")}
                style={{ width: "100%", padding: "14px", fontSize: "14px" }}
              >
                {t("onboarding.goToDashboard")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
