// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useTranslation } from "../i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, register, isAuthenticated, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    clearError();
    setFormData({ email: "", password: "", name: "" });
    setFormErrors({});
  }, [isRegister, clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      navigate(redirect || "/");
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.email) errors.email = t("auth.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = t("auth.emailInvalid");
    if (!formData.password) errors.password = t("auth.passwordRequired");
    else if (formData.password.length < 6)
      errors.password = t("auth.passwordTooShort");
    if (isRegister && !formData.name) errors.name = t("auth.nameRequired");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isRegister) {
        await register(formData.email, formData.password, formData.name);
      } else {
        await login(formData.email, formData.password);
      }
      
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      navigate(redirect || "/");
    } catch (err) {
      console.error("Auth failed:", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background)",
        padding: "32px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,193,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(78,222,163,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6"
      >
        <LanguageSwitcher compact />
      </div>

      <div
        className="glass-card animate-fade-in w-full max-w-[420px] p-6 sm:p-9 relative"
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              borderRadius: "1rem",
              background: "var(--color-primary)",
              marginBottom: "16px",
              boxShadow: "0 8px 24px rgba(192,193,255,0.25)",
            }}
          >
            <span
              className="material-symbols-outlined ms-filled"
              style={{ fontSize: "28px", color: "var(--color-on-primary)" }}
            >
              bolt
            </span>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--color-on-surface)",
              marginBottom: "6px",
            }}
          >
            {isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-on-surface-variant)" }}>
            {isRegister ? t("auth.registerDesc") : t("auth.loginDesc")}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px 14px",
              background: "rgba(255,180,171,0.08)",
              border: "1px solid rgba(255,180,171,0.2)",
              borderRadius: "0.75rem",
              color: "var(--color-error)",
              fontSize: "12px",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {isRegister && (
            <div style={{ position: "relative" }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "34px",
                  fontSize: "18px",
                  color: "var(--color-outline)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                person
              </span>
              <Input
                id="name"
                label={t("auth.nameLabel")}
                placeholder={t("auth.namePlaceholderInput")}
                className="pl-10"
                style={{ paddingLeft: "40px" }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div style={{ position: "relative" }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: "12px",
                top: "34px",
                fontSize: "18px",
                color: "var(--color-outline)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              mail
            </span>
            <Input
              id="email"
              label={t("auth.emailLabel")}
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              style={{ paddingLeft: "40px" }}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              autoComplete="email"
              required
            />
          </div>

          <div style={{ position: "relative" }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: "12px",
                top: "34px",
                fontSize: "18px",
                color: "var(--color-outline)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              lock
            </span>
            <Input
              id="password"
              label={t("auth.passwordLabel")}
              type="password"
              placeholder="••••••••"
              style={{ paddingLeft: "40px" }}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              autoComplete="current-password"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            style={{ width: "100%", padding: "12px 20px", marginTop: "8px", fontSize: "14px" }}
          >
            {isRegister ? t("auth.register") : t("auth.login")}
          </Button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            textAlign: "center",
            fontSize: "12px",
            color: "var(--color-on-surface-variant)",
          }}
        >
          {isRegister ? (
            <p>
              {t("auth.haveAccount")}{" "}
              <button
                onClick={() => setIsRegister(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  textDecoration: "underline",
                  fontSize: "12px",
                }}
              >
                {t("auth.login")}
              </button>
            </p>
          ) : (
            <p>
              {t("auth.noAccount")}{" "}
              <button
                onClick={() => setIsRegister(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  textDecoration: "underline",
                  fontSize: "12px",
                }}
              >
                {t("auth.register")}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
