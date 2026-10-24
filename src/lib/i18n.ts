"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "@/lib/translations";

const LANG_KEY = "zekk:lang:v1";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      id: { translation: translations.id },
      en: { translation: translations.en },
    },
    lng: "id",
    fallbackLng: "id",
    interpolation: { escapeValue: false },
  });
}

export const setLanguage = (lang: "id" | "en") => {
  void i18n.changeLanguage(lang);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore
    }
  }
};

export const getSavedLanguage = (): "id" | "en" => {
  if (typeof window === "undefined") return "id";
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    return saved === "en" ? "en" : "id";
  } catch {
    return "id";
  }
};

export default i18n;
