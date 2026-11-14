import type {
  SiteConfig,
  Project,
  EducationItem,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
  TechStackItem,
} from "./types";
import { profile } from "@/lib/profile";

export type Locale = "id" | "en";

/**
 * 1. Profil & Identitas Terpublikasi
 */
export function getPublishedProfile(config?: Partial<SiteConfig>, locale: Locale = "id") {
  const gp = config?.generalProfile;
  const isEn = locale === "en";

  return {
    name: gp?.name || profile.name,
    nickname: gp?.nickname || profile.nickname,
    brand: gp?.brand || profile.brand,
    roles: isEn ? gp?.rolesEn || gp?.roles || profile.roles : gp?.roles || profile.roles,
    heroDesc: isEn ? gp?.heroDescEn || gp?.heroDesc || profile.bio[0] : gp?.heroDesc || profile.bio[0],
    bio: isEn ? (gp?.bioEn && gp.bioEn.length > 0 ? gp.bioEn : gp?.bio || profile.bio) : gp?.bio || profile.bio,
    avatarUrl: gp?.avatarUrl || profile.avatar,
    location: isEn ? gp?.locationEn || gp?.location || profile.location : gp?.location || profile.location,
    availability: isEn
      ? gp?.availabilityEn || gp?.availability || "Open for collaboration"
      : gp?.availability || "Terbuka untuk kolaborasi",
    email: gp?.email || profile.contact.email,
    phone: gp?.phone || profile.contact.phone,
    whatsapp: gp?.whatsapp || profile.contact.whatsapp,
    socials: (gp?.socials || []).filter((s) => s.visible !== false),
  };
}

/**
 * 2. Koleksi Proyek Terpublikasi
 */
export function getPublishedProjects(
  config?: Partial<SiteConfig>,
  options?: {
    category?: "all" | "it" | "design";
    featuredOnly?: boolean;
    locale?: Locale;
  }
): Project[] {
  const projects = config?.projects || [];
  const isEn = options?.locale === "en";

  // Hanya ambil proyek yang published !== false
  let list = projects.filter((p) => p.published !== false);

  if (options?.featuredOnly) {
    list = list.filter((p) => p.featured);
  }

  if (options?.category && options.category !== "all") {
    const cat = options.category;
    list = list.filter((p) => p.category === cat || p.category === "both");
  }

  // Fallback teks jika locale = 'en'
  return list.map((p) => ({
    ...p,
    title: isEn && p.titleEn ? p.titleEn : p.title,
    desc: isEn && p.descEn ? p.descEn : p.desc,
    problem: isEn && p.problemEn ? p.problemEn : p.problem,
    approach: isEn && p.approachEn ? p.approachEn : p.approach || p.highlight,
    outcome: isEn && p.outcomeEn ? p.outcomeEn : p.outcome,
  }));
}

/**
 * 3. Riwayat Pendidikan Formal Terpublikasi
 */
export function getPublishedEducation(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): EducationItem[] {
  const isEn = locale === "en";
  const list = config?.education && config.education.length > 0 ? config.education : [];
  
  const published = list.filter((e) => e.published !== false);

  return published
    .sort((a, b) => (a.startYear || 0) - (b.startYear || 0))
    .map((e) => ({
      ...e,
      degree: isEn && e.degreeEn ? e.degreeEn : e.degree,
    }));
}

/**
 * 4. Riwayat Pengalaman & Karir Terpublikasi
 */
export function getPublishedExperience(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): ExperienceItem[] {
  const isEn = locale === "en";
  const list = config?.experience && config.experience.length > 0 ? config.experience : [];

  const published = list.filter((e) => e.published !== false);

  return published.map((e) => ({
    ...e,
    role: isEn && e.roleEn ? e.roleEn : e.role,
    desc: isEn && e.descEn ? e.descEn : e.desc,
  }));
}

/**
 * 5. Prestasi & Penghargaan Terpublikasi
 */
export function getPublishedAchievements(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): AchievementItem[] {
  const isEn = locale === "en";
  const list = config?.achievements && config.achievements.length > 0 ? config.achievements : [];

  const published = list.filter((a) => a.published !== false);

  return published.map((a) => ({
    ...a,
    title: isEn && a.titleEn ? a.titleEn : a.title,
    desc: isEn && a.descEn ? a.descEn : a.desc,
  }));
}

/**
 * 6. Sertifikasi & Kredensial Terpublikasi
 */
export function getPublishedCertificates(
  config?: Partial<SiteConfig>,
  category?: "all" | "design" | "frontend" | "systems"
): CertificateItem[] {
  const list = config?.certificates && config.certificates.length > 0 ? config.certificates : [];

  let published = list.filter((c) => c.published !== false);

  if (category && category !== "all") {
    published = published.filter((c) => c.category === category);
  }

  return published;
}

/**
 * 7. Tech Stack Terpublikasi
 */
export function getPublishedTechStack(
  config?: Partial<SiteConfig>,
  category?: "uiux" | "frontend" | "visual" | "systems" | "all"
): TechStackItem[] {
  const list = config?.techStack && config.techStack.length > 0 ? config.techStack : [];

  let published = list.filter((s) => s.visible !== false);

  if (category && category !== "all") {
    published = published.filter((s) => s.category === category);
  }

  return published;
}

/**
 * 8. Pilar Layanan Terpublikasi
 */
export function getPublishedServices(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): {
  id: string;
  num: string;
  title: string;
  desc: string;
  iconName: string;
  ctaUrl?: string;
}[] {
  const isEn = locale === "en";
  const list = config?.services && config.services.length > 0 ? config.services : [];

  return list
    .filter((s) => s.visible !== false)
    .map((s) => ({
      id: s.id,
      num: s.num,
      title: isEn ? s.titleEn || s.titleId : s.titleId,
      desc: isEn ? s.descEn || s.descId : s.descId,
      iconName: s.iconName,
      ctaUrl: s.ctaUrl,
    }));
}

/**
 * 9. Tanya Jawab (FAQ) Terpublikasi
 */
export function getPublishedFAQ(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): { id: string; question: string; answer: string }[] {
  const isEn = locale === "en";
  const list = config?.faq && config.faq.length > 0 ? config.faq : [];

  return list
    .filter((f) => f.visible !== false)
    .map((f) => ({
      id: f.id,
      question: isEn ? f.questionEn || f.questionId : f.questionId,
      answer: isEn ? f.answerEn || f.answerId : f.answerId,
    }));
}

/**
 * 10. Kontak Terpublikasi
 */
export function getPublishedContact(config?: Partial<SiteConfig>, locale: Locale = "id") {
  const profileData = getPublishedProfile(config, locale);
  return {
    email: profileData.email,
    location: profileData.location,
    availability: profileData.availability,
    socials: profileData.socials,
  };
}

/**
 * 11. Anti-Slop Stats Engine Terpublikasi
 */
export function getPublishedStats(config?: Partial<SiteConfig>): {
  projectsCount: number;
  certificatesCount: number;
  experienceYears: string;
  organizationsCount: number;
  isAuto: boolean;
} {
  const statsConfig = config?.stats;
  const isManual = statsConfig?.mode === "manual";

  if (isManual) {
    return {
      projectsCount: statsConfig.projectsCount || 0,
      certificatesCount: statsConfig.certificatesCount || 0,
      experienceYears: statsConfig.experienceYears || "3+",
      organizationsCount: statsConfig.organizationsCount || 3,
      isAuto: false,
    };
  }

  // Otomatis hitung dari data terpublikasi
  const publishedProjects = (config?.projects || []).filter((p) => p.published !== false);
  const publishedCerts = (config?.certificates || []).filter((c) => c.published !== false);
  const publishedExp = (config?.experience || []).filter((e) => e.published !== false);

  const startYear = 2021;
  const currentYear = new Date().getFullYear();
  const calculatedYears = `${Math.max(1, currentYear - startYear)}+`;

  return {
    projectsCount: publishedProjects.length,
    certificatesCount: publishedCerts.length,
    experienceYears: calculatedYears,
    organizationsCount: Math.max(3, publishedExp.length),
    isAuto: true,
  };
}

/**
 * 12. Visibilitas Seksi Halaman
 */
export function isSectionVisible(
  config?: Partial<SiteConfig>,
  sectionKey?: string
): boolean {
  if (!sectionKey) return true;
  const sections = config?.sections;
  if (!sections) return true;
  return sections[sectionKey]?.visible !== false;
}
