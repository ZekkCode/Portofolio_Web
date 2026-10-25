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
  avatarUrl: "/profile.webp",
  iconUrl: "",
  miniAvatarUrl: "/profile.webp",
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

export const defaultProjects: Project[] = profile.projects.map((project, index) => ({
  id: `seed-${index + 1}`,
  title: project.title,
  desc: project.desc,
  tags: [...project.tags],
  repo: project.repo,
  role: project.role,
  problem: project.problem,
  highlight: project.highlight,
  outcome: project.outcome,
}));

export const defaultCvDocs: CvDocConfig[] = [
  {
    id: "cv-graphic",
    roleKey: "graphic",
    title: "Desainer Grafis",
    subtitle: "Multimedia & Visual Identity",
    color: "#0284c7",
    pdfUrl: "",
    pageCount: 2,
    pages: [],
  },
  {
    id: "cv-uiux",
    roleKey: "uiux",
    title: "UI/UX Designer",
    subtitle: "Product Design & Prototyping",
    color: "#0284c7",
    pdfUrl: "",
    pageCount: 2,
    pages: [],
  },
  {
    id: "cv-frontend",
    roleKey: "frontend",
    title: "Frontend Developer",
    subtitle: "Next.js, React & 3D Interactive",
    color: "#1b45c4",
    pdfUrl: "",
    pageCount: 3,
    pages: [],
  },
  {
    id: "cv-itsupport",
    roleKey: "itsupport",
    title: "IT Support & Systems",
    subtitle: "Troubleshooting & Infrastructure",
    color: "#d97706",
    pdfUrl: "",
    pageCount: 2,
    pages: [],
  },
];

export const defaultSiteConfig: SiteConfig = {
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
  const rawLanyard = raw.lanyard ? { ...raw.lanyard } : undefined;
  if (rawLanyard && (rawLanyard.size === 0.58 || rawLanyard.size === 0.6)) {
    rawLanyard.size = defaultLanyard.size;
  }
  const lanyard = { ...defaultLanyard, ...(rawLanyard ?? {}) } as LanyardConfig;
  const profileCard = { ...defaultProfileCard, ...(raw.profileCard ?? {}) } as ProfileCardConfig;
  if (!profileCard.avatarUrl) {
    profileCard.avatarUrl = defaultProfileCard.avatarUrl;
  }
  if (!profileCard.miniAvatarUrl) {
    profileCard.miniAvatarUrl = defaultProfileCard.miniAvatarUrl;
  }
  const projects = Array.isArray(raw.projects)
    ? raw.projects
        .filter((item) => item && typeof item.title === "string")
        .map((item, index) => {
          const fallback = defaultProjects[index] || defaultProjects[0];
          return {
            id: item.id || `project-${index + 1}`,
            title: item.title,
            desc: item.desc ?? "",
            tags: Array.isArray(item.tags) ? item.tags : [],
            repo: item.repo ?? "",
            role: item.role ?? fallback?.role,
            problem: item.problem ?? fallback?.problem,
            highlight: item.highlight ?? fallback?.highlight,
            outcome: item.outcome ?? fallback?.outcome,
          };
        })
    : defaultProjects;

  const cvDocs = Array.isArray(raw.cvDocs) && raw.cvDocs.length > 0
    ? raw.cvDocs.map((item, index) => {
        const fallback = defaultCvDocs[index] || defaultCvDocs[0];
        return {
          id: item.id || fallback.id,
          roleKey: item.roleKey || fallback.roleKey,
          title: item.title || fallback.title,
          subtitle: item.subtitle || fallback.subtitle,
          color: item.color || fallback.color,
          pdfUrl: item.pdfUrl ?? "",
          pageCount: typeof item.pageCount === "number" ? item.pageCount : fallback.pageCount,
          pages: Array.isArray(item.pages) ? item.pages : [],
        } as CvDocConfig;
      })
    : defaultCvDocs;

  return { lanyard, profileCard, projects: projects.length ? projects : defaultProjects, cvDocs };
};

export const readConfig = (): SiteConfig => {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      snapshot = raw ? normalizeConfig(JSON.parse(raw)) : defaultSiteConfig;
    } catch {
      snapshot = defaultSiteConfig;
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
