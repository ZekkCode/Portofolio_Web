"use client";

import { useSyncExternalStore } from "react";
import {
  defaultSiteConfig,
  defaultLanyard,
  defaultProfileCard,
  defaultGeneralProfile,
  defaultStats,
  defaultProjects,
  defaultCvDocs,
  defaultEducation,
  defaultExperience,
  defaultAchievements,
  defaultCertificates,
  defaultTechStack,
  defaultServices,
  defaultFaq,
  defaultBlogConfig,
  normalizeConfig,
  type LanyardConfig,
  type ProfileCardConfig,
  type GeneralProfileConfig,
  type StatsConfig,
  type SocialLinkItem,
  type Project,
  type CvDocConfig,
  type EducationItem,
  type AcademicProject,
  type ExperienceItem,
  type AchievementItem,
  type CertificateItem,
  type TechStackItem,
  type ServiceItemConfig,
  type FaqItemConfig,
  type BlogConfig,
  type SiteConfig,
} from "@/lib/site-config";

export {
  defaultSiteConfig,
  defaultLanyard,
  defaultProfileCard,
  defaultGeneralProfile,
  defaultStats,
  defaultProjects,
  defaultCvDocs,
  defaultEducation,
  defaultExperience,
  defaultAchievements,
  defaultCertificates,
  defaultTechStack,
  defaultServices,
  defaultFaq,
  defaultBlogConfig,
  normalizeConfig,
};
export type {
  LanyardConfig,
  ProfileCardConfig,
  GeneralProfileConfig,
  StatsConfig,
  SocialLinkItem,
  Project,
  CvDocConfig,
  EducationItem,
  AcademicProject,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
  TechStackItem,
  ServiceItemConfig,
  FaqItemConfig,
  BlogConfig,
  SiteConfig,
};

const STORAGE_KEY = "zekk:site:v1";
const STORAGE_TIMESTAMP_KEY = "zekk:site:v1:timestamp";
const STORAGE_DRAFT_KEY = "zekk:site:v1:draft";

let snapshot: SiteConfig = defaultSiteConfig;
let hydrated = false;
let cloudSynced = false;
let lastSyncCheck = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

/**
 * Sinkronisasi konfigurasi terpublikasi dari Supabase Cloud.
 * Jika cloud memiliki pembaruan lebih baru dari cache lokal, cloud data langsung menang.
 */
export const syncCloudConfig = async (force = false) => {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (!force && now - lastSyncCheck < 5000) return; // Debounce 5s
  lastSyncCheck = now;

  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.configured && data.config) {
      const normalized = normalizeConfig(data.config);
      const sanitizedProjects = normalized.projects.filter(
        (project) => !project.id.startsWith("seed-") && !project.id.startsWith("profile-")
      );
      const cleanConfig = { ...normalized, projects: sanitizedProjects };

      const localTimestamp = window.localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      const isCloudNewer = !localTimestamp || (data.updatedAt && new Date(data.updatedAt) > new Date(localTimestamp));

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
    // network offline, gunakan local cache
  }
};

/**
 * Simpan draf ke server tanpa mempublikasikannya ke publik.
 */
export const saveCloudDraft = async (
  draft: SiteConfig
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch("/api/config?action=draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // ignore
      }
    }
    return { success: Boolean(data.success), message: data.message || data.error };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal terhubung ke API cloud",
    };
  }
};

/**
 * Publikasikan konfigurasi ke Supabase Cloud (menjadi published version).
 */
export const publishCloudConfig = async (
  next: SiteConfig
): Promise<{ success: boolean; version?: number; message?: string; details?: string[] }> => {
  try {
    const res = await fetch("/api/config?action=publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const data = await res.json();
    if (data.success) {
      snapshot = next;
      hydrated = true;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          if (data.updatedAt) {
            window.localStorage.setItem(STORAGE_TIMESTAMP_KEY, data.updatedAt);
          }
          window.localStorage.removeItem(STORAGE_DRAFT_KEY);
        } catch {
          // ignore
        }
      }
      emit();
    }
    return {
      success: Boolean(data.success),
      version: data.version,
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

/**
 * Kompatibilitas mundur untuk fungsi saveCloudConfig lama (otomatis mempublikasikan).
 */
export const saveCloudConfig = publishCloudConfig;

/**
 * Membaca konfigurasi aktif untuk komponen React.
 */
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

      // Listener otomatis saat tab kembali aktif (visibility change & window focus)
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            void syncCloudConfig();
          }
        });
        window.addEventListener("focus", () => {
          void syncCloudConfig();
        });
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
    // kuota penuh
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

export const useSiteConfig = () => useSyncExternalStore(subscribe, readConfig, () => defaultSiteConfig);
