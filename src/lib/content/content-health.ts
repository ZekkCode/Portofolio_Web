import type {
  SiteConfig,
  Project,
  CertificateItem,
  CvDocConfig,
  TechStackCategoryConfig,
  TechStackItem,
  ContentHealthReport,
  ContentHealthIssue,
  ContentReadinessStatus,
  ContentReadinessSummary,
} from "./types";
import type { CvSettingsConfig } from "@/lib/site-config";
import { validateSiteConfigStructured } from "@/lib/config-validator";
import {
  isSafeCvAssetUrl,
  resolveCvDocumentInfo,
  summarizeCvCollection,
} from "./cv-documents";
import {
  hasCertificateEvidence,
  hasCertificateEvidenceMismatch,
  resolveCertificateVerificationStatus,
} from "./certificate-verification";
import {
  getOtherToolsCategoryLabel,
  getTechStackCategoryMasterList,
  resolveTechStackCategoryMatch,
  TECH_STACK_FALLBACK_CATEGORY_KEY,
} from "./tech-stack-categories";
import {
  getIdentityImageSourceMap,
  isIdentityCardAssetUrl,
  isMissingPortraitAliasUrl,
  LEGACY_MISSING_PORTRAIT_PLACEHOLDER,
} from "./identity-images";
import { resolveExperienceRecord } from "./experience-dates";
import {
  resolveBlogSyncMeta,
  validatePublicFeedUrlSyntax,
} from "./blog-sync";
import { isSafeUrl } from "@/lib/config-validator";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_FORMAT_REGEX = /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/;

const PLACEHOLDER_TITLE_PATTERNS: RegExp[] = [
  /^proyek\s+baru(?:\s*#?\d+)?$/,
  /^new\s+project(?:\s*#?\d+)?$/,
  /^proyek\s+cek\s+otomatis(?:\s*#?\d+)?$/,
  /^contoh\s+proyek(?:\s*#?\d+)?$/,
  /^proyek\s+contoh(?:\s*#?\d+)?$/,
  /^sample\s+project(?:\s*#?\d+)?$/,
  /^dummy\s+project(?:\s*#?\d+)?$/,
  /^proyek\s+dummy(?:\s*#?\d+)?$/,
  /^test\s+project(?:\s*#?\d+)?$/,
  /^proyek\s+test(?:ing)?(?:\s*#?\d+)?$/,
  /^judul\s+proyek(?:\s*#?\d+)?$/,
  /^untitled\s+project(?:\s*#?\d+)?$/,
  /^proyek(?:\s*#?\d+)?$/,
  /^project(?:\s*#?\d+)?$/,
];

const PLACEHOLDER_DESC_STEMS = new Set<string>([
  "deskripsi ringkas mengenai tujuan, fitur, dan arsitektur proyek",
  "brief description of the project goals, architecture, and features",
  "deskripsi proyek",
  "ringkasan proyek",
  "project description",
  "short description",
  "placeholder",
  "tbd",
  "-",
]);

function normalizePlaceholderCandidate(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\.{2,}$/, "")
    .replace(/\s+/g, " ");
}

export function isProjectPublic(proj: Partial<Project>): boolean {
  return proj.published !== false && proj.visible !== false;
}

export function isPlaceholderProjectTitle(title?: string): boolean {
  if (!title || !title.trim()) return false;
  const normalized = normalizePlaceholderCandidate(title);
  return PLACEHOLDER_TITLE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isPlaceholderProjectDescription(text?: string): boolean {
  if (!text || !text.trim()) return false;
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/\.{2,}$/, "")
    .replace(/\s+/g, " ");
  if (normalized.startsWith("lorem ipsum")) return true;
  return PLACEHOLDER_DESC_STEMS.has(normalized);
}

/**
 * Validasi bersama proyek portofolio untuk publikasi & inspeksi inline admin.
 * Draf (published: false) dan item tersembunyi (visible: false) tidak dikenai
 * kewajiban kelengkapan publik agar draf belum lengkap tetap dapat disimpan.
 */
export function auditProjectPublishIssues(projects: Array<Partial<Project>>): ContentHealthIssue[] {
  const issues: ContentHealthIssue[] = [];
  const publicSlugCounts = new Map<string, number>();

  for (const proj of projects) {
    if (!proj || typeof proj !== "object" || !isProjectPublic(proj)) continue;
    const slugKey = typeof proj.slug === "string" ? proj.slug.trim().toLowerCase() : "";
    if (slugKey) {
      publicSlugCounts.set(slugKey, (publicSlugCounts.get(slugKey) || 0) + 1);
    }
  }

  projects.forEach((proj, idx) => {
    if (!proj || typeof proj !== "object") return;
    const itemId = typeof proj.id === "string" && proj.id ? proj.id : `projects-${idx}`;
    const titleTrim = typeof proj.title === "string" ? proj.title.trim() : "";
    const label = titleTrim || `#${idx + 1}`;

    const unsafeGallery =
      Array.isArray(proj.galleryImages) && proj.galleryImages.some((img) => img && !isSafeUrl(img));
    const unsafeUrlChecks: Array<{
      failed: boolean;
      field: string;
      fieldKey: "url" | "image";
      dedupeKey: string;
      message: string;
    }> = [
      {
        failed: Boolean(proj.previewUrl && !isSafeUrl(proj.previewUrl)),
        field: `projects[${idx}].previewUrl`,
        fieldKey: "url",
        dedupeKey: `unsafe-url:projects[${idx}].previewUrl`,
        message: `URL pratinjau proyek '${label}' menggunakan protokol tidak aman.`,
      },
      {
        failed: Boolean(proj.repo && !isSafeUrl(proj.repo)),
        field: `projects[${idx}].repo`,
        fieldKey: "url",
        dedupeKey: `unsafe-url:projects[${idx}].repo`,
        message: `Tautan repository proyek '${label}' menggunakan skema URL tidak aman.`,
      },
      {
        failed: Boolean(proj.caseStudyUrl && !isSafeUrl(proj.caseStudyUrl)),
        field: `projects[${idx}].caseStudyUrl`,
        fieldKey: "url",
        dedupeKey: `unsafe-url:projects[${idx}].caseStudyUrl`,
        message: `Tautan studi kasus proyek '${label}' menggunakan skema URL tidak aman.`,
      },
      {
        failed: Boolean(proj.image && !isSafeUrl(proj.image)),
        field: `projects[${idx}].image`,
        fieldKey: "image",
        dedupeKey: `unsafe-url:projects[${idx}].image`,
        message: `Gambar cover proyek '${label}' mengandung skema URL tidak aman.`,
      },
      {
        failed: Boolean(proj.logo && !isSafeUrl(proj.logo)),
        field: `projects[${idx}].logo`,
        fieldKey: "url",
        dedupeKey: `unsafe-url:projects[${idx}].logo`,
        message: `URL logo proyek '${label}' mengandung skema URL tidak aman.`,
      },
      {
        failed: unsafeGallery,
        field: `projects[${idx}].galleryImages`,
        fieldKey: "image",
        dedupeKey: `unsafe-url:projects[${idx}].galleryImages`,
        message: `Salah satu gambar galeri proyek '${label}' mengandung skema URL tidak aman.`,
      },
    ];
    for (const check of unsafeUrlChecks) {
      if (!check.failed) continue;
      issues.push({
        id: `project-url-unsafe-${itemId}-${idx}-${check.field.split(".").pop()}`,
        dedupeKey: check.dedupeKey,
        itemId,
        field: check.field,
        fieldKey: check.fieldKey,
        section: "Proyek",
        severity: "error",
        message: check.message,
      });
    }

    if (!isProjectPublic(proj)) {
      return;
    }

    if (!titleTrim) {
      issues.push({
        id: `project-title-missing-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].title`,
        fieldKey: "title",
        section: "Proyek",
        severity: "error",
        message: `Proyek publik #${idx + 1} wajib memiliki judul.`,
      });
    } else if (isPlaceholderProjectTitle(titleTrim)) {
      issues.push({
        id: `project-title-placeholder-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].title`,
        fieldKey: "title",
        section: "Proyek",
        severity: "error",
        message: `Judul proyek '${titleTrim}' masih berupa placeholder dan tidak dapat dipublikasikan.`,
        suggestion: "Ganti dengan nama proyek sebenarnya sebelum dipublikasikan.",
      });
    }

    const slugTrim = typeof proj.slug === "string" ? proj.slug.trim() : "";
    if (!slugTrim) {
      issues.push({
        id: `project-slug-missing-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].slug`,
        fieldKey: "slug",
        section: "Proyek",
        severity: "error",
        message: `Slug URL pada proyek publik '${label}' wajib diisi.`,
        suggestion: "Isi slug unik (atau klik tombol Auto setelah mengisi judul).",
      });
    } else if (!SLUG_FORMAT_REGEX.test(slugTrim)) {
      issues.push({
        id: `project-slug-invalid-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].slug`,
        fieldKey: "slug",
        section: "Proyek",
        severity: "error",
        message: `Slug '${slugTrim}' pada proyek '${label}' hanya boleh berisi huruf, angka, '-' atau '_' tanpa spasi.`,
        suggestion: "Gunakan tombol Auto untuk membuat slug URL yang valid.",
      });
    } else if ((publicSlugCounts.get(slugTrim.toLowerCase()) || 0) > 1) {
      issues.push({
        id: `project-slug-duplicate-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].slug`,
        fieldKey: "slug",
        section: "Proyek",
        severity: "error",
        message: `Slug '${slugTrim}' duplikat dengan proyek publik lain. Setiap proyek publik wajib memiliki slug unik.`,
      });
    }

    const summaryTrim = typeof proj.summary === "string" ? proj.summary.trim() : "";
    const descTrim = typeof proj.desc === "string" ? proj.desc.trim() : "";
    const summaryIsPlaceholder = Boolean(summaryTrim) && isPlaceholderProjectDescription(summaryTrim);
    const descIsPlaceholder = Boolean(descTrim) && isPlaceholderProjectDescription(descTrim);
    const hasValidSummary = Boolean(summaryTrim) && !summaryIsPlaceholder;
    const hasValidDesc = Boolean(descTrim) && !descIsPlaceholder;

    if (summaryIsPlaceholder) {
      issues.push({
        id: `project-summary-placeholder-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].summary`,
        fieldKey: "summary",
        section: "Proyek",
        severity: "error",
        message: `Ringkasan singkat proyek '${label}' masih berisi teks placeholder.`,
      });
    }
    if (descIsPlaceholder) {
      issues.push({
        id: `project-desc-placeholder-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].desc`,
        fieldKey: "desc",
        section: "Proyek",
        severity: "error",
        message: `Deskripsi ringkas proyek '${label}' masih berisi teks placeholder.`,
      });
    }
    if (!hasValidSummary && !hasValidDesc && !summaryIsPlaceholder && !descIsPlaceholder) {
      issues.push({
        id: `project-summary-desc-missing-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].desc`,
        fieldKey: "desc",
        section: "Proyek",
        severity: "error",
        message: `Proyek publik '${label}' wajib memiliki ringkasan singkat (Summary) atau deskripsi ringkas.`,
        suggestion: "Tambahkan minimal ringkasan singkat atau deskripsi mengenai tujuan proyek.",
      });
    }

    const imageTrim = typeof proj.image === "string" ? proj.image.trim() : "";
    if (!imageTrim) {
      issues.push({
        id: `project-image-missing-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].image`,
        fieldKey: "image",
        section: "Proyek",
        severity: "error",
        message: `Proyek publik '${label}' wajib memiliki gambar thumbnail cover.`,
        suggestion: "Unggah foto cover utama proyek atau isi URL gambar cover yang valid.",
      });
    } else if (!imageTrim.toLowerCase().endsWith(".webp") && !imageTrim.startsWith("data:")) {
      issues.push({
        id: `project-image-not-webp-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].image`,
        fieldKey: "image",
        section: "Proyek",
        severity: "info",
        message: `Gambar proyek '${label}' bukan format WebP.`,
        suggestion: "Format WebP menghemat bandwidth dan mempercepat loading kartu.",
      });
    }

    if (proj.titleEn && isPlaceholderProjectTitle(proj.titleEn)) {
      issues.push({
        id: `project-title-en-placeholder-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].titleEn`,
        fieldKey: "titleEn",
        section: "Proyek",
        severity: "warning",
        message: `Judul Bahasa Inggris ('${proj.titleEn.trim()}') pada proyek '${label}' masih berupa placeholder.`,
      });
    } else if (!proj.titleEn) {
      issues.push({
        id: `project-title-en-missing-${itemId}-${idx}`,
        itemId,
        field: `projects[${idx}].titleEn`,
        fieldKey: "titleEn",
        section: "Proyek",
        severity: "info",
        message: `Judul Bahasa Inggris untuk proyek '${label}' belum diisi.`,
      });
    }
  });

  return issues;
}

export function auditCertificateVerificationIssues(
  certificates: Array<Partial<CertificateItem>>
): ContentHealthIssue[] {
  const issues: ContentHealthIssue[] = [];

  certificates.forEach((cert, idx) => {
    if (!cert || typeof cert !== "object") return;
    const itemId = typeof cert.id === "string" && cert.id ? cert.id : `cert-${idx}`;
    const label = cert.title?.trim() || `#${idx + 1}`;

    if (!cert.title || !cert.title.trim()) {
      issues.push({
        id: `cert-title-missing-${idx}`,
        itemId,
        field: `certificates[${idx}].title`,
        section: "Sertifikat",
        severity: "error",
        message: `Sertifikat #${idx + 1} tidak memiliki nama sertifikat.`,
      });
    }

    const certUnsafeChecks: Array<{
      value?: string;
      prop: "credentialUrl" | "credentialPdf" | "image";
      labelId: string;
    }> = [
      { value: cert.credentialUrl, prop: "credentialUrl", labelId: "Tautan kredensial" },
      { value: cert.credentialPdf, prop: "credentialPdf", labelId: "Berkas PDF bukti" },
      { value: cert.image, prop: "image", labelId: "Gambar sertifikat" },
    ];
    for (const check of certUnsafeChecks) {
      if (check.value && !isSafeUrl(check.value)) {
        issues.push({
          id: `cert-url-unsafe-${idx}-${check.prop}`,
          dedupeKey: `unsafe-url:certificates[${idx}].${check.prop}`,
          itemId,
          field: `certificates[${idx}].${check.prop}`,
          section: "Sertifikat",
          severity: "error",
          message: `${check.labelId} pada sertifikat '${label}' mengandung skema tidak aman.`,
        });
      }
    }

    const evidencePresent = hasCertificateEvidence(cert);
    const resolvedStatus = resolveCertificateVerificationStatus(cert);

    if (cert.verificationStatus === "verified" && !evidencePresent) {
      issues.push({
        id: `cert-verified-without-evidence-${itemId}`,
        itemId,
        field: `certificates[${idx}].verificationStatus`,
        section: "Sertifikat",
        severity: "error",
        message: `Sertifikat '${label}' tidak dapat ditandai terverifikasi tanpa minimal satu bukti (URL, PDF, atau gambar).`,
      });
      return;
    }

    if (cert.verificationStatus === "verified" && hasCertificateEvidenceMismatch(cert)) {
      issues.push({
        id: `cert-verified-evidence-changed-${itemId}`,
        itemId,
        field: `certificates[${idx}].verificationStatus`,
        section: "Sertifikat",
        severity: "error",
        message: `Bukti sertifikat '${label}' telah diubah sejak pemeriksaan terakhir dan harus diperiksa ulang sebelum berstatus terverifikasi.`,
      });
      return;
    }

    if (resolvedStatus === "needs_reverification") {
      issues.push({
        id: `cert-needs-reverification-${itemId}`,
        itemId,
        field: `certificates[${idx}].verificationStatus`,
        section: "Sertifikat",
        severity: "warning",
        message: `Bukti sertifikat '${label}' berubah setelah pemeriksaan sebelumnya dan perlu diperiksa ulang (sementara tampil Belum Diperiksa).`,
      });
      return;
    }

    if (resolvedStatus !== "verified") {
      if (evidencePresent) {
        issues.push({
          id: `cert-evidence-unchecked-${itemId}`,
          itemId,
          field: `certificates[${idx}].verificationStatus`,
          section: "Sertifikat",
          severity: "info",
          message: `Sertifikat '${label}' sudah memiliki bukti (URL/PDF/gambar), namun belum ditandai diperiksa oleh admin.`,
        });
      } else {
        issues.push({
          id: `cert-proof-missing-${idx}`,
          itemId,
          field: `certificates[${idx}].credentialUrl`,
          section: "Sertifikat",
          severity: "info",
          message: `Sertifikat '${label}' belum memiliki lampiran bukti (URL / PDF / gambar). Ditampilkan sebagai belum diperiksa.`,
        });
      }
    }
  });

  return issues;
}

/**
 * Menentukan status kesiapan publikasi berdasarkan hasil akhir error, warning, dan info.
 * Skor bukan satu-satunya penentu; hanya error blocker yang memblokir publish.
 */
export function resolveContentReadinessStatus(counts: {
  errorsCount: number;
  warningsCount: number;
  infosCount: number;
}): ContentReadinessStatus {
  if (counts.errorsCount > 0) return "blocked";
  if (counts.warningsCount > 0) return "warnings_present";
  if (counts.infosCount > 0) return "suggestions_only";
  return "clean";
}

/**
 * Menghasilkan ringkasan status kesiapan yang konsisten untuk Admin UI maupun pesan API.
 * Tidak pernah mengklaim konten lengkap/tanpa kekurangan jika warning atau saran masih ada.
 */
export function getContentReadinessSummary(
  report: Pick<
    ContentHealthReport,
    "score" | "canPublish" | "errorsCount" | "warningsCount" | "infosCount"
  >
): ContentReadinessSummary {
  const status = resolveContentReadinessStatus(report);
  const { errorsCount, warningsCount, infosCount } = report;

  if (status === "blocked") {
    return {
      status,
      canPublish: false,
      isComplete: false,
      tone: "rose",
      badgeLabel: "Publikasi Diblokir",
      headline: `${errorsCount} kesalahan blocker wajib diperbaiki sebelum publikasi${
        warningsCount > 0 ? ` (${warningsCount} peringatan kelengkapan juga ditemukan)` : ""
      }.`,
      footerMessage: `Perbaiki ${errorsCount} blocker merah sebelum mempublikasikan ke situs produksi.`,
    };
  }

  if (status === "warnings_present") {
    return {
      status,
      canPublish: true,
      isComplete: false,
      tone: "amber",
      badgeLabel: "Ada Peringatan",
      headline: `Tidak ada blocker wajib, tetapi ditemukan ${warningsCount} peringatan kelengkapan${
        infosCount > 0 ? ` dan ${infosCount} saran opsional` : ""
      }. Konten belum sepenuhnya lengkap.`,
      footerMessage: `Dapat dipublikasikan, namun ${warningsCount} peringatan kelengkapan masih perlu ditinjau.`,
    };
  }

  if (status === "suggestions_only") {
    return {
      status,
      canPublish: true,
      isComplete: false,
      tone: "sky",
      badgeLabel: "Siap (Ada Saran)",
      headline: `Tidak ada blocker atau peringatan. Tersisa ${infosCount} saran opsional untuk penyempurnaan konten.`,
      footerMessage: `Bebas blocker dan peringatan; ${infosCount} saran opsional tersedia untuk ditinjau.`,
    };
  }

  return {
    status: "clean",
    canPublish: true,
    isComplete: true,
    tone: "emerald",
    badgeLabel: "Bersih & Lengkap",
    headline: "Tidak ada blocker, peringatan kelengkapan, maupun saran opsional yang tersisa.",
    footerMessage: "✓ Lolos seluruh pemeriksaan tanpa blocker maupun peringatan.",
  };
}

/**
 * Menggabungkan temuan berulang (mis. antara validator skema dan audit semantik field yang sama)
 * agar tidak dihitung ganda pada total issue maupun penalti skor.
 */
function deduplicateHealthIssues(rawIssues: ContentHealthIssue[]): ContentHealthIssue[] {
  const map = new Map<string, ContentHealthIssue>();
  for (const issue of rawIssues) {
    const key = issue.dedupeKey || issue.id;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, issue);
      continue;
    }
    map.set(key, {
      ...prev,
      itemId: prev.itemId || issue.itemId,
      fieldKey: prev.fieldKey || issue.fieldKey,
      suggestion: prev.suggestion || issue.suggestion,
    });
  }
  return Array.from(map.values());
}

/**
 * Menyusun target audit dengan mempertahankan array mentah dari payload request sebelum normalisasi
 * agar item tidak valid / field kosong tidak tertutup default saat validasi publish.
 */
export function buildAuditHealthTarget(
  normalized: Partial<SiteConfig>,
  rawBody?: unknown
): Partial<SiteConfig> {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return normalized;
  }
  const raw = rawBody as Partial<SiteConfig>;
  return {
    ...normalized,
    ...(raw.projects !== undefined ? { projects: raw.projects } : {}),
    ...(raw.certificates !== undefined ? { certificates: raw.certificates } : {}),
    ...(raw.techStackCategories !== undefined
      ? { techStackCategories: raw.techStackCategories }
      : {}),
    ...(raw.techStack !== undefined ? { techStack: raw.techStack } : {}),
    ...(raw.cvDocs !== undefined ? { cvDocs: raw.cvDocs } : {}),
  };
}

/**
 * Satu titik masuk validasi + audit kesiapan publish bersama untuk client dan server API.
 */
export function evaluatePublishReadiness(
  config: Partial<SiteConfig>,
  rawBody?: unknown
): ContentHealthReport {
  return auditContentHealth(buildAuditHealthTarget(config, rawBody));
}

export function auditContentHealth(
  config: Partial<SiteConfig>,
  options?: { now?: Date }
): ContentHealthReport {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    const schemaOnly = validateSiteConfigStructured(config);
    const errorsCount = schemaOnly.issues.length;
    const score = Math.max(0, Math.min(100, 100 - errorsCount * 25));
    return {
      score,
      canPublish: errorsCount === 0,
      readinessStatus: resolveContentReadinessStatus({ errorsCount, warningsCount: 0, infosCount: 0 }),
      isComplete: false,
      errorsCount,
      warningsCount: 0,
      infosCount: 0,
      issues: schemaOnly.issues,
      auditedAt: new Date().toISOString(),
    };
  }

  const rawIssues: ContentHealthIssue[] = [];

  // ===================== 1. GENERAL PROFILE & CONTACT =====================
  const profile = config.generalProfile;
  if (!profile?.name || !profile.name.trim()) {
    rawIssues.push({
      id: "profile-name-missing",
      dedupeKey: "required:generalProfile.name",
      field: "generalProfile.name",
      section: "Profil",
      severity: "error",
      message: "Nama lengkap pemilik portofolio wajib diisi.",
      suggestion: "Masukkan nama lengkap, misal 'Zakaria Mujur Prasetyo'.",
    });
  }

  if (profile?.email && !EMAIL_REGEX.test(profile.email.trim())) {
    rawIssues.push({
      id: "profile-email-invalid",
      dedupeKey: "invalid:generalProfile.email",
      field: "generalProfile.email",
      section: "Profil",
      severity: "error",
      message: `Format email '${profile.email}' tidak valid.`,
      suggestion: "Gunakan format alamat email standar (nama@domain.com).",
    });
  }

  if (!profile?.heroDescEn || !profile.heroDescEn.trim()) {
    rawIssues.push({
      id: "profile-hero-desc-en-missing",
      field: "generalProfile.heroDescEn",
      section: "Profil",
      severity: "warning",
      message: "Deskripsi Hero versi Bahasa Inggris masih kosong.",
      suggestion: "Isi teks hero EN agar pengunjung internasional memahami latar belakang Anda.",
    });
  }

  (profile?.socials || []).forEach((social, idx) => {
    if (!isSafeUrl(social.href)) {
      rawIssues.push({
        id: `social-unsafe-url-${idx}`,
        dedupeKey: `unsafe-url:generalProfile.socials[${idx}].href`,
        field: `generalProfile.socials[${idx}].href`,
        ...(social.id ? { itemId: social.id } : {}),
        section: "Profil",
        severity: "error",
        message: `Tautan sosial '${social.label}' mengandung protokol tidak aman.`,
      });
    }
  });

  rawIssues.push(...auditIdentityImageIssues(config));

  // ===================== 2. PROJECTS COLLECTION =====================
  rawIssues.push(...auditProjectPublishIssues(config.projects || []));

  // ===================== 3. EDUCATION COLLECTION =====================
  const education = config.education || [];
  const currentYear = new Date().getFullYear();
  education.forEach((edu, idx) => {
    const itemId = typeof edu.id === "string" && edu.id ? edu.id : `education-${idx}`;
    if (!edu.institution || !edu.institution.trim()) {
      rawIssues.push({
        id: `edu-institution-missing-${idx}`,
        itemId,
        field: `education[${idx}].institution`,
        section: "Pendidikan",
        severity: "error",
        message: `Riwayat pendidikan #${idx + 1} tidak memiliki nama institusi.`,
      });
    }

    if (edu.startYear && edu.endYear && edu.startYear > edu.endYear) {
      rawIssues.push({
        id: `edu-year-invalid-${idx}`,
        itemId,
        field: `education[${idx}].startYear`,
        section: "Pendidikan",
        severity: "error",
        message: `Tahun mulai (${edu.startYear}) lebih besar dari tahun lulus (${edu.endYear}) pada '${edu.institution}'.`,
      });
    }

    if (edu.startYear && edu.startYear > currentYear + 1) {
      rawIssues.push({
        id: `edu-start-year-future-${idx}`,
        itemId,
        field: `education[${idx}].startYear`,
        section: "Pendidikan",
        severity: "warning",
        message: `Tahun mulai (${edu.startYear}) berada di masa depan yang tidak realistis.`,
      });
    }
  });

  // ===================== 4. CAREER & EXPERIENCE =====================
  const auditNow = options?.now ?? new Date();
  const experience = config.experience || [];
  experience.forEach((exp, idx) => {
    const itemId = typeof exp.id === "string" && exp.id ? exp.id : `experience-${idx}`;
    if (!exp.role || !exp.role.trim()) {
      rawIssues.push({
        id: `exp-role-missing-${idx}`,
        itemId,
        field: `experience[${idx}].role`,
        section: "Karier",
        severity: "error",
        message: `Pengalaman karier #${idx + 1} tidak memiliki jabatan/peran.`,
      });
    }
    if (!exp.org || !exp.org.trim()) {
      rawIssues.push({
        id: `exp-org-missing-${idx}`,
        itemId,
        field: `experience[${idx}].org`,
        section: "Karier",
        severity: "error",
        message: `Pengalaman karier #${idx + 1} tidak memiliki nama instansi/organisasi.`,
      });
    }

    const isPublicExp = exp.published !== false && exp.visible !== false;
    const resolved = resolveExperienceRecord(exp, auditNow);
    const label = exp.org?.trim() || exp.role?.trim() || `#${idx + 1}`;

    if (isPublicExp) {
      if (resolved.exclusionReason === "invalid_structured_date") {
        rawIssues.push({
          id: `exp-date-invalid-${idx}`,
          dedupeKey: `exp-date:${itemId}`,
          itemId,
          field: `experience[${idx}].startDate`,
          section: "Karier",
          severity: "error",
          message: `Pengalaman '${label}' memiliki tanggal terstruktur tidak valid (${resolved.exclusionDetail}).`,
          suggestion: "Gunakan format bulan kalender YYYY-MM yang valid.",
        });
      } else if (resolved.exclusionReason === "reversed_dates") {
        rawIssues.push({
          id: `exp-date-reversed-${idx}`,
          dedupeKey: `exp-date:${itemId}`,
          itemId,
          field: `experience[${idx}].endDate`,
          section: "Karier",
          severity: "error",
          message: `Pengalaman '${label}' memiliki tanggal mulai (${resolved.startYm}) lebih akhir dari selesai (${resolved.endYm}).`,
          suggestion: "Perbaiki urutan startDate/endDate atau centang 'Masih Berlangsung'.",
        });
      } else if (resolved.exclusionReason === "ambiguous_period") {
        rawIssues.push({
          id: `exp-period-ambiguous-${idx}`,
          dedupeKey: `exp-date:${itemId}`,
          itemId,
          field: `experience[${idx}].period`,
          section: "Karier",
          severity: "warning",
          message: `Periode '${exp.period}' pada '${label}' bersifat ambigu sehingga dikecualikan dari statistik durasi.`,
          suggestion: "Isi startDate (YYYY-MM) dan endDate secara eksplisit alih-alih menulis tahun saja.",
        });
      } else if (resolved.exclusionReason === "missing_dates") {
        rawIssues.push({
          id: `exp-date-missing-${idx}`,
          dedupeKey: `exp-date:${itemId}`,
          itemId,
          field: `experience[${idx}].startDate`,
          section: "Karier",
          severity: "warning",
          message: `Tanggal pengalaman '${label}' belum lengkap (${resolved.exclusionDetail}) sehingga tidak ikut dihitung.`,
          suggestion: "Isi startDate dan endDate (atau tandai masih aktif).",
        });
      } else if (resolved.exclusionReason === "future_start") {
        rawIssues.push({
          id: `exp-date-future-${idx}`,
          dedupeKey: `exp-date:${itemId}`,
          itemId,
          field: `experience[${idx}].startDate`,
          section: "Karier",
          severity: "warning",
          message: `Pengalaman '${label}' bertanggal mulai di masa depan (${resolved.startYm}) dan dikecualikan dari statistik saat ini.`,
          suggestion: "Jadikan draf jika peran belum dimulai, atau koreksi startDate.",
        });
      } else if (resolved.clampedFutureEnd) {
        rawIssues.push({
          id: `exp-date-future-end-${idx}`,
          dedupeKey: `exp-date-clamp:${itemId}`,
          itemId,
          field: `experience[${idx}].endDate`,
          section: "Karier",
          severity: "info",
          message: `Tanggal selesai '${label}' (${resolved.originalEndYm}) berada di masa depan; statistik membatasi durasi hingga bulan berjalan (${resolved.endYm}).`,
        });
      }
    }
  });

  // ===================== 5. ACHIEVEMENTS & CERTIFICATES =====================
  rawIssues.push(...auditCertificateVerificationIssues(config.certificates || []));

  // ===================== 6. SERVICES =====================
  const services = config.services || [];
  services.forEach((srv, idx) => {
    const itemId = typeof srv.id === "string" && srv.id ? srv.id : `service-${idx}`;
    if (!srv.titleId || !srv.titleId.trim()) {
      rawIssues.push({
        id: `srv-title-missing-${idx}`,
        itemId,
        field: `services[${idx}].titleId`,
        section: "Layanan",
        severity: "warning",
        message: `Layanan #${idx + 1} tidak memiliki judul bahasa Indonesia.`,
      });
    }
    if (!srv.descId || !srv.descId.trim()) {
      rawIssues.push({
        id: `srv-desc-missing-${idx}`,
        itemId,
        field: `services[${idx}].descId`,
        section: "Layanan",
        severity: "warning",
        message: `Deskripsi layanan '${srv.titleId || `#${idx + 1}`}' masih kosong.`,
      });
    }
  });

  // ===================== 7. TECH STACK =====================
  auditTechStackCategoryIssues(config.techStackCategories, config.techStack).forEach((issue) =>
    rawIssues.push(issue)
  );

  // ===================== 8. CV DOCUMENTS =====================
  auditCvDocumentIssues(config.cvDocs, config.cvSettings).forEach((issue) =>
    rawIssues.push(issue)
  );

  // ===================== 9. FAQ COLLECTION =====================
  const faq = config.faq || [];
  faq.forEach((item, idx) => {
    const itemId = typeof item.id === "string" && item.id ? item.id : `faq-${idx}`;
    if (!item.questionId || !item.questionId.trim()) {
      rawIssues.push({
        id: `faq-q-missing-${idx}`,
        itemId,
        field: `faq[${idx}].questionId`,
        section: "FAQ",
        severity: "error",
        message: `Pertanyaan FAQ #${idx + 1} kosong.`,
      });
    }
    if (!item.answerId || !item.answerId.trim()) {
      rawIssues.push({
        id: `faq-a-missing-${idx}`,
        itemId,
        field: `faq[${idx}].answerId`,
        section: "FAQ",
        severity: "error",
        message: `Jawaban FAQ #${idx + 1} kosong.`,
      });
    }
  });

  // ===================== 10. BLOG, NAVIGASI & SEO =====================
  if (config.blog?.visible !== false && config.blog?.published !== false) {
    if (config.blog?.sourceMode !== "manual" && config.blog?.feedUrl?.trim()) {
      const feedCheck = validatePublicFeedUrlSyntax(config.blog.feedUrl);
      if (!feedCheck.ok) {
        rawIssues.push({
          id: "blog-feed-url-unsafe",
          dedupeKey: "unsafe-url:blog.feedUrl",
          field: "blog.feedUrl",
          section: "Blog",
          severity: "error",
          message: feedCheck.errorMessage,
        });
      }
    }
    const blogSyncMeta = resolveBlogSyncMeta(config.blog);
    if (blogSyncMeta.sourceMode !== "manual" && blogSyncMeta.status === "error") {
      rawIssues.push({
        id: "blog-sync-failed",
        dedupeKey: "blog:sync-failed",
        field: "blog.feedUrl",
        section: "Blog",
        severity: "warning",
        message: blogSyncMeta.errorMessage
          ? `Sinkronisasi feed blog terakhir gagal: ${blogSyncMeta.errorMessage}`
          : "Sinkronisasi feed blog terakhir mengalami kegagalan.",
      });
    }
    (config.blog?.manualPosts || []).forEach((post, idx) => {
      const itemId = typeof post.id === "string" && post.id ? post.id : `blog-${idx}`;
      const missingTitle = !post.title?.trim();
      const unsafeUrl = !isSafeUrl(post.url);
      if (missingTitle || unsafeUrl) {
        rawIssues.push({
          id: `blog-post-invalid-${idx}`,
          dedupeKey:
            !missingTitle && unsafeUrl
              ? `unsafe-url:blog.manualPosts[${idx}].url`
              : `blog-post-invalid:${idx}`,
          itemId,
          field: `blog.manualPosts[${idx}]`,
          section: "Blog",
          severity: "error",
          message: `Artikel manual #${idx + 1} belum memiliki judul atau URL tidak valid.`,
        });
      }
    });
  }

  (config.navigation || []).forEach((nav, idx) => {
    if (!nav.href?.trim() || !isSafeUrl(nav.href)) {
      rawIssues.push({
        id: `nav-href-invalid-${idx}`,
        dedupeKey: `nav-href-invalid:${idx}`,
        ...(nav.id ? { itemId: nav.id } : {}),
        field: `navigation[${idx}].href`,
        section: "Navigasi",
        severity: "error",
        message: `Target navigasi '${nav.labelId || idx + 1}' tidak valid.`,
      });
    }
  });

  if (config.seo) {
    if (!config.seo.metaTitle || !config.seo.metaTitle.trim()) {
      rawIssues.push({
        id: "seo-title-missing",
        field: "seo.metaTitle",
        section: "SEO",
        severity: "warning",
        message: "Judul meta tag SEO halaman utama masih kosong.",
      });
    }
    if (!config.seo.metaDesc || !config.seo.metaDesc.trim()) {
      rawIssues.push({
        id: "seo-desc-missing",
        field: "seo.metaDesc",
        section: "SEO",
        severity: "warning",
        message: "Deskripsi meta tag SEO masih kosong.",
      });
    }
  }

  // Satukan temuan struktural & skema URL dari validator bersama
  const schemaValidation = validateSiteConfigStructured(config);
  rawIssues.push(...schemaValidation.issues);

  const issues = deduplicateHealthIssues(rawIssues);

  // Score Calculation (bobot tetap; skor bukan satu-satunya penentu publish)
  const errorsCount = issues.filter((i) => i.severity === "error").length;
  const warningsCount = issues.filter((i) => i.severity === "warning").length;
  const infosCount = issues.filter((i) => i.severity === "info").length;

  let score = 100 - errorsCount * 25 - warningsCount * 5 - infosCount * 1;
  score = Math.max(0, Math.min(100, score));

  const readinessStatus = resolveContentReadinessStatus({
    errorsCount,
    warningsCount,
    infosCount,
  });

  return {
    score,
    canPublish: errorsCount === 0,
    readinessStatus,
    isComplete: errorsCount === 0 && warningsCount === 0 && infosCount === 0,
    errorsCount,
    warningsCount,
    infosCount,
    issues,
    auditedAt: new Date().toISOString(),
  };
}

/**
 * Audit integritas master kategori Tech Stack serta kesesuaian ID kategori setiap alat.
 * Kategori yang benar-benar tidak dikenal dicatat sebagai `warning` (tidak memblokir publikasi)
 * agar tetap jatuh ke kelompok fallback yang jujur dan tidak dipaksa ke kategori lain.
 */
export function auditTechStackCategoryIssues(
  rawCategories: Array<Partial<TechStackCategoryConfig>> = [],
  techStack: Array<Partial<TechStackItem>> = []
): ContentHealthIssue[] {
  const issues: ContentHealthIssue[] = [];
  const seenKeys = new Set<string>();

  if (Array.isArray(rawCategories)) {
    rawCategories.forEach((cat, idx) => {
      if (!cat || typeof cat !== "object") return;
      const key = typeof cat.key === "string" ? cat.key.trim() : "";
      if (!key) {
        issues.push({
          id: `stack-cat-key-missing-${idx}`,
          dedupeKey: `stack-cat-key-missing:${idx}`,
          field: `techStackCategories[${idx}].key`,
          section: "Tech Stack",
          severity: "error",
          message: `Kategori tech stack #${idx + 1} belum memiliki ID key.`,
        });
        return;
      }

      const lower = key.toLowerCase();
      if (lower === TECH_STACK_FALLBACK_CATEGORY_KEY) {
        issues.push({
          id: `stack-cat-key-reserved-${idx}`,
          dedupeKey: `stack-cat-key-reserved:${idx}`,
          field: `techStackCategories[${idx}].key`,
          section: "Tech Stack",
          severity: "error",
          message: `ID kategori '${TECH_STACK_FALLBACK_CATEGORY_KEY}' dicadangkan untuk kategori fallback sistem.`,
        });
      } else if (seenKeys.has(lower)) {
        issues.push({
          id: `stack-cat-key-dup-${idx}`,
          dedupeKey: `stack-cat-key-dup:${idx}`,
          field: `techStackCategories[${idx}].key`,
          section: "Tech Stack",
          severity: "error",
          message: `ID kategori '${key}' duplikat pada master kategori Tech Stack.`,
        });
      }
      seenKeys.add(lower);

      const hasLabel =
        (typeof cat.labelId === "string" && Boolean(cat.labelId.trim())) ||
        (typeof cat.labelEn === "string" && Boolean(cat.labelEn.trim()));
      if (cat.visible !== false && !hasLabel) {
        issues.push({
          id: `stack-cat-label-missing-${idx}`,
          field: `techStackCategories[${idx}].labelId`,
          section: "Tech Stack",
          severity: "error",
          message: `Kategori tech stack '${key}' wajib memiliki label ID atau EN.`,
        });
      }
    });
  }

  const masterCategories = getTechStackCategoryMasterList(
    rawCategories as TechStackCategoryConfig[]
  );
  const fallbackLabel = getOtherToolsCategoryLabel("id");

  (techStack || []).forEach((tool, idx) => {
    const toolLabel = tool.name?.trim() || `#${idx + 1}`;
    const itemId = typeof tool.id === "string" && tool.id ? tool.id : `tech-${idx}`;
    if (!tool.name || !tool.name.trim()) {
      issues.push({
        id: `stack-tool-missing-${idx}`,
        itemId,
        field: `techStack[${idx}].name`,
        section: "Tech Stack",
        severity: "warning",
        message: `Alat/teknologi pada tech stack #${idx + 1} tidak memiliki nama.`,
      });
    }
    if (tool.icon && !isSafeUrl(tool.icon)) {
      issues.push({
        id: `stack-icon-unsafe-${idx}`,
        dedupeKey: `unsafe-url:techStack[${idx}].icon`,
        itemId,
        field: `techStack[${idx}].icon`,
        section: "Tech Stack",
        severity: "error",
        message: `URL ikon '${toolLabel}' menggunakan protokol yang tidak aman.`,
      });
    }
    if (tool.url && !isSafeUrl(tool.url)) {
      issues.push({
        id: `stack-url-unsafe-${idx}`,
        dedupeKey: `unsafe-url:techStack[${idx}].url`,
        itemId,
        field: `techStack[${idx}].url`,
        section: "Tech Stack",
        severity: "error",
        message: `Tautan '${toolLabel}' menggunakan protokol yang tidak aman.`,
      });
    }

    const match = resolveTechStackCategoryMatch(tool.category, masterCategories);
    if (match.resolutionType === "unknown") {
      issues.push({
        id: `stack-cat-unknown-${tool.id || idx}`,
        itemId,
        field: `techStack[${idx}].category`,
        section: "Tech Stack",
        severity: "warning",
        message: match.rawKey
          ? `Alat '${toolLabel}' memakai ID kategori tidak dikenal '${match.rawKey}' dan akan tampil di '${fallbackLabel}'.`
          : `Alat '${toolLabel}' belum memiliki ID kategori dan akan tampil di '${fallbackLabel}'.`,
      });
    } else if (match.resolutionType === "alias_migrated") {
      issues.push({
        id: `stack-cat-alias-${tool.id || idx}`,
        itemId,
        field: `techStack[${idx}].category`,
        section: "Tech Stack",
        severity: "info",
        message: `Alat '${toolLabel}' memakai ID lama '${match.rawKey}' yang dipetakan ke kategori '${match.resolvedKey}'.`,
      });
    }
  });

  return issues;
}

/**
 * Audit pemisahan sumber gambar identitas manusia (potret) vs aset kartu ID (Lanyard / About Persona).
 * Memastikan avatar potret tidak memakai desain kartu lengkap dan memberi peringatan non-blokir.
 */
export function auditIdentityImageIssues(
  config: Partial<SiteConfig>
): ContentHealthIssue[] {
  const issues: ContentHealthIssue[] = [];
  const sourceMap = getIdentityImageSourceMap(config);

  const urlFields: Array<{ field: string; section: string; url?: string; label: string }> = [
    {
      field: "generalProfile.avatarUrl",
      section: "Profil",
      url: config.generalProfile?.avatarUrl,
      label: "Foto Profil Global",
    },
    {
      field: "profileCard.avatarUrl",
      section: "Tampilan",
      url: config.profileCard?.avatarUrl,
      label: "Avatar Hologram Card",
    },
    {
      field: "profileCard.miniAvatarUrl",
      section: "Tampilan",
      url: config.profileCard?.miniAvatarUrl,
      label: "Avatar Mini Footer Hologram Card",
    },
    {
      field: "lanyard.frontImage",
      section: "Tampilan",
      url: config.lanyard?.frontImage,
      label: "Lanyard Sisi Depan",
    },
    {
      field: "lanyard.backImage",
      section: "Tampilan",
      url: config.lanyard?.backImage,
      label: "Lanyard Sisi Belakang",
    },
    {
      field: "generalProfile.aboutPersona.frontImage",
      section: "Profil",
      url: config.generalProfile?.aboutPersona?.frontImage,
      label: "Kartu Persona About Depan",
    },
    {
      field: "generalProfile.aboutPersona.backImage",
      section: "Profil",
      url: config.generalProfile?.aboutPersona?.backImage,
      label: "Kartu Persona About Belakang",
    },
  ];

  urlFields.forEach((entry, idx) => {
    if (entry.url && !isSafeUrl(entry.url)) {
      issues.push({
        id: `identity-unsafe-url-${idx}`,
        dedupeKey: `unsafe-url:${entry.field}`,
        field: entry.field,
        section: entry.section,
        severity: "error",
        message: `URL ${entry.label} mengandung protokol tidak aman.`,
      });
    }
  });

  if (sourceMap.globalPortrait.rejectedCardUrl) {
    issues.push({
      id: "identity-global-avatar-uses-card",
      field: "generalProfile.avatarUrl",
      section: "Profil",
      severity: "warning",
      message: `Foto profil global masih berisi desain ID card ('${sourceMap.globalPortrait.rejectedCardUrl}'). Situs publik otomatis menampilkan fallback potret '${sourceMap.globalPortrait.url}'.`,
      suggestion:
        "Ganti field Foto Profil Global ke potret wajah khusus (rasio 4:5, misal /profile.webp atau foto potret WebP minimal 600×750 px).",
    });
  } else if (sourceMap.globalPortrait.rejectedMissingUrl) {
    issues.push({
      id: "identity-global-avatar-missing-alias",
      field: "generalProfile.avatarUrl",
      section: "Profil",
      severity: "warning",
      message: `Foto profil global merujuk berkas '${LEGACY_MISSING_PORTRAIT_PLACEHOLDER}' yang tidak ada. Situs publik fallback ke '${sourceMap.globalPortrait.url}'.`,
      suggestion: "Ganti ke /profile.webp atau unggah foto potret WebP asli.",
    });
  } else if (sourceMap.globalPortrait.isRepoLowResPortrait) {
    issues.push({
      id: "identity-global-portrait-lowres",
      field: "generalProfile.avatarUrl",
      section: "Profil",
      severity: "info",
      message: `Potret profil global memakai berkas bawaan '/profile.webp' (203×250 px). Disarankan mengunggah potret beresolusi minimal 600×750 px (rasio 4:5) agar lebih tajam pada Hologram Card.`,
    });
  }

  const rawCardAvatar = config.profileCard?.avatarUrl?.trim() || "";
  if (rawCardAvatar) {
    if (isIdentityCardAssetUrl(rawCardAvatar, config)) {
      issues.push({
        id: "identity-hologram-avatar-uses-card",
        field: "profileCard.avatarUrl",
        section: "Tampilan",
        severity: "warning",
        message: `Avatar Hologram Card masih berisi desain ID card ('${rawCardAvatar}'). Situs publik otomatis fallback ke potret '${sourceMap.hologramAvatar.url}'.`,
        suggestion:
          "Kosongkan field ini agar mengikuti Foto Profil Global, atau unggah foto potret tersendiri (rasio 4:5).",
      });
    } else if (isMissingPortraitAliasUrl(rawCardAvatar)) {
      issues.push({
        id: "identity-hologram-avatar-missing-alias",
        field: "profileCard.avatarUrl",
        section: "Tampilan",
        severity: "warning",
        message: `Avatar Hologram Card merujuk '${LEGACY_MISSING_PORTRAIT_PLACEHOLDER}' yang tidak tersedia. Situs publik fallback ke '${sourceMap.hologramAvatar.url}'.`,
      });
    }
  }

  const rawMiniAvatar = config.profileCard?.miniAvatarUrl?.trim() || "";
  if (rawMiniAvatar) {
    if (isIdentityCardAssetUrl(rawMiniAvatar, config)) {
      issues.push({
        id: "identity-hologram-mini-uses-card",
        field: "profileCard.miniAvatarUrl",
        section: "Tampilan",
        severity: "warning",
        message: `Avatar kecil footer Hologram Card masih berisi aset ID card ('${rawMiniAvatar}'). Situs publik fallback ke '${sourceMap.hologramMiniAvatar.url}'.`,
        suggestion:
          "Kosongkan field ini agar otomatis memakai potret utama Hologram Card, atau gunakan foto close-up wajah 1:1.",
      });
    } else if (isMissingPortraitAliasUrl(rawMiniAvatar)) {
      issues.push({
        id: "identity-hologram-mini-missing-alias",
        field: "profileCard.miniAvatarUrl",
        section: "Tampilan",
        severity: "warning",
        message: `Avatar kecil Hologram Card merujuk '${LEGACY_MISSING_PORTRAIT_PLACEHOLDER}' yang tidak tersedia. Situs publik fallback ke '${sourceMap.hologramMiniAvatar.url}'.`,
      });
    }
  }

  return issues;
}

/**
 * Mengaudit konsistensi dokumen CV, izin URL, gambar preview lama, dan informasi CV gabungan.
 */
export function auditCvDocumentIssues(
  cvDocs?: CvDocConfig[],
  cvSettings?: Partial<CvSettingsConfig>
): ContentHealthIssue[] {
  const issues: ContentHealthIssue[] = [];
  const docs = Array.isArray(cvDocs) ? cvDocs : [];
  if (docs.length === 0) return issues;

  docs.forEach((doc, idx) => {
    const label = doc.title || doc.roleKey || `Peran #${idx + 1}`;
    const itemId = (typeof doc.id === "string" && doc.id) || (typeof doc.roleKey === "string" && doc.roleKey) || `cv-${idx}`;
    const rawPdf = typeof doc.pdfUrl === "string" ? doc.pdfUrl.trim() : "";

    if (!rawPdf) {
      issues.push({
        id: `cv-pdf-missing-${idx}`,
        itemId,
        field: `cvDocs[${idx}].pdfUrl`,
        section: "CV",
        severity: "warning",
        message: `Berkas PDF CV untuk peran '${label}' belum terpasang.`,
      });
    } else if (!isSafeCvAssetUrl(rawPdf, { allowDataPdf: true })) {
      issues.push({
        id: `cv-pdf-unsafe-${idx}`,
        dedupeKey: `unsafe-url:cvDocs[${idx}].pdfUrl`,
        itemId,
        field: `cvDocs[${idx}].pdfUrl`,
        section: "CV",
        severity: "error",
        message: `URL PDF CV untuk peran '${label}' mengandung protokol atau format yang tidak aman.`,
      });
    }

    if (doc.thumbnailUrl && !isSafeCvAssetUrl(doc.thumbnailUrl, { allowDataImage: true })) {
      issues.push({
        id: `cv-thumb-unsafe-${idx}`,
        dedupeKey: `unsafe-url:cvDocs[${idx}].thumbnailUrl`,
        itemId,
        field: `cvDocs[${idx}].thumbnailUrl`,
        section: "CV",
        severity: "error",
        message: `URL thumbnail CV untuk peran '${label}' tidak aman.`,
      });
    }

    const unsafePage = (doc.pages || []).find(
      (pg) => pg && !isSafeCvAssetUrl(pg, { allowDataImage: true })
    );
    if (unsafePage) {
      issues.push({
        id: `cv-page-unsafe-${idx}`,
        dedupeKey: `unsafe-url:cvDocs[${idx}].pages`,
        itemId,
        field: `cvDocs[${idx}].pages`,
        section: "CV",
        severity: "error",
        message: `Salah satu halaman preview CV untuk peran '${label}' memakai URL tidak aman.`,
      });
    }

    const resolved = resolveCvDocumentInfo(doc, docs, cvSettings);
    if (resolved.hasStaleLegacyPages) {
      issues.push({
        id: `cv-stale-pages-${idx}`,
        itemId,
        field: `cvDocs[${idx}].pages`,
        section: "CV",
        severity: "warning",
        message: `Peran '${label}' ${
          resolved.hasPdf ? "memakai berkas PDF baru" : "belum memiliki PDF"
        }, tetapi masih menyimpan halaman preview CV gabungan lama (${resolved.stalePageUrls.join(", ")}). Pratinjau publik otomatis menonaktifkan halaman lama tersebut.`,
        suggestion:
          "Kosongkan daftar halaman preview lama pada tab Kredensial & CV agar selaras dengan dokumen baru.",
      });
    }
  });

  const summary = summarizeCvCollection(docs, cvSettings);
  summary.sharedGroups.forEach((group, groupIdx) => {
    issues.push({
      id: `cv-shared-pdf-${groupIdx}`,
      field: "cvDocs",
      section: "CV",
      severity: "info",
      message: group.usesCombinedDefaultPdf
        ? `Peran (${group.titles.join(", ")}) menyajikan satu berkas CV gabungan bersama (${group.effectiveDownloadFilename}). Bila berkas PDF terpisah per peran sudah tersedia, unggah masing-masing pada tab Kredensial & CV.`
        : `Peran (${group.titles.join(", ")}) berbagi berkas PDF yang sama (${group.effectiveDownloadFilename}).`,
    });
  });

  return issues;
}
