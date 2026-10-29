"use client";

import { useSyncExternalStore } from "react";
import {
  defaultSiteConfig,
  defaultLanyard,
  defaultProfileCard,
  defaultProjects,
  defaultCvDocs,
  normalizeConfig,
  type LanyardConfig,
  type ProfileCardConfig,
  type Project,
  type CvDocConfig,
  type SiteConfig,
} from "@/lib/site-config";

export {
  defaultSiteConfig,
  defaultLanyard,
  defaultProfileCard,
  defaultProjects,
  defaultCvDocs,
  normalizeConfig,
};
export type { LanyardConfig, ProfileCardConfig, Project, CvDocConfig, SiteConfig };

const STORAGE_KEY = "zekk:site:v1";

let snapshot: SiteConfig = defaultSiteConfig;
let hydrated = false;
let cloudSynced = false;
const listeners = new Set<() => void>();

export const syncCloudConfig = async () => {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.configured && data.config) {
      snapshot = normalizeConfig(data.config);
      hydrated = true;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // ignore
      }
      emit();
    }
  } catch {
    // network offline, use local cache
  }
};

export const saveCloudConfig = async (
  next: SiteConfig
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const data = await res.json();
    return { success: Boolean(data.success), message: data.message || data.error };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal terhubung ke API cloud",
    };
  }
};

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
      void syncCloudConfig();
    }
  }
  return snapshot;
};

const emit = () => listeners.forEach((listener) => listener());

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
