import type {
  SiteConfig,
  Project,
  EducationItem,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
  TechStackItem,
} from "./types";
import {
  defaultContactSection,
  defaultCvSettings,
  defaultFooter,
  defaultNavigation,
  defaultProjectCategories,
  defaultSectionOrder,
  defaultSections,
  defaultTechStackCategories,
  slugifyProjectTitle,
  type ContactConfig,
  type CvDocConfig,
  type CvSettingsConfig,
  type FooterConfig,
  type ManualBlogPostConfig,
  type NavMenuItemConfig,
  type ProjectCategoryConfig,
  type SectionConfigItem,
  type SectionKey,
  type SeoConfig,
  type TechStackCategoryConfig,
} from "@/lib/site-config";
import { profile } from "@/lib/profile";

export type Locale = "id" | "en";

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 1, januar: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2,
  mar: 3, maret: 3, march: 3,
  apr: 4, april: 4,
  may: 5, mei: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  aug: 8, agu: 8, agustus: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, okt: 10, oktober: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, des: 12, desember: 12, december: 12,
};

function sortByOrder<T extends { sortOrder?: number }>(items: T[]): T[] {
  return [...items]
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => (a.item.sortOrder ?? a.idx + 1) - (b.item.sortOrder ?? b.idx + 1))
    .map(({ item }) => item);
}

/**
 * 1. Profil & Identitas Terpublikasi
 */
export function getPublishedProfile(config?: Partial<SiteConfig>, locale: Locale = "id") {
  const gp = config?.generalProfile;
  const isEn = locale === "en";

  const visibleSocials = sortByOrder(
    (gp?.socials || []).filter((s) => s && s.visible !== false)
  );

  return {
    name: isEn && gp?.nameEn ? gp.nameEn : gp?.name || profile.name,
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
    availabilityStatus: gp?.availabilityStatus || "available",
    since: gp?.since || profile.since || "2020",
    githubUsername: gp?.githubUsername || "ZekkCode",
    email: gp?.email || profile.contact.email,
    phone: gp?.phone || profile.contact.phone,
    whatsapp: gp?.whatsapp || profile.contact.whatsapp,
    site: gp?.site || profile.site,
    ctaPrimaryLabel: isEn
      ? gp?.ctaPrimaryLabelEn || "Send Email"
      : gp?.ctaPrimaryLabelId || "Kirim Email",
    ctaPrimaryHref: gp?.ctaPrimaryHref || `mailto:${gp?.email || profile.contact.email}`,
    ctaSecondaryLabel: isEn
      ? gp?.ctaSecondaryLabelEn || "Career Files"
      : gp?.ctaSecondaryLabelId || "Folder Berkas Karir",
    ctaSecondaryHref: gp?.ctaSecondaryHref || "#cv",
    aboutPersona: {
      frontImage: gp?.aboutPersona?.frontImage || config?.lanyard?.frontImage || "/card-front-v2.webp",
      backImage: gp?.aboutPersona?.backImage || config?.lanyard?.backImage || "/card-back-v2.webp",
      frontLabel: isEn ? gp?.aboutPersona?.frontLabelEn || "Frontend Dev" : gp?.aboutPersona?.frontLabelId || "Frontend Dev",
      frontCaption: isEn
        ? gp?.aboutPersona?.frontCaptionEn || "Web interfaces & interactive engineering"
        : gp?.aboutPersona?.frontCaptionId || "Antarmuka web & rekayasa interaktif",
      backLabel: isEn ? gp?.aboutPersona?.backLabelEn || "Graphic Designer" : gp?.aboutPersona?.backLabelId || "Graphic Designer",
      backCaption: isEn
        ? gp?.aboutPersona?.backCaptionEn || "Visual identity & multimedia systems"
        : gp?.aboutPersona?.backCaptionId || "Identitas visual & sistem multimedia",
    },
    socials: visibleSocials,
  };
}

/**
 * 2. Kategori & Koleksi Proyek Terpublikasi
 */
export function getPublishedProjectCategories(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): Array<ProjectCategoryConfig & { label: string }> {
  const isEn = locale === "en";
  const list =
    config?.projectCategories && config.projectCategories.length > 0
      ? config.projectCategories
      : defaultProjectCategories;

  return sortByOrder(list)
    .filter((c) => c.visible !== false)
    .map((c) => ({
      ...c,
      label: isEn ? c.labelEn || c.labelId : c.labelId,
    }));
}

export function getPublishedProjects(
  config?: Partial<SiteConfig>,
  options?: {
    category?: string;
    featuredOnly?: boolean;
    locale?: Locale;
  }
): Project[] {
  const projects = config?.projects || [];
  const isEn = options?.locale === "en";

  let list = sortByOrder(projects).filter(
    (p) => p.published !== false && p.visible !== false
  );

  if (options?.featuredOnly) {
    list = list.filter((p) => p.featured);
  }

  if (options?.category && options.category !== "all") {
    const cat = options.category;
    list = list.filter((p) => p.category === cat || p.category === "both");
  }

  return list.map((p, idx) => ({
    ...p,
    slug: p.slug || slugifyProjectTitle(p.title, `project-${idx + 1}`),
    title: isEn && p.titleEn ? p.titleEn : p.title,
    summary: isEn && p.summaryEn ? p.summaryEn : p.summary,
    desc: isEn && p.descEn ? p.descEn : p.desc,
    role: isEn && p.roleEn ? p.roleEn : p.role,
    problem: isEn && p.problemEn ? p.problemEn : p.problem,
    approach: isEn && p.approachEn ? p.approachEn : p.approach || p.highlight,
    outcome: isEn && p.outcomeEn ? p.outcomeEn : p.outcome,
    architecture: isEn && p.architectureEn ? p.architectureEn : p.architecture,
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
  const list = Array.isArray(config?.education) ? config.education : [];

  const published = sortByOrder(list).filter(
    (e) => e.published !== false && e.visible !== false
  );

  return published.map((e) => ({
    ...e,
    program: isEn && e.programEn ? e.programEn : e.program,
    degree: isEn && e.degreeEn ? e.degreeEn : e.degree,
    status: isEn && e.statusEn ? e.statusEn : e.status,
    desc: isEn && e.descEn ? e.descEn : e.desc,
    focus: isEn && e.focusEn && e.focusEn.length > 0 ? e.focusEn : e.focus,
    activities: isEn && e.activitiesEn && e.activitiesEn.length > 0 ? e.activitiesEn : e.activities,
    projects: (e.projects || []).map((proj) => ({
      ...proj,
      desc: isEn && proj.descEn ? proj.descEn : proj.desc,
    })),
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
  const list = Array.isArray(config?.experience) ? config.experience : [];

  const published = sortByOrder(list).filter(
    (e) => e.published !== false && e.visible !== false
  );

  return published.map((e) => ({
    ...e,
    role: isEn && e.roleEn ? e.roleEn : e.role,
    place: isEn && e.placeEn ? e.placeEn : e.place,
    desc: isEn && e.descEn ? e.descEn : e.desc,
    highlights: isEn && e.highlightsEn && e.highlightsEn.length > 0 ? e.highlightsEn : e.highlights,
    responsibilities:
      isEn && e.responsibilitiesEn && e.responsibilitiesEn.length > 0
        ? e.responsibilitiesEn
        : e.responsibilities,
    achievements:
      isEn && e.achievementsEn && e.achievementsEn.length > 0 ? e.achievementsEn : e.achievements,
    media: (e.media || []).map((m) => ({
      ...m,
      caption: isEn && m.captionEn ? m.captionEn : m.caption,
    })),
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
  const list = Array.isArray(config?.achievements) ? config.achievements : [];

  const published = sortByOrder(list).filter(
    (a) => a.published !== false && a.visible !== false
  );

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
  category?: string,
  locale: Locale = "id"
): CertificateItem[] {
  const isEn = locale === "en";
  const list = Array.isArray(config?.certificates) ? config.certificates : [];

  let published = sortByOrder(list).filter(
    (c) => c.published !== false && c.visible !== false
  );

  if (category && category !== "all") {
    published = published.filter((c) => c.category === category);
  }

  return published.map((c) => ({
    ...c,
    title: isEn && c.titleEn ? c.titleEn : c.title,
    desc: isEn && c.descEn ? c.descEn : c.desc,
  }));
}

/**
 * 7. Tech Stack & Kategori Terpublikasi
 */
export function getPublishedTechStackCategories(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): Array<TechStackCategoryConfig & { label: string }> {
  const isEn = locale === "en";
  const list =
    config?.techStackCategories && config.techStackCategories.length > 0
      ? config.techStackCategories
      : defaultTechStackCategories;

  return sortByOrder(list)
    .filter((c) => c.visible !== false)
    .map((c) => ({
      ...c,
      label: isEn ? c.labelEn || c.labelId : c.labelId,
    }));
}

export function getPublishedTechStack(
  config?: Partial<SiteConfig>,
  category?: string,
  options?: { marqueeOnly?: boolean; gridOnly?: boolean; locale?: Locale }
): TechStackItem[] {
  const isEn = options?.locale === "en";
  const list = Array.isArray(config?.techStack) ? config.techStack : [];

  let published = sortByOrder(list).filter(
    (s) => s.published !== false && s.visible !== false
  );

  if (options?.marqueeOnly) {
    published = published.filter((s) => s.showInMarquee !== false);
  }
  if (options?.gridOnly) {
    published = published.filter((s) => s.showInGrid !== false);
  }
  if (category && category !== "all") {
    published = published.filter((s) => s.category === category);
  }

  return published.map((s) => ({
    ...s,
    desc: isEn && s.descEn ? s.descEn : s.desc,
  }));
}

/**
 * 8. Pilar Layanan Terpublikasi
 */
export function getPublishedServices(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): Array<{
  id: string;
  key: string;
  num: string;
  title: string;
  desc: string;
  iconName: string;
  iconUrl?: string;
  deliverables: string[];
  ctaLabel?: string;
  ctaUrl?: string;
}> {
  const isEn = locale === "en";
  const list = Array.isArray(config?.services) ? config.services : [];

  return sortByOrder(list)
    .filter((s) => s.published !== false && s.visible !== false)
    .map((s) => ({
      id: s.id,
      key: s.key,
      num: s.num,
      title: isEn ? s.titleEn || s.titleId : s.titleId,
      desc: isEn ? s.descEn || s.descId : s.descId,
      iconName: s.iconName,
      iconUrl: s.iconUrl,
      deliverables: (isEn ? s.deliverablesEn : s.deliverablesId) || [],
      ctaLabel: isEn ? s.ctaLabelEn || s.ctaLabelId : s.ctaLabelId,
      ctaUrl: s.ctaUrl,
    }));
}

/**
 * 9. Tanya Jawab (FAQ) Terpublikasi
 */
export function getPublishedFAQ(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): Array<{ id: string; question: string; answer: string; category?: string }> {
  const isEn = locale === "en";
  const list = Array.isArray(config?.faq) ? config.faq : [];

  return sortByOrder(list)
    .filter((f) => f.published !== false && f.visible !== false)
    .map((f) => ({
      id: f.id,
      question: isEn ? f.questionEn || f.questionId : f.questionId,
      answer: isEn ? f.answerEn || f.answerId : f.answerId,
      category: f.category,
    }));
}

/**
 * 10. Dokumen & Pengaturan CV Terpublikasi
 */
export function getPublishedCvDocs(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): CvDocConfig[] {
  const isEn = locale === "en";
  const list = Array.isArray(config?.cvDocs) ? config.cvDocs : [];
  const globalAllowDownload = config?.cvSettings?.allowDownload !== false;

  return sortByOrder(list)
    .filter((doc) => doc.published !== false && doc.visible !== false)
    .map((doc) => ({
      ...doc,
      title: isEn && doc.titleEn ? doc.titleEn : doc.title,
      subtitle: isEn && doc.subtitleEn ? doc.subtitleEn : doc.subtitle,
      description: isEn && doc.descriptionEn ? doc.descriptionEn : doc.description,
      summary: isEn && doc.summaryEn ? doc.summaryEn : doc.summary || doc.description,
      responsibilities:
        isEn && doc.responsibilitiesEn && doc.responsibilitiesEn.length > 0
          ? doc.responsibilitiesEn
          : doc.responsibilities,
      allowDownload: globalAllowDownload && doc.allowDownload !== false,
    }));
}

export function getPublishedCvSettings(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): CvSettingsConfig & { folderLabel: string; folderHint: string; previewCta: string; downloadLabel: string } {
  const isEn = locale === "en";
  const merged = { ...defaultCvSettings, ...(config?.cvSettings || {}) };
  return {
    ...merged,
    folderLabel: merged.folderLabel || "CV / Zekk",
    folderHint: isEn
      ? merged.folderHintEn || "Click to open the folder or scroll away to close"
      : merged.folderHintId || "Klik untuk membuka isi map atau gulir untuk menutup",
    previewCta: isEn ? merged.previewCtaEn || "Preview CV" : merged.previewCtaId || "Lihat CV",
    downloadLabel: isEn ? merged.downloadLabelEn || "Open PDF" : merged.downloadLabelId || "Buka PDF",
  };
}

/**
 * 11. Blog & Writing Terpublikasi (Hybrid: Manual + Synced with Overrides)
 */
export interface PublishedBlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  coverAlt?: string;
  url: string;
  category: string;
  date: string;
  readTime?: string;
  featured: boolean;
  pinned: boolean;
  source: "manual" | "sync";
}

const ID_MONTH_MAP: Record<string, string> = {
  januari: "Jan",
  februari: "Feb",
  pebruari: "Feb",
  maret: "Mar",
  april: "Apr",
  mei: "May",
  juni: "Jun",
  juli: "Jul",
  agustus: "Aug",
  agu: "Aug",
  agt: "Aug",
  agst: "Aug",
  september: "Sep",
  oktober: "Oct",
  okt: "Oct",
  november: "Nov",
  nopember: "Nov",
  desember: "Dec",
  des: "Dec",
};

function parseBlogDateMs(raw?: string): number {
  if (!raw) return 0;
  const trimmed = raw.trim();
  const direct = Date.parse(trimmed);
  if (!Number.isNaN(direct)) return direct;
  const normalized = trimmed.replace(/\b([a-zA-Z]+)\b/g, (word) => ID_MONTH_MAP[word.toLowerCase()] || word);
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function mergeBlogPostsWithOverrides(
  config?: Partial<SiteConfig>,
  externalSyncedPosts?: ManualBlogPostConfig[],
  locale: Locale = "id"
): PublishedBlogPostItem[] {
  const isEn = locale === "en";
  const blog = config?.blog;
  if (!blog || blog.visible === false || blog.published === false) {
    return [];
  }

  const mode = blog.sourceMode || "hybrid";
  const overrides = blog.syncedOverrides || {};

  const manual: PublishedBlogPostItem[] =
    mode === "sync"
      ? []
      : sortByOrder(blog.manualPosts || [])
          .filter((p) => p.published !== false && p.visible !== false)
          .map((p, idx) => ({
            id: p.id,
            slug: p.slug || slugifyProjectTitle(p.title, `post-${idx + 1}`),
            title: isEn && p.titleEn ? p.titleEn : p.title,
            excerpt: isEn && p.excerptEn ? p.excerptEn : p.excerpt,
            coverImage: p.coverImage,
            coverAlt: p.coverAlt,
            url: p.url,
            category: p.category || "Article",
            date: p.date,
            readTime: p.readTime,
            featured: Boolean(p.featured),
            pinned: Boolean(p.pinned),
            source: "manual",
          }));

  const rawSynced =
    externalSyncedPosts && externalSyncedPosts.length > 0
      ? externalSyncedPosts
      : blog.syncedPosts || [];

  const synced: PublishedBlogPostItem[] =
    mode === "manual"
      ? []
      : rawSynced
          .filter((p) => {
            if (p.published === false || p.visible === false) return false;
            const ov = overrides[p.id] || overrides[p.url];
            return !ov?.hidden;
          })
          .map((p, idx) => {
            const ov = overrides[p.id] || overrides[p.url] || {};
            return {
              id: p.id,
              slug: p.slug || slugifyProjectTitle(p.title, `sync-post-${idx + 1}`),
              title: isEn ? ov.titleEn || p.titleEn || ov.title || p.title : ov.title || p.title,
              excerpt: isEn
                ? ov.excerptEn || p.excerptEn || ov.excerpt || p.excerpt
                : ov.excerpt || p.excerpt,
              coverImage: ov.coverImage || p.coverImage,
              coverAlt: p.coverAlt,
              url: p.url,
              category: ov.category || p.category || "Blog",
              date: p.date,
              readTime: p.readTime,
              featured: typeof ov.featured === "boolean" ? ov.featured : Boolean(p.featured),
              pinned: Boolean(ov.pinned),
              source: "sync",
            };
          });

  const combined = [...manual, ...synced].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const da = parseBlogDateMs(a.date);
    const db = parseBlogDateMs(b.date);
    return db - da;
  });

  const limit = Math.min(Math.max(blog.displayCount || 4, 1), 12);
  return combined.slice(0, limit);
}

/**
 * 12. Kontak, Navigasi, Footer & SEO Terpublikasi
 */
export function getPublishedContact(config?: Partial<SiteConfig>, locale: Locale = "id") {
  const isEn = locale === "en";
  const profileData = getPublishedProfile(config, locale);
  const cSec: ContactConfig = { ...defaultContactSection, ...(config?.contactSection || {}) };

  return {
    email: profileData.email,
    location: profileData.location,
    availability: profileData.availability,
    socials: profileData.socials.filter((s) => s.showInContact !== false),
    badge: isEn ? cSec.badgeEn || defaultContactSection.badgeEn! : cSec.badgeId || defaultContactSection.badgeId!,
    title: isEn ? cSec.titleEn || defaultContactSection.titleEn! : cSec.titleId || defaultContactSection.titleId!,
    desc: isEn ? cSec.descEn || defaultContactSection.descEn! : cSec.descId || defaultContactSection.descId!,
    emailCta: isEn ? cSec.emailCtaEn || defaultContactSection.emailCtaEn! : cSec.emailCtaId || defaultContactSection.emailCtaId!,
    secondaryCta: isEn ? cSec.secondaryCtaEn || defaultContactSection.secondaryCtaEn! : cSec.secondaryCtaId || defaultContactSection.secondaryCtaId!,
    secondaryHref: cSec.secondaryHref || defaultContactSection.secondaryHref!,
    showProfileCard: cSec.showProfileCard !== false,
  };
}

export function getPublishedNavigation(
  config?: Partial<SiteConfig>,
  locale: Locale = "id"
): Array<NavMenuItemConfig & { label: string }> {
  const isEn = locale === "en";
  const list =
    config?.navigation && config.navigation.length > 0 ? config.navigation : defaultNavigation;

  return sortByOrder(list)
    .filter((item) => {
      if (item.visible === false) return false;
      if (item.sectionKey && !isSectionVisible(config, item.sectionKey)) return false;
      return true;
    })
    .map((item) => ({
      ...item,
      label: isEn ? item.labelEn || item.labelId : item.labelId,
    }));
}

export function getPublishedFooter(config?: Partial<SiteConfig>, locale: Locale = "id") {
  const isEn = locale === "en";
  const profileData = getPublishedProfile(config, locale);
  const f: FooterConfig = { ...defaultFooter, ...(config?.footer || {}) };
  const footerSocials = profileData.socials.filter((s) => s.showInFooter !== false);

  return {
    brandText: f.brandText || profileData.brand,
    emailLabel: isEn ? f.emailLabelEn || f.directEmailLabel || "Email" : f.emailLabelId || f.directEmailLabel || "Email",
    locationText: f.locationText || profileData.location,
    copyrightName: f.copyrightName || profileData.name,
    tagline: isEn ? f.taglineEn || "" : f.taglineId || "",
    watermarkText: f.watermarkText ?? "zakaria mp",
    showWatermark: f.showWatermark !== false,
    showSocials: f.showSocials !== false,
    showEmail: f.showEmail !== false,
    email: profileData.email,
    socials: footerSocials,
  };
}

export function getPublishedSeo(config?: Partial<SiteConfig>, locale: Locale = "id"): SeoConfig {
  const isEn = locale === "en";
  const raw = config?.seo || {};
  const gp = config?.generalProfile;
  const fallbackTitle = `${gp?.name || profile.name} — ${gp?.brand || profile.brand}`;
  const fallbackDesc = isEn
    ? gp?.heroDescEn || gp?.heroDesc || profile.bio[0]
    : gp?.heroDesc || profile.bio[0];

  return {
    metaTitle: (isEn && raw.metaTitleEn ? raw.metaTitleEn : raw.metaTitle) || fallbackTitle,
    metaTitleEn: raw.metaTitleEn,
    metaDesc: (isEn && raw.metaDescEn ? raw.metaDescEn : raw.metaDesc) || fallbackDesc,
    metaDescEn: raw.metaDescEn,
    keywords: raw.keywords && raw.keywords.length > 0 ? raw.keywords : undefined,
    ogImage: raw.ogImage,
    ogImageAlt: raw.ogImageAlt || `${gp?.name || profile.name} Portfolio`,
    canonicalUrl: raw.canonicalUrl || gp?.site || "https://zakariamp.vercel.app",
    robotsIndex: raw.robotsIndex !== false,
    personJobTitle: raw.personJobTitle || gp?.roles || profile.roles,
  };
}

/**
 * 13. Anti-Slop Stats Engine Terpublikasi (Dynamic & Interval-Merged)
 */
function parseDateToMonthIndex(dateStr?: string, fallbackIsEnd = false): number | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const lower = dateStr.trim().toLowerCase();
  if (!lower) return null;

  if (
    lower.includes("sekarang") ||
    lower.includes("present") ||
    lower.includes("current") ||
    lower.includes("aktif")
  ) {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth();
  }

  // ISO YYYY-MM or YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{1,2})/.exec(lower);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Math.min(Math.max(Number(isoMatch[2]), 1), 12);
    return year * 12 + (month - 1);
  }

  // Month Name + Year (e.g. "Januari 2024", "Sept 2025")
  const tokens = lower.split(/[\s,/-]+/).filter(Boolean);
  let foundMonth: number | null = null;
  let foundYear: number | null = null;
  for (const tok of tokens) {
    if (foundMonth === null && MONTH_NAME_MAP[tok]) {
      foundMonth = MONTH_NAME_MAP[tok];
    }
    if (/^\d{4}$/.test(tok)) {
      foundYear = Number(tok);
    }
  }
  if (foundYear !== null) {
    const month = foundMonth ?? (fallbackIsEnd ? 12 : 1);
    return foundYear * 12 + (month - 1);
  }

  return null;
}

function parseExperienceInterval(exp: ExperienceItem): [number, number] | null {
  const nowIdx = new Date().getFullYear() * 12 + new Date().getMonth();
  let start = parseDateToMonthIndex(exp.startDate, false);
  let end = exp.current ? nowIdx : parseDateToMonthIndex(exp.endDate, true);

  if (start === null && exp.period) {
    const parts = exp.period.split(/[\u2013\u2014–—-]+|to|s\.d\.|sd/i).map((p) => p.trim());
    if (parts[0]) start = parseDateToMonthIndex(parts[0], false);
    if (parts[1]) end = parseDateToMonthIndex(parts[1], true);
  }

  if (start === null) return null;
  if (end === null || end < start) end = exp.current ? nowIdx : start;
  return [start, end];
}

export interface AutoStatsBreakdown {
  projectsCount: number;
  certificatesCount: number;
  achievementsCount: number;
  organizationsCount: number;
  uniqueOrganizations: string[];
  experienceMonths: number;
  experienceYears: string;
  overlappingRule: "merge_intervals" | "since_year";
}

export function computeAutoStatsBreakdown(config?: Partial<SiteConfig>): AutoStatsBreakdown {
  const publishedProjects = getPublishedProjects(config);
  const publishedCerts = getPublishedCertificates(config);
  const publishedAchievements = getPublishedAchievements(config);
  const publishedExp = getPublishedExperience(config);

  const uniqueOrgsSet = new Set<string>();
  const intervals: Array<[number, number]> = [];

  for (const exp of publishedExp) {
    const groupKey = (exp.orgGroup || exp.org || "").trim();
    if (groupKey) {
      uniqueOrgsSet.add(groupKey.toLowerCase());
    }
    const interval = parseExperienceInterval(exp);
    if (interval) {
      intervals.push(interval);
    }
  }

  // Merge overlapping month intervals so concurrent roles don't double-count years
  let mergedMonths = 0;
  if (intervals.length > 0) {
    intervals.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const [s, e] = intervals[i];
      const last = merged[merged.length - 1];
      if (s <= last[1] + 1) {
        last[1] = Math.max(last[1], e);
      } else {
        merged.push([s, e]);
      }
    }
    mergedMonths = merged.reduce((sum, [s, e]) => sum + Math.max(1, e - s + 1), 0);
  }

  const rule = config?.stats?.overlappingRule || "merge_intervals";
  const currentYear = new Date().getFullYear();
  const baseSinceYear = config?.stats?.sinceYear || Number(config?.generalProfile?.since) || 2020;

  let experienceYears = "0";
  if (rule === "since_year") {
    const diff = Math.max(1, currentYear - baseSinceYear);
    experienceYears = `${diff}+`;
  } else if (mergedMonths > 0) {
    const yearsFloor = Math.max(1, Math.floor(mergedMonths / 12));
    experienceYears = `${yearsFloor}+`;
  } else if (publishedExp.length > 0) {
    experienceYears = "1+";
  }

  const includeAch = Boolean(config?.stats?.includeAchievementsInCerts);
  const certsCount = includeAch
    ? publishedCerts.length + publishedAchievements.length
    : publishedCerts.length;

  return {
    projectsCount: publishedProjects.length,
    certificatesCount: certsCount,
    achievementsCount: publishedAchievements.length,
    organizationsCount: uniqueOrgsSet.size,
    uniqueOrganizations: Array.from(uniqueOrgsSet),
    experienceMonths: mergedMonths,
    experienceYears,
    overlappingRule: rule,
  };
}

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
      projectsCount: statsConfig.projectsCount ?? 0,
      certificatesCount: statsConfig.certificatesCount ?? 0,
      experienceYears: statsConfig.experienceYears || "1+",
      organizationsCount: statsConfig.organizationsCount ?? 0,
      isAuto: false,
    };
  }

  const auto = computeAutoStatsBreakdown(config);
  return {
    projectsCount: auto.projectsCount,
    certificatesCount: auto.certificatesCount,
    experienceYears: auto.experienceYears,
    organizationsCount: auto.organizationsCount,
    isAuto: true,
  };
}

/**
 * 14. Visibilitas, Urutan & Metadata Seksi Halaman
 */
export function isSectionVisible(
  config?: Partial<SiteConfig>,
  sectionKey?: string
): boolean {
  if (!sectionKey) return true;
  if (sectionKey === "blog" && config?.blog?.visible === false) return false;
  const sections = config?.sections;
  if (!sections) return true;
  return sections[sectionKey]?.visible !== false;
}

export function getPublishedSectionMeta(
  config: Partial<SiteConfig> | undefined,
  sectionKey: SectionKey,
  locale: Locale = "id"
): SectionConfigItem & {
  eyebrow: string;
  title: string;
  desc: string;
  ctaLabel: string;
} {
  const isEn = locale === "en";
  const def = defaultSections[sectionKey] || { visible: true };
  const raw = config?.sections?.[sectionKey];
  const merged: SectionConfigItem = { ...def, ...(raw || {}) };

  const customFallbackTitle = merged.customTitle;

  return {
    ...merged,
    eyebrow: (isEn ? merged.eyebrowEn : merged.eyebrowId) || "",
    title:
      (isEn ? merged.titleEn || merged.titleId : merged.titleId || customFallbackTitle) || "",
    desc: (isEn ? merged.descEn || merged.descId : merged.descId) || "",
    ctaLabel: (isEn ? merged.ctaLabelEn || merged.ctaLabelId : merged.ctaLabelId) || "",
  };
}

export function getOrderedSectionKeys(config?: Partial<SiteConfig>): SectionKey[] {
  const rawOrder = Array.isArray(config?.sectionOrder) ? config.sectionOrder : [];
  const valid: SectionKey[] = [];
  for (const k of rawOrder) {
    if (defaultSectionOrder.includes(k) && !valid.includes(k)) {
      valid.push(k);
    }
  }
  const missing = defaultSectionOrder.filter((k) => !valid.includes(k));
  const headHero: SectionKey[] = missing.includes("hero") ? ["hero"] : [];
  const tailMissing = missing.filter((k) => k !== "hero");
  return [...headHero, ...valid, ...tailMissing];
}
