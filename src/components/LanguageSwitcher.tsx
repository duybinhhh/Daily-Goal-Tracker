import { Language, supportedLanguages, useTranslation } from "../i18n";

interface LanguageOption {
  code: Language;
  labelKey: string;
  shortLabel: string;
}

const languageOptions: LanguageOption[] = [
  { code: "vi", labelKey: "settings.languageVi", shortLabel: "VI" },
  { code: "en", labelKey: "settings.languageEn", shortLabel: "EN" },
];

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-1 ${
        compact ? "gap-1" : "w-full gap-2"
      }`}
      role="group"
      aria-label={t("settings.language")}
    >
      {languageOptions
        .filter((option) => supportedLanguages.includes(option.code))
        .map((option) => {
          const isActive = language === option.code;
          return (
            <button
              key={option.code}
              type="button"
              aria-pressed={isActive}
              onClick={() => setLanguage(option.code)}
              className={`rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                compact ? "px-3 py-2" : "flex-1 px-3 py-2.5"
              } ${
                isActive
                  ? "bg-primary text-on-primary border-primary shadow-[0_4px_12px_rgba(192,193,255,0.15)]"
                  : "bg-transparent text-on-surface-variant border-transparent hover:bg-white/10 hover:text-on-surface"
              }`}
              title={t(option.labelKey)}
            >
              {compact ? option.shortLabel : t(option.labelKey)}
            </button>
          );
        })}
    </div>
  );
}

