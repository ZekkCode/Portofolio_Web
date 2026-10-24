"use client";

import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { setLanguage } from "@/lib/i18n";
import { useMounted } from "@/lib/use-mounted";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div
        className={`flex size-9 items-center justify-center rounded-full border border-line/70 bg-white/80 dark:border-line/40 dark:bg-slate-900/80 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`group flex size-9 items-center justify-center rounded-full border border-line/70 bg-white/85 text-ink shadow-2xs backdrop-blur-md transition hover:-translate-y-0.5 hover:border-brand/40 dark:border-line/40 dark:bg-slate-900/85 dark:text-slate-200 ${className}`}
      aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode malam"}
      title={isDark ? "Mode Terang (Light)" : "Mode Malam (Dark)"}
    >
      {isDark ? (
        // Sun Icon
        <svg
          className="size-4.5 text-amber-400 transition-transform group-hover:rotate-45"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        // Moon Icon
        <svg
          className="size-4.5 text-slate-700 transition-transform group-hover:-rotate-12 dark:text-slate-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const mounted = useMounted();

  const currentLang = mounted ? (i18n.language?.startsWith("en") ? "en" : "id") : "id";

  const toggle = () => {
    const next = currentLang === "id" ? "en" : "id";
    setLanguage(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex h-9 items-center rounded-full border border-line/70 bg-white/85 px-3 text-xs font-bold text-ink shadow-2xs backdrop-blur-md transition hover:-translate-y-0.5 hover:border-brand/40 dark:border-line/40 dark:bg-slate-900/85 dark:text-slate-200 ${className}`}
      aria-label="Ganti bahasa / Switch language"
      title={currentLang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
    >
      <span className={currentLang === "id" ? "text-brand dark:text-blue-400 font-extrabold" : "text-body/70 dark:text-slate-400"}>
        ID
      </span>
      <span className="mx-1 text-line/80 dark:text-line/40">•</span>
      <span className={currentLang === "en" ? "text-brand dark:text-blue-400 font-extrabold" : "text-body/70 dark:text-slate-400"}>
        EN
      </span>
    </button>
  );
}
