import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { vi } from "./vi";
import { en } from "./en";

export type Language = "vi" | "en";
export type TranslationKeys = typeof vi;
export const supportedLanguages: Language[] = ["vi", "en"];

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const translations: Record<Language, TranslationKeys> = { vi, en };
const LANGUAGE_STORAGE_KEY = "setting_language";
const DEFAULT_LANGUAGE: Language = "vi";

function isLanguage(value: string | null): value is Language {
  return supportedLanguages.includes(value as Language);
}

function getStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
}

function resolveTranslation(language: Language, key: string): string {
  const keys = key.split(".");
  let result: any = translations[language];
  for (const k of keys) {
    result = result?.[k];
  }

  if (typeof result === "string") return result;

  let fallback: any = translations[DEFAULT_LANGUAGE];
  for (const k of keys) {
    fallback = fallback?.[k];
  }

  return typeof fallback === "string" ? fallback : key;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    if (!supportedLanguages.includes(lang)) return;
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY && isLanguage(event.newValue)) {
        setLanguageState(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    let text = resolveTranslation(language, key);
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used inside LanguageProvider");
  return ctx;
}
