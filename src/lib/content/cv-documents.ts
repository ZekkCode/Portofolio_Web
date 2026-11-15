import type { CvDocConfig, CvSettingsConfig } from "../site-config";
import { extractR2Key } from "./r2-key";

export const DEFAULT_COMBINED_CV_PDF_URL = "/cv-ats-zakariamp-2025.pdf";
export const DEFAULT_COMBINED_CV_FILENAME = "CV-ATS-ZakariaMP-2025.pdf";
export const DEFAULT_COMBINED_CV_PAGES = [
  "/cv-page-1.png",
  "/cv-page-2.png",
  "/cv-page-3.png",
  "/cv-page-4.png",
] as const;

export const LEGACY_COMBINED_ROLE_FILENAMES = new Set<string>([
  "CV-ATS-ZakariaMP-Graphic-Designer.pdf",
  "CV-ATS-ZakariaMP-UIUX-Designer.pdf",
  "CV-ATS-ZakariaMP-Frontend-Developer.pdf",
  "CV-ATS-ZakariaMP-IT-Support.pdf",
]);

export type CvPreviewMode = "images" | "pdf-embed" | "missing";

export interface CvDocumentResolution {
  doc: CvDocConfig;
  pdfUrl: string;
  hasPdf: boolean;
  identityKey: string;
  usesCombinedDefaultPdf: boolean;
  isSharedPdf: boolean;
  sharedWithRoleKeys: string[];
  sharedWithTitles: string[];
  previewMode: CvPreviewMode;
  previewPages: string[];
  thumbnailUrl: string;
  hasStaleLegacyPages: boolean;
  stalePageUrls: string[];
  downloadFilename: string;
  hasMisleadingRoleFilename: boolean;
  allowDownload: boolean;
}

export interface CvCollectionSummary {
  totalDocs: number;
  docsWithPdf: number;
  missingPdfCount: number;
  uniquePdfCount: number;
  allShareSinglePdf: boolean;
  hasAnySharedPdf: boolean;
  sharedGroups: Array<{
    identityKey: string;
    pdfUrl: string;
    usesCombinedDefaultPdf: boolean;
    roleKeys: string[];
    titles: string[];
    effectiveDownloadFilename: string;
  }>;
  resolutionsById: Record<string, CvDocumentResolution>;
  resolutionsByRoleKey: Record<string, CvDocumentResolution>;
}

const COMBINED_PAGE_REGEX = /^\/?cv-page-(?:[1-9]\d*)\.png$/i;
const SAFE_DATA_IMAGE_REGEX = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
const SAFE_DATA_PDF_REGEX = /^data:application\/pdf(?:;[a-z0-9=.-]+)*;base64,[A-Za-z0-9+/=]+$/i;

function stripQueryAndHash(value: string): string {
  return value.split("#")[0]?.split("?")[0]?.trim() || "";
}

/**
 * Checks whether a URL refers to the authentic 4-page combined default CV PDF.
 */
export function isDefaultCombinedCvPdfUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = stripQueryAndHash(url);
  if (!clean) return false;
  const normalized = clean.startsWith("/") ? clean : `/${clean}`;
  return normalized.toLowerCase() === DEFAULT_COMBINED_CV_PDF_URL.toLowerCase();
}

/**
 * Checks whether a URL refers to the rasterized PNG preview pages of the
 * default combined CV (`/cv-page-1.png` .. `/cv-page-4.png`).
 */
export function isLegacyCombinedCvPageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = stripQueryAndHash(url);
  return COMBINED_PAGE_REGEX.test(clean);
}

/**
 * Validates that a CV asset URL (PDF or image) uses a safe local path, HTTP(S),
 * or strictly bounded base64 data URI.
 */
export function isSafeCvAssetUrl(
  url?: string | null,
  options?: { allowDataPdf?: boolean; allowDataImage?: boolean }
): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || /[\u0000-\u001F]/.test(trimmed)) return false;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("vbscript:")) {
    return false;
  }

  if (lower.startsWith("data:")) {
    if (options?.allowDataPdf && SAFE_DATA_PDF_REGEX.test(trimmed)) return true;
    if (options?.allowDataImage && SAFE_DATA_IMAGE_REGEX.test(trimmed)) return true;
    return false;
  }

  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//");
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Normalizes any local, R2, HTTP, or data-URI PDF reference into a canonical
 * comparison key so shared PDFs are detected regardless of URL formatting.
 */
export function normalizeCvPdfIdentityKey(pdfUrl?: string | null): string {
  if (!pdfUrl || typeof pdfUrl !== "string") return "";
  const trimmed = pdfUrl.trim();
  if (!trimmed) return "";

  if (trimmed.toLowerCase().startsWith("data:")) {
    return `data:${trimmed.slice(0, 128)}#${trimmed.length}`;
  }

  const r2Key = extractR2Key(trimmed);
  if (r2Key) {
    return `r2:${r2Key}`;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return `local:${stripQueryAndHash(trimmed)}`;
  }

  try {
    const parsed = new URL(trimmed);
    return `url:${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return `raw:${stripQueryAndHash(trimmed)}`;
  }
}

/**
 * Produces a safe ASCII `.pdf` download filename without path traversal or header injection.
 */
export function sanitizeCvDownloadFilename(
  rawFilename?: string | null,
  fallback = DEFAULT_COMBINED_CV_FILENAME
): string {
  const candidate = typeof rawFilename === "string" ? rawFilename.trim() : "";
  const base = candidate.split(/[\\/]/).pop() || "";
  const cleaned = base
    .replace(/["'<>|:*?\\\u0000-\u001F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9._-]/g, "");

  if (!cleaned) return fallback;
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

/**
 * Derives an honest `.pdf` basename directly from the stored PDF URL when possible.
 */
export function deriveFilenameFromCvPdfUrl(pdfUrl?: string | null): string | null {
  if (!pdfUrl || typeof pdfUrl !== "string") return null;
  const trimmed = pdfUrl.trim();
  if (!trimmed || trimmed.toLowerCase().startsWith("data:")) return null;

  if (isDefaultCombinedCvPdfUrl(trimmed)) {
    return DEFAULT_COMBINED_CV_FILENAME;
  }

  const r2Key = extractR2Key(trimmed);
  const targetPath = r2Key || stripQueryAndHash(trimmed);
  const segment = targetPath.split("/").filter(Boolean).pop();
  if (!segment) return null;

  return sanitizeCvDownloadFilename(segment);
}

/**
 * Removes `/cv-page-*.png` references that belong exclusively to `/cv-ats-zakariamp-2025.pdf`
 * when a role uses a different or missing PDF.
 */
export function stripLegacyCombinedCvPages(pages?: string[] | null): string[] {
  if (!Array.isArray(pages)) return [];
  return pages
    .filter((pg): pg is string => typeof pg === "string" && Boolean(pg.trim()))
    .filter((pg) => isSafeCvAssetUrl(pg, { allowDataImage: true }) && !isLegacyCombinedCvPageUrl(pg));
}

function resolveCombinedPageIndexHint(doc: CvDocConfig, pages: string[]): number {
  const thumb = typeof doc.thumbnailUrl === "string" ? doc.thumbnailUrl.trim() : "";
  if (thumb) {
    const idx = pages.findIndex((p) => p === thumb);
    if (idx >= 0) return idx;
  }

  const role = doc.roleKey.toLowerCase();
  if (role.includes("ui") || role.includes("ux")) return Math.min(1, pages.length - 1);
  if (role.includes("front") || role.includes("dev") || role.includes("web")) {
    return Math.min(2, pages.length - 1);
  }
  if (role.includes("it") || role.includes("support") || role.includes("ops")) {
    return Math.min(3, pages.length - 1);
  }
  return 0;
}

/**
 * Resolves honest preview mode, preview pages, shared status, and effective download
 * filename for a single CV role in the context of the active CV collection.
 */
export function resolveCvDocumentInfo(
  doc: CvDocConfig,
  allDocs: CvDocConfig[],
  cvSettings?: Partial<CvSettingsConfig> | null
): CvDocumentResolution {
  const pdfUrl = typeof doc.pdfUrl === "string" ? doc.pdfUrl.trim() : "";
  const safePdf = isSafeCvAssetUrl(pdfUrl, { allowDataPdf: true });
  const hasPdf = Boolean(pdfUrl && safePdf);
  const identityKey = hasPdf ? normalizeCvPdfIdentityKey(pdfUrl) : "";
  const usesCombinedDefaultPdf = hasPdf && isDefaultCombinedCvPdfUrl(pdfUrl);

  const rawPages = Array.isArray(doc.pages)
    ? doc.pages.filter((pg): pg is string => typeof pg === "string" && Boolean(pg.trim()))
    : [];
  const rawThumb = typeof doc.thumbnailUrl === "string" ? doc.thumbnailUrl.trim() : "";

  const sharingPeers = hasPdf
    ? allDocs.filter(
        (other) =>
          other.id !== doc.id &&
          Boolean(other.pdfUrl?.trim()) &&
          normalizeCvPdfIdentityKey(other.pdfUrl) === identityKey
      )
    : [];
  const isSharedPdf = sharingPeers.length > 0;
  const sharedWithRoleKeys = sharingPeers.map((other) => other.roleKey);
  const sharedWithTitles = sharingPeers.map((other) => other.title || other.roleKey);

  const stalePageUrls: string[] = [];
  if (!usesCombinedDefaultPdf) {
    for (const pg of rawPages) {
      if (isLegacyCombinedCvPageUrl(pg)) stalePageUrls.push(pg);
    }
    if (rawThumb && isLegacyCombinedCvPageUrl(rawThumb) && !stalePageUrls.includes(rawThumb)) {
      stalePageUrls.push(rawThumb);
    }
  }
  const hasStaleLegacyPages = stalePageUrls.length > 0;

  let previewPages: string[] = [];
  let thumbnailUrl = "";
  let previewMode: CvPreviewMode = "missing";

  if (usesCombinedDefaultPdf) {
    const validPages = rawPages.filter((pg) =>
      isSafeCvAssetUrl(pg, { allowDataImage: true })
    );
    previewPages = validPages.length > 0 ? validPages : [...DEFAULT_COMBINED_CV_PAGES];

    if (rawThumb && isSafeCvAssetUrl(rawThumb, { allowDataImage: true })) {
      thumbnailUrl = rawThumb;
    } else {
      thumbnailUrl = previewPages[resolveCombinedPageIndexHint(doc, previewPages)] || previewPages[0] || "";
    }
    previewMode = previewPages.length > 0 ? "images" : "pdf-embed";
  } else if (hasPdf) {
    const customPages = stripLegacyCombinedCvPages(rawPages);
    previewPages = customPages;

    if (
      rawThumb &&
      !isLegacyCombinedCvPageUrl(rawThumb) &&
      isSafeCvAssetUrl(rawThumb, { allowDataImage: true })
    ) {
      thumbnailUrl = rawThumb;
    } else {
      thumbnailUrl = customPages[0] || "";
    }

    previewMode = customPages.length > 0 ? "images" : "pdf-embed";
  } else {
    previewPages = [];
    thumbnailUrl = "";
    previewMode = "missing";
  }

  const storedFilename = typeof doc.downloadFilename === "string" ? doc.downloadFilename.trim() : "";
  const isLegacyRoleName = LEGACY_COMBINED_ROLE_FILENAMES.has(storedFilename);
  const derivedFilename = deriveFilenameFromCvPdfUrl(pdfUrl);

  let downloadFilename: string;
  let hasMisleadingRoleFilename = false;

  if (!hasPdf) {
    downloadFilename = sanitizeCvDownloadFilename(storedFilename, DEFAULT_COMBINED_CV_FILENAME);
  } else if (usesCombinedDefaultPdf) {
    // When multiple roles point to `/cv-ats-zakariamp-2025.pdf` or carry legacy per-role names,
    // use the canonical combined filename so downloads never impersonate role-tailored PDFs.
    if (isSharedPdf || isLegacyRoleName || !storedFilename) {
      downloadFilename = DEFAULT_COMBINED_CV_FILENAME;
      hasMisleadingRoleFilename = Boolean(storedFilename && storedFilename !== DEFAULT_COMBINED_CV_FILENAME);
    } else {
      downloadFilename = sanitizeCvDownloadFilename(storedFilename, DEFAULT_COMBINED_CV_FILENAME);
    }
  } else if (isSharedPdf) {
    // Shared custom PDF across roles uses the real file's basename (or canonical shared name)
    downloadFilename = sanitizeCvDownloadFilename(
      derivedFilename || storedFilename || `CV-Gabungan.pdf`,
      DEFAULT_COMBINED_CV_FILENAME
    );
    hasMisleadingRoleFilename = Boolean(
      storedFilename &&
        isLegacyRoleName &&
        sanitizeCvDownloadFilename(storedFilename) !== downloadFilename
    );
  } else {
    // Dedicated role-specific PDF
    if (!storedFilename || storedFilename === DEFAULT_COMBINED_CV_FILENAME) {
      downloadFilename = sanitizeCvDownloadFilename(
        derivedFilename || `CV-${doc.roleKey || "role"}.pdf`
      );
    } else {
      downloadFilename = sanitizeCvDownloadFilename(
        storedFilename,
        derivedFilename || `CV-${doc.roleKey || "role"}.pdf`
      );
    }
  }

  const globalAllowDownload = cvSettings?.allowDownload !== false;
  const docAllowDownload = doc.allowDownload !== false;
  const allowDownload = Boolean(hasPdf && globalAllowDownload && docAllowDownload);

  return {
    doc,
    pdfUrl,
    hasPdf,
    identityKey,
    usesCombinedDefaultPdf,
    isSharedPdf,
    sharedWithRoleKeys,
    sharedWithTitles,
    previewMode,
    previewPages,
    thumbnailUrl,
    hasStaleLegacyPages,
    stalePageUrls,
    downloadFilename,
    hasMisleadingRoleFilename,
    allowDownload,
  };
}

/**
 * Summarizes shared vs dedicated PDF usage across a CV list (public or admin).
 */
export function summarizeCvCollection(
  docs: CvDocConfig[],
  cvSettings?: Partial<CvSettingsConfig> | null
): CvCollectionSummary {
  const resolutions = docs.map((doc) => resolveCvDocumentInfo(doc, docs, cvSettings));
  const resolutionsById: Record<string, CvDocumentResolution> = {};
  const resolutionsByRoleKey: Record<string, CvDocumentResolution> = {};
  const groupsMap = new Map<string, CvDocumentResolution[]>();

  for (const res of resolutions) {
    resolutionsById[res.doc.id] = res;
    if (res.doc.roleKey) {
      resolutionsByRoleKey[res.doc.roleKey] = res;
    }
    if (res.hasPdf && res.identityKey) {
      const existing = groupsMap.get(res.identityKey) || [];
      existing.push(res);
      groupsMap.set(res.identityKey, existing);
    }
  }

  const sharedGroups: CvCollectionSummary["sharedGroups"] = [];
  for (const [identityKey, items] of groupsMap.entries()) {
    if (items.length > 1) {
      sharedGroups.push({
        identityKey,
        pdfUrl: items[0].pdfUrl,
        usesCombinedDefaultPdf: items.some((item) => item.usesCombinedDefaultPdf),
        roleKeys: items.map((item) => item.doc.roleKey),
        titles: items.map((item) => item.doc.title || item.doc.roleKey),
        effectiveDownloadFilename: items[0].downloadFilename,
      });
    }
  }

  const docsWithPdf = resolutions.filter((res) => res.hasPdf).length;
  const uniquePdfCount = groupsMap.size;
  const allShareSinglePdf = docs.length > 1 && docsWithPdf === docs.length && uniquePdfCount === 1;

  return {
    totalDocs: docs.length,
    docsWithPdf,
    missingPdfCount: docs.length - docsWithPdf,
    uniquePdfCount,
    allShareSinglePdf,
    hasAnySharedPdf: sharedGroups.length > 0,
    sharedGroups,
    resolutionsById,
    resolutionsByRoleKey,
  };
}
