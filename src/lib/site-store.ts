"use client";

import { useSyncExternalStore } from "react";
import { profile } from "@/lib/profile";

export type LanyardConfig = {
  frontImage: string;
  backImage: string;
  strapImage: string;
  imageFit: "cover" | "contain";
  cardColor: string;
  orientation: "portrait" | "landscape";
  finish: "glossy" | "matte" | "holographic" | "metallic";
  cornerRadius: number;
  size: number;
  anchor: "left" | "center" | "right";
  strapLength: number;
  strapColor: string;
  strapWidth: number;
  metal: "graphite" | "silver" | "gold";
  gravity: number;
  damping: number;
  elasticity: number;
  breeze: number;
  interactive: boolean;
  intro: boolean;
};

export type ProfileCardConfig = {
  avatarUrl: string;
  iconUrl: string;
  miniAvatarUrl: string;
  imageFit?: "cover" | "contain";
  name: string;
  title: string;
  handle: string;
  status: string;
  statusColor: string;
  contactText: string;
  showUserInfo: boolean;
  theme: "dark" | "light";
  backdropColor: string;
  radius: number;
  holo: number;
  glare: number;
  enableTilt: boolean;
  tiltStrength: number;
  parallax: number;
  enableMobileTilt: boolean;
  mobileTiltSensitivity: number;
  intro: boolean;
};

export type Project = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  repo: string;
  role?: string;
  problem?: string;
  highlight?: string;
  outcome?: string;
  image?: string;
  previewUrl?: string;
};

export type CvDocConfig = {
  id: string;
  roleKey: "graphic" | "uiux" | "frontend" | "itsupport";
  title: string;
  subtitle: string;
  color: string;
  pdfUrl?: string;
  pageCount?: number;
  pages?: string[];
};

export type SiteConfig = {
  headerLogoUrl: string;
  lanyard: LanyardConfig;
  profileCard: ProfileCardConfig;
  projects: Project[];
  cvDocs: CvDocConfig[];
};

export const defaultLanyard: LanyardConfig = {
  frontImage: "/card-front.svg",
  backImage: "",
  strapImage: "",
  imageFit: "cover",
  cardColor: "#0b2a8a",
  orientation: "portrait",
  finish: "glossy",
  cornerRadius: 0.3,
  size: 0.36,
  anchor: "center",
  strapLength: 0.85,
  strapColor: "#123a9e",
  strapWidth: 0.65,
  metal: "silver",
  gravity: 1,
  damping: 0.5,
  elasticity: 0.5,
  breeze: 0.18,
  interactive: true,
  intro: true,
};

export const defaultProfileCard: ProfileCardConfig = {
  avatarUrl: "",
  iconUrl: "",
  miniAvatarUrl: "",
  imageFit: "contain",
  name: profile.name,
  title: profile.roles,
  handle: "zekksparow",
  status: "Online",
  statusColor: "#22c55e",
  contactText: "Contact",
  showUserInfo: true,
  theme: "dark",
  backdropColor: "",
  radius: 16,
  holo: 0.8,
  glare: 0.5,
  enableTilt: true,
  tiltStrength: 12,
  parallax: 8,
  enableMobileTilt: false,
  mobileTiltSensitivity: 5,
  intro: true,
};

export const defaultProjects: Project[] = [];

export const defaultCvDocs: CvDocConfig[] = [
  {
    id: "cv-graphic",
    roleKey: "graphic",
    title: "Desainer Grafis",
    subtitle: "Multimedia & Visual Identity",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
  },
  {
    id: "cv-uiux",
    roleKey: "uiux",
    title: "UI/UX Designer",
    subtitle: "Product Design & Prototyping",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
  },
  {
    id: "cv-frontend",
    roleKey: "frontend",
    title: "Frontend Developer",
    subtitle: "Next.js, React & 3D Interactive",
    color: "#1b45c4",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
  },
  {
    id: "cv-itsupport",
    roleKey: "itsupport",
    title: "IT Support & Systems",
    subtitle: "Troubleshooting & Infrastructure",
    color: "#d97706",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
  },
];

export const defaultSiteConfig: SiteConfig = {
  headerLogoUrl: "",
  lanyard: defaultLanyard,
  profileCard: defaultProfileCard,
  projects: defaultProjects,
  cvDocs: defaultCvDocs,
};

const STORAGE_KEY = "zekk:site:v1";

let snapshot: SiteConfig = defaultSiteConfig;
let hydrated = false;
const listeners = new Set<() => void>();

export const normalizeConfig = (input: unknown): SiteConfig => {
  const raw = (input ?? {}) as Partial<SiteConfig>;
  const headerLogoUrl = typeof raw.headerLogoUrl === "string" ? raw.headerLogoUrl : "";
  const rawLanyard = raw.lanyard ? { ...raw.lanyard } : undefined;
  if (rawLanyard && (rawLanyard.size === 0.58 || rawLanyard.size === 0.6)) {
    rawLanyard.size = defaultLanyard.size;
  }
  const lanyard = { ...defaultLanyard, ...(rawLanyard ?? {}) } as LanyardConfig;
  const rawProfileCard = (raw.profileCard ?? {}) as Partial<ProfileCardConfig>;
  const profileCard = {
    ...defaultProfileCard,
    ...rawProfileCard,
    avatarUrl: typeof rawProfileCard.avatarUrl === "string" ? rawProfileCard.avatarUrl : "",
    miniAvatarUrl: typeof rawProfileCard.miniAvatarUrl === "string" ? rawProfileCard.miniAvatarUrl : "",
    imageFit: rawProfileCard.imageFit === "cover" ? "cover" : "contain",
  } as ProfileCardConfig;

  const projects: Project[] = Array.isArray(raw.projects)
    ? raw.projects
        .filter((item) => item && typeof item.title === "string")
        .map((item, index) => ({
          id: item.id || `project-${index + 1}`,
          title: item.title,
          desc: item.desc ?? "",
          tags: Array.isArray(item.tags) ? item.tags : [],
          repo: item.repo ?? "",
          role: item.role,
          problem: item.problem,
          highlight: item.highlight,
          outcome: item.outcome,
          image: typeof item.image === "string" ? item.image : undefined,
          previewUrl: typeof item.previewUrl === "string" ? item.previewUrl : undefined,
        }))
    : [];

  const cvDocs = Array.isArray(raw.cvDocs) && raw.cvDocs.length > 0
    ? raw.cvDocs.map((item, index) => {
        const fallback = defaultCvDocs[index] || defaultCvDocs[0];
        return {
          id: item.id || fallback.id,
          roleKey: item.roleKey || fallback.roleKey,
          title: item.title || fallback.title,
          subtitle: item.subtitle || fallback.subtitle,
          color: item.color || fallback.color,
          pdfUrl: (item.pdfUrl && item.pdfUrl.trim().length > 0) ? item.pdfUrl.trim() : fallback.pdfUrl,
          pageCount: typeof item.pageCount === "number" && item.pageCount > 0 ? item.pageCount : fallback.pageCount,
          pages: Array.isArray(item.pages) && item.pages.length > 0 ? item.pages : fallback.pages,
        } as CvDocConfig;
      })
    : defaultCvDocs;

  return { headerLogoUrl, lanyard, profileCard, projects, cvDocs };
};

let cloudSynced = false;

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
    // kuota penuh (gambar terlalu besar); draft tetap jalan di memori
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
