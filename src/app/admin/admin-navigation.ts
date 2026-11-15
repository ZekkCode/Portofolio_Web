import type { ContentHealthIssue, ContentReadinessSummary } from "@/lib/content/types";

export type AdminTabKey =
  | "overview"
  | "general"
  | "journey"
  | "works"
  | "expertise"
  | "credentials"
  | "content"
  | "media"
  | "appearance"
  | "maintenance";

export interface AdminNavigationTarget {
  nonce: number;
  tab: AdminTabKey;
  subTab?: string;
  itemId?: string;
  field?: string;
  fieldKey?: string;
}

/**
 * Memetakan temuan pemeriksaan konten / validator skema ke tab, subtab, item, dan field editor terkait.
 * Mengembalikan null untuk error struktural root yang tidak berada di satu editor spesifik.
 */
export function resolveIssueNavigationTarget(
  issue: Pick<ContentHealthIssue, "section" | "field" | "itemId" | "fieldKey">
): Omit<AdminNavigationTarget, "nonce"> | null {
  const section = issue.section;
  const field = issue.field || "";
  const base = {
    ...(issue.itemId ? { itemId: issue.itemId } : {}),
    ...(field ? { field } : {}),
    ...(issue.fieldKey ? { fieldKey: issue.fieldKey } : {}),
  };

  if (section === "Profil" || section === "Statistik") {
    return { tab: "general", ...base };
  }
  if (section === "Kontak") {
    if (field.startsWith("generalProfile.") || field.startsWith("stats.")) {
      return { tab: "general", ...base };
    }
    return { tab: "content", subTab: "contactFooter", ...base };
  }
  if (section === "Tampilan") {
    return {
      tab: "appearance",
      subTab: field.startsWith("lanyard") ? "lanyard" : "profileCard",
      ...base,
    };
  }
  if (section === "SEO") {
    return { tab: "appearance", subTab: "seo", ...base };
  }
  if (section === "Proyek") {
    return { tab: "works", ...base };
  }
  if (section === "Pendidikan") {
    return { tab: "journey", subTab: "education", ...base };
  }
  if (section === "Karier") {
    return { tab: "journey", subTab: "experience", ...base };
  }
  if (section === "Sertifikat") {
    return { tab: "credentials", subTab: "certificates", ...base };
  }
  if (section === "Prestasi") {
    return { tab: "credentials", subTab: "achievements", ...base };
  }
  if (section === "CV") {
    return { tab: "credentials", subTab: "cv", ...base };
  }
  if (section === "Tech Stack") {
    return { tab: "expertise", subTab: "stack", ...base };
  }
  if (section === "Layanan") {
    return { tab: "expertise", subTab: "services", ...base };
  }
  if (section === "FAQ") {
    return { tab: "content", subTab: "faq", ...base };
  }
  if (section === "Blog") {
    return { tab: "content", subTab: "blog", ...base };
  }
  if (section === "Navigasi") {
    return { tab: "content", subTab: "navigation", ...base };
  }

  return null;
}

export function getHealthToneClasses(tone: ContentReadinessSummary["tone"]) {
  switch (tone) {
    case "emerald":
      return {
        chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20",
        pill: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        iconBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        iconText: "text-emerald-600 dark:text-emerald-400",
      };
    case "sky":
      return {
        chip: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20",
        pill: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        iconBox: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        iconText: "text-sky-600 dark:text-sky-400",
      };
    case "amber":
      return {
        chip: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20",
        pill: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        iconBox: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        iconText: "text-amber-600 dark:text-amber-400",
      };
    case "rose":
      return {
        chip: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20",
        pill: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
        iconBox: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        iconText: "text-rose-600 dark:text-rose-400",
      };
  }
}

/**
 * Mengambil index array dari path field seperti "projects[3].title" bila itemId belum tersedia.
 */
export function extractArrayIndexFromField(field: string | undefined, prefix: string): number | null {
  if (!field) return null;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = field.match(new RegExp(`^${escaped}\\[(\\d+)\\]`));
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}
