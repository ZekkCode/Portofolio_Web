"use client";

import { useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { createI18nInstance } from "@/lib/i18n";

export function I18nLocaleProvider({
  initialLocale = "id",
  children,
}: {
  initialLocale?: "id" | "en";
  children: ReactNode;
}) {
  const [instance] = useState(() => createI18nInstance(initialLocale));
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
