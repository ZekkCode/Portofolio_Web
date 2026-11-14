"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import {
  defaultSiteConfig,
  defaultLanyard,
  defaultProfileCard,
  defaultGeneralProfile,
  defaultStats,
  defaultProjectCategories,
  defaultTechStackCategories,
  defaultProjects,
  defaultCvDocs,
  defaultCvSettings,
  defaultEducation,
  defaultExperience,
  defaultAchievements,
  defaultCertificates,
  defaultTechStack,
  defaultServices,
  defaultFaq,
  defaultBlogConfig,
  defaultNavigation,
  defaultFooter,
  defaultContactSection,
  defaultSections,
  defaultSectionOrder,
  normalizeConfig,
  type LanyardConfig,
  type ProfileCardConfig,
  type GeneralProfileConfig,
  type AboutPersonaConfig,
  type StatsConfig,
  type SocialLinkItem,
  type ProjectCategoryConfig,
  type TechStackCategoryConfig,
  type Project,
  type CvDocConfig,
  type CvSettingsConfig,
  type EducationItem,
  type AcademicProject,
  type ExperienceItem,
  type AchievementItem,
  type CertificateItem,
  type TechStackItem,
  type ServiceItemConfig,
  type FaqItemConfig,
  type ManualBlogPostConfig,
  type SyncedBlogPostOverride,
  type BlogConfig,
  type SectionKey,
  type SectionConfigItem,
  type NavMenuItemConfig,
  type FooterConfig,
  type ContactConfig,
  type SeoConfig,
  type SiteConfig,
} from "@/lib/site-config";

export {
  defaultSiteConfig,
  defaultLanyard,
  defaultProfileCard,
  defaultGeneralProfile,
  defaultStats,
  defaultProjectCategories,
  defaultTechStackCategories,
  defaultProjects,
  defaultCvDocs,
  defaultCvSettings,
  defaultEducation,
  defaultExperience,
  defaultAchievements,
  defaultCertificates,
  defaultTechStack,
  defaultServices,
  defaultFaq,
  defaultBlogConfig,
  defaultNavigation,
  defaultFooter,
  defaultContactSection,
  defaultSections,
  defaultSectionOrder,
  normalizeConfig,
};
export type {
  LanyardConfig,
  ProfileCardConfig,
  GeneralProfileConfig,
  AboutPersonaConfig,
  StatsConfig,
  SocialLinkItem,
  ProjectCategoryConfig,
  TechStackCategoryConfig,
  Project,
  CvDocConfig,
  CvSettingsConfig,
  EducationItem,
  AcademicProject,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
  TechStackItem,
  ServiceItemConfig,
  FaqItemConfig,
  ManualBlogPostConfig,
  SyncedBlogPostOverride,
  BlogConfig,
  SectionKey,
  SectionConfigItem,
  NavMenuItemConfig,
  FooterConfig,
  ContactConfig,
  SeoConfig,
  SiteConfig,
};

const STORAGE_KEY = "zekk:site:v1";
const STORAGE_TIMESTAMP_KEY = "zekk:site:v1:timestamp";
const STORAGE_DRAFT_KEY = "zekk:site:v1:draft";
const BROADCAST_CHANNEL_NAME = "zekk:site:sync";

let snapshot: SiteConfig = defaultSiteConfig;
let hydrated = false;
let cloudSynced = false;
let lastSyncCheck = 0;
let lastServerUpdatedAt: string | undefined;
const listeners = new Set<() => void>();

const SiteConfigOverrideContext = createContext<SiteConfig | null>(null);

export function SiteConfigOverrideProvider({
  value,
  children,
}: {
  value: SiteConfig;
  children: React.ReactNode;
}) {
  return React.createElement(SiteConfigOverrideContext.Provider, { value }, children);
}

const emit = () => listeners.forEach((listener) => listener());

function notifyCrossTabSync(updatedAt?: string) {
  if (typeof window === "undefined") return;
  try {
    if ("BroadcastChannel" in window) {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      ch.postMessage({ type: "published", updatedAt });
      ch.close();
    }
  } catch {
    // ignore BroadcastChannel failures
  }
}

export const getServerUpdatedAt = (): string | undefined => {
  if (lastServerUpdatedAt) return lastServerUpdatedAt;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(STORAGE_TIMESTAMP_KEY) || undefined;
  }
  return undefined;
};

/**
 * Sinkronisasi konfigurasi terpublikasi dari cloud/server store.
 */
export const syncCloudConfig = async (force = false) => {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (!force && now - lastSyncCheck < 4000) return;
  lastSyncCheck = now;

  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.updatedAt) {
      lastServerUpdatedAt = data.updatedAt;
    }
    if (data.configured && data.config) {
      const normalized = normalizeConfig(data.config);
      const sanitizedProjects = normalized.projects.filter(
        (project) => !project.id.startsWith("seed-") && !project.id.startsWith("profile-")
      );
      const cleanConfig = { ...normalized, projects: sanitizedProjects };

      const localTimestamp = window.localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      const isCloudNewer =
        !localTimestamp ||
        (data.updatedAt && new Date(data.updatedAt) > new Date(localTimestamp));

      if (force || isCloudNewer || !hydrated) {
        snapshot = cleanConfig;
        hydrated = true;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanConfig));
          if (data.updatedAt) {
            window.localStorage.setItem(STORAGE_TIMESTAMP_KEY, data.updatedAt);
          }
        } catch {
          // ignore localStorage quota
        }
        emit();
      }
    }
  } catch {
    // offline fallback
  }
};

/**
 * Simpan draf ke server tanpa mempublikasikannya ke publik.
 */
export const saveCloudDraft = async (
  draft: SiteConfig,
  options?: { expectedUpdatedAt?: string; forceOverwrite?: boolean }
): Promise<{
  success: boolean;
  provider?: string;
  updatedAt?: string;
  conflict?: boolean;
  serverUpdatedAt?: string;
  serverConfig?: SiteConfig;
  message?: string;
}> => {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options?.expectedUpdatedAt) {
      headers["x-expected-updated-at"] = options.expectedUpdatedAt;
    }
    if (options?.forceOverwrite) {
      headers["x-force-overwrite"] = "1";
    }

    const res = await fetch("/api/config?action=draft", {
      method: "POST",
      headers,
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (data.success && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // ignore
      }
    }
    return {
      success: Boolean(data.success),
      provider: data.provider,
      updatedAt: data.updatedAt,
      conflict: Boolean(data.conflict),
      serverUpdatedAt: data.serverUpdatedAt,
      serverConfig: data.serverConfig,
      message: data.message || data.error,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal terhubung ke API cloud",
    };
  }
};

/**
 * Publikasikan konfigurasi ke server / cloud (menjadi published version).
 */
export const publishCloudConfig = async (
  next: SiteConfig,
  options?: { expectedUpdatedAt?: string; forceOverwrite?: boolean }
): Promise<{
  success: boolean;
  provider?: string;
  version?: number;
  updatedAt?: string;
  conflict?: boolean;
  serverUpdatedAt?: string;
  serverConfig?: SiteConfig;
  message?: string;
  details?: string[];
}> => {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options?.expectedUpdatedAt) {
      headers["x-expected-updated-at"] = options.expectedUpdatedAt;
    }
    if (options?.forceOverwrite) {
      headers["x-force-overwrite"] = "1";
    }

    const res = await fetch("/api/config?action=publish", {
      method: "POST",
      headers,
      body: JSON.stringify(next),
    });
    const data = await res.json();
    if (data.success) {
      const normalized = normalizeConfig({ ...next, updatedAt: data.updatedAt || next.updatedAt });
      snapshot = normalized;
      hydrated = true;
      if (data.updatedAt) {
        lastServerUpdatedAt = data.updatedAt;
      }
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          if (data.updatedAt) {
            window.localStorage.setItem(STORAGE_TIMESTAMP_KEY, data.updatedAt);
          }
          window.localStorage.removeItem(STORAGE_DRAFT_KEY);
        } catch {
          // ignore
        }
        notifyCrossTabSync(data.updatedAt);
      }
      emit();
    }
    return {
      success: Boolean(data.success),
      provider: data.provider,
      version: data.version,
      updatedAt: data.updatedAt,
      conflict: Boolean(data.conflict),
      serverUpdatedAt: data.serverUpdatedAt,
      serverConfig: data.serverConfig,
      message: data.message || data.error,
      details: data.details,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal terhubung ke API cloud",
    };
  }
};

export const saveCloudConfig = publishCloudConfig;

export const readConfig = (): SiteConfig => {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const normalized = normalizeConfig(parsed);
        const sanitizedProjects = normalized.projects.filter(
          (project) => !project.id.startsWith("seed-") && !project.id.startsWith("profile-")
        );
        snapshot = { ...normalized, projects: sanitizedProjects };
      } else {
        snapshot = defaultSiteConfig;
      }
    } catch {
      snapshot = defaultSiteConfig;
    }

    if (!cloudSynced) {
      cloudSynced = true;
      void syncCloudConfig(true);

      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            void syncCloudConfig();
          }
        });
        window.addEventListener("focus", () => {
          void syncCloudConfig();
        });
        window.addEventListener("storage", (e) => {
          if (e.key === STORAGE_KEY && e.newValue) {
            try {
              snapshot = normalizeConfig(JSON.parse(e.newValue));
              emit();
            } catch {
              // ignore
            }
          }
        });
        if ("BroadcastChannel" in window) {
          try {
            const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
            ch.onmessage = (evt) => {
              if (evt.data?.type === "published") {
                void syncCloudConfig(true);
              }
            };
          } catch {
            // ignore
          }
        }
      }
    }
  }
  return snapshot;
};

export const writeConfig = (next: SiteConfig) => {
  snapshot = next;
  hydrated = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota error
  }
  emit();
};

export const resetConfig = () => {
  snapshot = defaultSiteConfig;
  hydrated = true;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    window.localStorage.removeItem(STORAGE_DRAFT_KEY);
  } catch {
    // ignore
  }
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useSiteConfig = () => {
  const override = useContext(SiteConfigOverrideContext);
  const storeValue = useSyncExternalStore(subscribe, readConfig, () => defaultSiteConfig);
  return override ?? storeValue;
};
