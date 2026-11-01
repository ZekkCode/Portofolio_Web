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

export type AcademicProject = {
  title: string;
  desc?: string;
  repo?: string;
  url?: string;
};

export type EducationItem = {
  id: string;
  institution: string;
  location: string;
  program: string;
  degree: string;
  period: string;
  startYear: number;
  endYear?: number | null;
  status: string;
  statusEn?: string;
  current: boolean;
  focus?: string[];
  focusEn?: string[];
  projects?: AcademicProject[];
  desc?: string;
  logo?: string;
  website?: string;
};

export type ExperienceItem = {
  id: string;
  role: string;
  org: string;
  place: string;
  period: string;
  desc: string;
};

export type CertificateItem = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialUrl?: string;
  category: "design" | "frontend" | "systems" | "all";
};

export type SiteConfig = {
  headerLogoUrl: string;
  lanyard: LanyardConfig;
  profileCard: ProfileCardConfig;
  projects: Project[];
  cvDocs: CvDocConfig[];
  education: EducationItem[];
  experience: ExperienceItem[];
  certificates: CertificateItem[];
};

export const defaultLanyard: LanyardConfig = {
  frontImage: "/card-front.webp",
  backImage: "",
  strapImage: "",
  imageFit: "cover",
  cardColor: "#0b2a8a",
  orientation: "portrait",
  finish: "glossy",
  cornerRadius: 0.3,
  size: 0.36,
  anchor: "center",
  strapLength: 0.32,
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
    subtitle: "Next.js & TypeScript Systems",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
  },
  {
    id: "cv-itsupport",
    roleKey: "itsupport",
    title: "IT Support Specialist",
    subtitle: "Hardware, Network & Linux Systems",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
  },
];

export const defaultEducation: EducationItem[] = [
  {
    id: "utm",
    institution: "Universitas Trunojoyo Madura",
    location: "Bangkalan, Jawa Timur",
    program: "S1 Teknik Informatika",
    degree: "Sarjana Komputer (S.Kom)",
    period: "2024 – Sekarang",
    startYear: 2024,
    endYear: null,
    status: "Mahasiswa Aktif",
    statusEn: "Active Student",
    current: true,
    desc: "Menempuh pendidikan sarjana Teknik Informatika dengan fokus utama rekayasa antarmuka web, arsitektur sistem, dan eksplorasi interaksi 3D fisik.",
    focus: [
      "Algoritma & Pemrograman",
      "Dasar Pemrograman Web",
      "Sistem Basis Data",
      "Jaringan Komputer",
    ],
    focusEn: [
      "Algorithms & Programming",
      "Web Development Fundamentals",
      "Database Systems",
      "Computer Networks",
    ],
    projects: [
      {
        title: "TOEL — Simulator Ujian TOEFL",
        desc: "Aplikasi web latihan simulasi TOEFL dengan batasan waktu terisolasi, pemutar audio terproteksi, dan kalkulasi skor otomatis.",
        repo: "https://github.com/ZekkCode/OnlineTest-TOEFL_DPW",
      },
    ],
    website: "https://www.trunojoyo.ac.id",
  },
  {
    id: "smkn1jetis",
    institution: "SMK Negeri 1 Jetis",
    location: "Mojokerto, Jawa Timur",
    program: "Kejurusan Multimedia",
    degree: "Pendidikan Menengah Kejuruan",
    period: "2021 – 2024",
    startYear: 2021,
    endYear: 2024,
    status: "Lulus",
    statusEn: "Graduated",
    current: false,
    desc: "Mempelajari dasar multimedia, desain grafis komputer, tipografi, fotografi, pemodelan 2D/3D interaktif, serta produksi dan pengeditan audio-visual.",
    focus: [
      "Desain Grafis (Photoshop & CorelDRAW)",
      "Produksi & Editing Video (Premiere Pro & Filmora)",
      "Desain Antarmuka UI/UX Dasar",
    ],
    focusEn: [
      "Graphic Design (Photoshop & CorelDRAW)",
      "Video Production & Editing (Premiere Pro & Filmora)",
      "Fundamental UI/UX Design",
    ],
    projects: [
      {
        title: "Prototipe UI/UX Game Edukasi 'Tebak ASEAN'",
        desc: "Perancangan user flow dan prototipe interaktif high-fidelity dari awal hingga akhir menggunakan Figma.",
      },
    ],
    website: "https://smkn1jetis.sch.id",
  },
];

export const defaultExperience: ExperienceItem[] = profile.experience.map((e, idx) => ({
  id: `exp-${idx + 1}`,
  role: e.role,
  org: e.org,
  place: e.place,
  period: e.period,
  desc: e.desc,
}));

export const defaultCertificates: CertificateItem[] = (profile.certificates || []).map((c, idx) => ({
  id: `cert-${idx + 1}`,
  title: c.title,
  issuer: c.issuer,
  date: c.date,
  credentialUrl: c.credentialUrl || "",
  category: (c.category || "design") as "design" | "frontend" | "systems" | "all",
}));

export const defaultSiteConfig: SiteConfig = {
  headerLogoUrl: "",
  lanyard: defaultLanyard,
  profileCard: defaultProfileCard,
  projects: defaultProjects,
  cvDocs: defaultCvDocs,
  education: defaultEducation,
  experience: defaultExperience,
  certificates: defaultCertificates,
};

export const normalizeConfig = (input: unknown): SiteConfig => {
  const raw = (input ?? {}) as Partial<SiteConfig>;
  const headerLogoUrl = typeof raw.headerLogoUrl === "string" ? raw.headerLogoUrl : "";
  const rawLanyard = raw.lanyard ? { ...raw.lanyard } : undefined;
  if (rawLanyard && (rawLanyard.size === 0.58 || rawLanyard.size === 0.6)) {
    rawLanyard.size = defaultLanyard.size;
  }
  if (rawLanyard && (rawLanyard.strapLength === 0.85 || !rawLanyard.strapLength)) {
    rawLanyard.strapLength = defaultLanyard.strapLength;
  }

  const normalizedLanyard: LanyardConfig = {
    ...defaultLanyard,
    ...rawLanyard,
  };

  const normalizedProfileCard: ProfileCardConfig = {
    ...defaultProfileCard,
    ...(raw.profileCard ? { ...raw.profileCard } : undefined),
    statusColor: "#22c55e",
  };

  const rawProjects = Array.isArray(raw.projects) ? raw.projects : defaultProjects;
  const normalizedProjects = rawProjects
    .filter((p): p is Project => Boolean(p && typeof p === "object" && typeof p.id === "string"))
    .map((p) => ({
      id: p.id,
      title: typeof p.title === "string" ? p.title : "Proyek",
      desc: typeof p.desc === "string" ? p.desc : "",
      tags: Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === "string") : [],
      repo: typeof p.repo === "string" ? p.repo : "",
      role: typeof p.role === "string" ? p.role : undefined,
      problem: typeof p.problem === "string" ? p.problem : undefined,
      highlight: typeof p.highlight === "string" ? p.highlight : undefined,
      outcome: typeof p.outcome === "string" ? p.outcome : undefined,
      image: typeof p.image === "string" ? p.image : undefined,
      previewUrl: typeof p.previewUrl === "string" ? p.previewUrl : undefined,
    }));

  const rawCvDocs = Array.isArray(raw.cvDocs) ? raw.cvDocs : defaultCvDocs;
  const normalizedCvDocs = defaultCvDocs.map((defaultDoc) => {
    const override = rawCvDocs.find((d) => d && d.roleKey === defaultDoc.roleKey);
    if (!override) return defaultDoc;
    return {
      ...defaultDoc,
      ...override,
      pdfUrl: typeof override.pdfUrl === "string" && override.pdfUrl ? override.pdfUrl : defaultDoc.pdfUrl,
      pages: Array.isArray(override.pages) && override.pages.length ? override.pages : defaultDoc.pages,
    };
  });

  const rawEducation = Array.isArray(raw.education) ? raw.education : defaultEducation;
  const normalizedEducation: EducationItem[] = rawEducation
    .filter((e): e is EducationItem => Boolean(e && typeof e === "object" && typeof e.id === "string"))
    .map((e) => ({
      id: e.id,
      institution: typeof e.institution === "string" ? e.institution : "Institusi Pendidikan",
      location: typeof e.location === "string" ? e.location : "",
      program: typeof e.program === "string" ? e.program : "",
      degree: typeof e.degree === "string" ? e.degree : "",
      period: typeof e.period === "string" ? e.period : "",
      startYear: typeof e.startYear === "number" ? e.startYear : 2024,
      endYear: typeof e.endYear === "number" ? e.endYear : (e.endYear === null ? null : undefined),
      status: typeof e.status === "string" ? e.status : "Mahasiswa Aktif",
      statusEn: typeof e.statusEn === "string" ? e.statusEn : undefined,
      current: Boolean(e.current),
      focus: Array.isArray(e.focus) ? e.focus.filter((f) => typeof f === "string") : [],
      focusEn: Array.isArray(e.focusEn) ? e.focusEn.filter((f) => typeof f === "string") : undefined,
      projects: Array.isArray(e.projects)
        ? e.projects.filter((p) => p && typeof p === "object" && typeof p.title === "string")
        : [],
      desc: typeof e.desc === "string" ? e.desc : "",
      logo: typeof e.logo === "string" ? e.logo : undefined,
      website: typeof e.website === "string" ? e.website : undefined,
    }));

  const rawExperience = Array.isArray(raw.experience) ? raw.experience : defaultExperience;
  const normalizedExperience: ExperienceItem[] = rawExperience
    .filter((e): e is ExperienceItem => Boolean(e && typeof e === "object" && typeof e.id === "string"))
    .map((e) => ({
      id: e.id,
      role: typeof e.role === "string" ? e.role : "Peran",
      org: typeof e.org === "string" ? e.org : "Organisasi",
      place: typeof e.place === "string" ? e.place : "Lokasi",
      period: typeof e.period === "string" ? e.period : "",
      desc: typeof e.desc === "string" ? e.desc : "",
    }));

  const rawCertificates = Array.isArray(raw.certificates) ? raw.certificates : defaultCertificates;
  const normalizedCertificates: CertificateItem[] = rawCertificates
    .filter((c): c is CertificateItem => Boolean(c && typeof c === "object" && typeof c.id === "string"))
    .map((c) => ({
      id: c.id,
      title: typeof c.title === "string" ? c.title : "Sertifikat",
      issuer: typeof c.issuer === "string" ? c.issuer : "",
      date: typeof c.date === "string" ? c.date : "",
      credentialUrl: typeof c.credentialUrl === "string" ? c.credentialUrl : "",
      category: (["design", "frontend", "systems", "all"].includes(c.category)
        ? c.category
        : "design") as "design" | "frontend" | "systems" | "all",
    }));

  return {
    headerLogoUrl,
    lanyard: normalizedLanyard,
    profileCard: normalizedProfileCard,
    projects: normalizedProjects,
    cvDocs: normalizedCvDocs,
    education: normalizedEducation,
    experience: normalizedExperience,
    certificates: normalizedCertificates,
  };
};
