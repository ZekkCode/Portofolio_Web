"use client";

import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "@/lib/translations";

export const LANG_STORAGE_KEY = "zekk:lang:v1";

export function createI18nInstance(initialLocale: "id" | "en" = "id"): I18nInstance {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    resources: {
      id: { translation: translations.id },
      en: { translation: translations.en },
    },
    lng: initialLocale,
    fallbackLng: "id",
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}

const defaultI18n = createI18nInstance("id");

export const persistLanguagePreference = (lang: "id" | "en") => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore storage quota
  }
  try {
    document.cookie = `zekk_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = lang;
  } catch {
    // ignore document cookie failures
  }
};

export const setLanguage = (lang: "id" | "en", activeInstance?: I18nInstance) => {
  const target = activeInstance || defaultI18n;
  void target.changeLanguage(lang);
  if (target !== defaultI18n) {
    void defaultI18n.changeLanguage(lang);
  }
  persistLanguagePreference(lang);
};

export const getSavedLanguage = (): "id" | "en" | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "id") return saved;
    return null;
  } catch {
    return null;
  }
};

export default defaultI18n;
