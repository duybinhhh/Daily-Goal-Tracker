// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Target, Mail, Lock, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export const LoginPage: React.FC = () => {
  const { login, register, isAuthenticated, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    clearError();
    setFormData({ email: "", password: "", name: "" });
    setFormErrors({});
  }, [isRegister, clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.email) {
      errors.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please input a valid email address.";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (isRegister && !formData.name) {
      errors.name = "Full name is required to register.";
    }

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
      navigate("/");
    } catch (err) {
      console.error("Authentication action failed:", err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl p-8 shadow-xl shadow-black/40">
        
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-950/45 mb-4">
            <Target className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? "Create your Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            {isRegister
              ? "Establish consistent daily goal tracking easily"
              : "Access your daily goals to build long-term positive habits"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-lg text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-[38px] h-4 w-4 text-slate-500" />
              <Input
                id="name"
                label="Full Name"
                placeholder="E.g., Binh Nguyen"
                className="pl-10"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-[38px] h-4 w-4 text-slate-500" />
            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="name@email.com"
              className="pl-10"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              autoComplete="email"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-[38px] h-4 w-4 text-slate-500" />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              className="pl-10"
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
            className="w-full h-[45px] font-semibold text-sm mt-2"
            isLoading={loading}
          >
            {isRegister ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/60 pt-4 text-xs text-slate-400">
          {isRegister ? (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => setIsRegister(false)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline transition-all bg-transparent border-0 cursor-pointer"
              >
                Sign In here
              </button>
            </p>
          ) : (
            <p>
              New to DailyGoal tracker?{" "}
              <button
                onClick={() => setIsRegister(true)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline transition-all bg-transparent border-0 cursor-pointer"
              >
                Create Account here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
