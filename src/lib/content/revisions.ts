import crypto from "node:crypto";
import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import { evaluatePublishReadiness } from "@/lib/content/content-health";
import {
  deleteLocalCmsDoc,
  isLocalCmsOverrideAllowed,
  readLocalCmsDocDetailed,
  writeLocalCmsDoc,
} from "@/lib/content/local-cms-store";
import type {
  ContentHealthReport,
  RevisionCompatibilityResult,
  RevisionInspectSummary,
  RevisionsIndexItem,
} from "./types";

export type {
  RevisionsIndexItem,
  RevisionCompatibilityResult,
  RevisionInspectSummary,
};

export const REVISIONS_INDEX_ID = "revisions_index";
export const MAX_REVISIONS = 25;
export const CURRENT_CONFIG_SCHEMA_VERSION = 2;

export type RevisionProvider = "local-store" | "supabase";

export type DocReadOutcome<T = unknown> =
  | { status: "ok"; config: T; updatedAt?: string }
  | { status: "missing" }
  | { status: "error"; error: string };

export type DocWriteOutcome =
  | { ok: true; updatedAt: string }
  | { ok: false; error: string };

export interface RevisionStorageAdapter {
  provider: RevisionProvider;
  readDoc: <T = unknown>(id: string) => Promise<DocReadOutcome<T>>;
  writeDoc: (id: string, config: unknown, updatedAt?: string) => Promise<DocWriteOutcome>;
  deleteDoc: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

const VALID_REVISION_ID_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/;

export function validateRevisionIdFormat(revisionId: string): boolean {
  if (!revisionId || typeof revisionId !== "string") return false;
  if (revisionId.includes("..")) return false;
  return VALID_REVISION_ID_REGEX.test(revisionId);
}

export function shouldUseLocalRevisions(): boolean {
  if (!isSupabaseConfigured()) return isLocalCmsOverrideAllowed();
  if (process.env.LOCAL_CMS_STORE === "1") return isLocalCmsOverrideAllowed();
  if (!process.env.VERCEL && !getServiceRoleClient()) {
    return isLocalCmsOverrideAllowed();
  }
  return false;
}

function sanitizeDbErrorMessage(raw: string | undefined, fallback: string): string {
  const cleaned = String(raw || "")
    .replace(/https?:\/\/[^@\s]+@/gi, "https://[redacted]@")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? cleaned.slice(0, 200) : fallback;
}

export function createDefaultRevisionAdapter(): RevisionStorageAdapter {
  const useLocal = shouldUseLocalRevisions();

  if (useLocal) {
    return {
      provider: "local-store",
      async readDoc<T = unknown>(id: string): Promise<DocReadOutcome<T>> {
        const res = await readLocalCmsDocDetailed<T>(id);
        if (res.status === "missing") return { status: "missing" };
        if (res.status === "error") return { status: "error", error: res.error };
        return {
          status: "ok",
          config: res.doc.config,
          updatedAt: res.doc.updated_at,
        };
      },
      async writeDoc(id: string, config: unknown): Promise<DocWriteOutcome> {
        try {
          const saved = await writeLocalCmsDoc(id, config);
          return { ok: true, updatedAt: saved.updated_at };
        } catch (err) {
          const code = (err as NodeJS.ErrnoException)?.code;
          const msg = err instanceof Error ? err.message : "Gagal menulis ke penyimpanan lokal.";
          return {
            ok: false,
            error: sanitizeDbErrorMessage(
              code ? `${code}: ${msg}` : msg,
              "Gagal menulis dokumen ke penyimpanan lokal."
            ),
          };
        }
      },
      async deleteDoc(id: string) {
        const deleted = await deleteLocalCmsDoc(id);
        return { ok: deleted };
      },
    };
  }

  return {
    provider: "supabase",
    async readDoc<T = unknown>(id: string): Promise<DocReadOutcome<T>> {
      const supabase = getServiceRoleClient() || getSupabaseClient();
      if (!supabase) {
        return { status: "error", error: "Klien database Supabase tidak tersedia." };
      }
      try {
        const { data, error } = await supabase
          .from("site_config")
          .select("id, config, updated_at")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          return {
            status: "error",
            error: sanitizeDbErrorMessage(error.message, `Gagal membaca dokumen '${id}' dari database.`),
          };
        }
        if (!data || data.config === undefined || data.config === null) {
          return { status: "missing" };
        }
        return {
          status: "ok",
          config: data.config as T,
          updatedAt: typeof data.updated_at === "string" ? data.updated_at : undefined,
        };
      } catch (err) {
        return {
          status: "error",
          error: sanitizeDbErrorMessage(
            err instanceof Error ? err.message : undefined,
            `Kesalahan koneksi saat membaca dokumen '${id}'.`
          ),
        };
      }
    },
    async writeDoc(id: string, config: unknown, updatedAt?: string): Promise<DocWriteOutcome> {
      const supabase = getServiceRoleClient() || getSupabaseClient();
      if (!supabase) {
        return { ok: false, error: "Klien database Supabase tidak tersedia." };
      }
      const ts = updatedAt || new Date().toISOString();
      try {
        const { error } = await supabase.from("site_config").upsert(
          {
            id,
            config,
            updated_at: ts,
          },
          { onConflict: "id" }
        );
        if (error) {
          return {
            ok: false,
            error: sanitizeDbErrorMessage(error.message, `Gagal menyimpan dokumen '${id}' ke database.`),
          };
        }
        return { ok: true, updatedAt: ts };
      } catch (err) {
        return {
          ok: false,
          error: sanitizeDbErrorMessage(
            err instanceof Error ? err.message : undefined,
            `Kesalahan koneksi saat menyimpan dokumen '${id}'.`
          ),
        };
      }
    },
    async deleteDoc(id: string) {
      const supabase = getServiceRoleClient() || getSupabaseClient();
      if (!supabase) {
        return { ok: false, error: "Klien database Supabase tidak tersedia." };
      }
      try {
        const { error } = await supabase.from("site_config").delete().eq("id", id);
        if (error) {
          return {
            ok: false,
            error: sanitizeDbErrorMessage(error.message, `Gagal menghapus dokumen '${id}'.`),
          };
        }
        return { ok: true };
      } catch {
        return { ok: false, error: `Gagal menghapus dokumen '${id}'.` };
      }
    },
  };
}

function normalizeRevisionIndexEntries(rawList: unknown[]): RevisionsIndexItem[] {
  const valid: RevisionsIndexItem[] = [];
  for (const rawItem of rawList) {
    if (!rawItem || typeof rawItem !== "object") continue;
    const item = rawItem as Record<string, unknown>;
    if (typeof item.revisionId !== "string" || !item.revisionId.trim()) continue;
    const versionNum = Number(item.version);
    if (!Number.isFinite(versionNum) || versionNum < 1) continue;

    valid.push({
      revisionId: item.revisionId.trim(),
      version: Math.floor(versionNum),
      timestamp: typeof item.timestamp === "string" ? item.timestamp : "",
      editor: typeof item.editor === "string" && item.editor ? item.editor : "admin",
      summary: typeof item.summary === "string" && item.summary ? item.summary : `Versi #${versionNum}`,
      changesCount:
        typeof item.changesCount === "number" && Number.isFinite(item.changesCount)
          ? Math.max(0, Math.floor(item.changesCount))
          : 0,
      ...(typeof item.schemaVersion === "number" && Number.isFinite(item.schemaVersion)
        ? { schemaVersion: item.schemaVersion }
        : {}),
      ...(Array.isArray(item.changedSections)
        ? {
            changedSections: item.changedSections.filter(
              (s): s is string => typeof s === "string" && s.trim().length > 0
            ),
          }
        : {}),
    });
  }
  return valid;
}

function compareRevisionsDescending(a: RevisionsIndexItem, b: RevisionsIndexItem): number {
  if (b.version !== a.version) return b.version - a.version;
  const ta = Date.parse(a.timestamp) || 0;
  const tb = Date.parse(b.timestamp) || 0;
  return tb - ta;
}

/**
 * Mengurutkan riwayat revisi dari versi terbaru ke terlama, menghapus duplikasi ID,
 * dan memastikan pemangkasan hanya membuang revisi paling lama di luar batas MAX_REVISIONS.
 */
export function sortAndPruneRevisionHistory(
  existingHistory: RevisionsIndexItem[],
  incomingItems: RevisionsIndexItem | RevisionsIndexItem[],
  maxCount = MAX_REVISIONS
): {
  kept: RevisionsIndexItem[];
  prunedIds: string[];
  nextVersion: number;
} {
  const incomingList = Array.isArray(incomingItems) ? incomingItems : [incomingItems];
  const mergedMap = new Map<string, RevisionsIndexItem>();

  for (const item of [...incomingList, ...existingHistory]) {
    if (!item?.revisionId) continue;
    if (!mergedMap.has(item.revisionId)) {
      mergedMap.set(item.revisionId, item);
    }
  }

  const sorted = Array.from(mergedMap.values()).sort(compareRevisionsDescending);
  const safeMax = Math.max(1, maxCount);
  const kept = sorted.slice(0, safeMax);
  const keptIds = new Set(kept.map((r) => r.revisionId));
  const prunedIds = sorted
    .slice(safeMax)
    .map((r) => r.revisionId)
    .filter((id) => !keptIds.has(id));

  const highestVersion = kept.reduce((max, item) => Math.max(max, item.version || 0), 0);

  return {
    kept,
    prunedIds,
    nextVersion: highestVersion + 1,
  };
}

const SECTION_DIFF_RULES: Array<{ label: string; pick: (cfg: SiteConfig) => unknown }> = [
  {
    label: "Profil & Hero",
    pick: (c) => ({ profile: c.generalProfile, headerLogoUrl: c.headerLogoUrl }),
  },
  { label: "Statistik", pick: (c) => c.stats },
  { label: "Lanyard 3D", pick: (c) => c.lanyard },
  { label: "Kartu Profil", pick: (c) => c.profileCard },
  { label: "Proyek", pick: (c) => ({ items: c.projects, cats: c.projectCategories }) },
  { label: "Dokumen CV", pick: (c) => ({ docs: c.cvDocs, settings: c.cvSettings }) },
  { label: "Pendidikan", pick: (c) => c.education },
  { label: "Pengalaman", pick: (c) => c.experience },
  { label: "Prestasi", pick: (c) => c.achievements },
  { label: "Sertifikat", pick: (c) => c.certificates },
  { label: "Tech Stack", pick: (c) => ({ items: c.techStack, cats: c.techStackCategories }) },
  { label: "Layanan", pick: (c) => c.services },
  { label: "FAQ", pick: (c) => c.faq },
  { label: "Blog & Artikel", pick: (c) => c.blog },
  { label: "SEO", pick: (c) => c.seo },
  { label: "Seksi & Urutan", pick: (c) => ({ sections: c.sections, order: c.sectionOrder }) },
  { label: "Navigasi", pick: (c) => c.navigation },
  { label: "Footer & Kontak", pick: (c) => ({ footer: c.footer, contact: c.contactSection }) },
];

export function computeChangedSectionsSummary(
  prevConfig: SiteConfig | null | undefined,
  nextConfig: SiteConfig
): string[] {
  if (!prevConfig) return [];
  const changed: string[] = [];
  for (const rule of SECTION_DIFF_RULES) {
    try {
      if (JSON.stringify(rule.pick(prevConfig)) !== JSON.stringify(rule.pick(nextConfig))) {
        changed.push(rule.label);
      }
    } catch {
      changed.push(rule.label);
    }
  }
  return changed;
}

export function validateRevisionSnapshotCompatibility(rawSnapshot: unknown): {
  compatibility: RevisionCompatibilityResult;
  normalized: SiteConfig | null;
  health: ContentHealthReport | null;
} {
  if (!rawSnapshot || typeof rawSnapshot !== "object" || Array.isArray(rawSnapshot)) {
    return {
      compatibility: {
        compatible: false,
        legacyMigrated: false,
        rawSchemaVersion: null,
        targetSchemaVersion: CURRENT_CONFIG_SCHEMA_VERSION,
        errors: ["Snapshot revisi tidak berupa objek konfigurasi JSON yang valid."],
      },
      normalized: null,
      health: null,
    };
  }

  const rawObj = rawSnapshot as Record<string, unknown>;
  const errors: string[] = [];

  let rawSchemaVersion: number | null = null;
  if (rawObj.schemaVersion !== undefined && rawObj.schemaVersion !== null) {
    if (
      typeof rawObj.schemaVersion !== "number" ||
      !Number.isInteger(rawObj.schemaVersion) ||
      rawObj.schemaVersion < 1
    ) {
      errors.push("Nilai schemaVersion snapshot tidak valid.");
    } else {
      rawSchemaVersion = rawObj.schemaVersion;
      if (rawObj.schemaVersion > CURRENT_CONFIG_SCHEMA_VERSION) {
        errors.push(
          `Versi skema snapshot (v${rawObj.schemaVersion}) lebih baru daripada skema aplikasi saat ini (v${CURRENT_CONFIG_SCHEMA_VERSION}) dan tidak kompatibel.`
        );
      }
    }
  }

  const hasIdentitySection =
    rawObj.generalProfile !== undefined &&
    rawObj.generalProfile !== null &&
    typeof rawObj.generalProfile === "object" &&
    !Array.isArray(rawObj.generalProfile);
  const hasContentCollections =
    Array.isArray(rawObj.projects) ||
    Array.isArray(rawObj.certificates) ||
    Array.isArray(rawObj.cvDocs) ||
    rawObj.sections !== undefined;

  if (!hasIdentitySection || !hasContentCollections) {
    errors.push("Snapshot revisi tidak memuat struktur inti konfigurasi portofolio.");
  }

  const structuralValidation = validateSiteConfigPayload(rawSnapshot);
  if (!structuralValidation.isValid) {
    errors.push(...structuralValidation.errors);
  }

  if (errors.length > 0) {
    return {
      compatibility: {
        compatible: false,
        legacyMigrated: false,
        rawSchemaVersion,
        targetSchemaVersion: CURRENT_CONFIG_SCHEMA_VERSION,
        errors,
      },
      normalized: null,
      health: null,
    };
  }

  const normalized = normalizeConfig(rawSnapshot);
  const health = evaluatePublishReadiness(normalized, rawSnapshot);
  const legacyMigrated = rawSchemaVersion === null || rawSchemaVersion < CURRENT_CONFIG_SCHEMA_VERSION;

  return {
    compatibility: {
      compatible: true,
      legacyMigrated,
      rawSchemaVersion,
      targetSchemaVersion: CURRENT_CONFIG_SCHEMA_VERSION,
      errors: [],
    },
    normalized,
    health,
  };
}

export function buildRevisionInspectSummary(
  snapshotConfig: SiteConfig,
  activeConfig?: SiteConfig | null
): RevisionInspectSummary {
  const changedSectionsFromActive = computeChangedSectionsSummary(activeConfig, snapshotConfig);
  const projects = snapshotConfig.projects || [];
  return {
    projectsCount: projects.length,
    publishedProjectsCount: projects.filter((p) => p.published !== false && p.visible !== false).length,
    certificatesCount: (snapshotConfig.certificates || []).length,
    experienceCount: (snapshotConfig.experience || []).length,
    educationCount: (snapshotConfig.education || []).length,
    manualBlogCount: (snapshotConfig.blog?.manualPosts || []).length,
    changedSectionsFromActive,
    matchesActiveConfig: Boolean(activeConfig && changedSectionsFromActive.length === 0),
  };
}

export type RevisionHistoryReadResult =
  | {
      ok: true;
      status: "ok" | "empty";
      revisions: RevisionsIndexItem[];
      provider: RevisionProvider;
    }
  | {
      ok: false;
      status: "error";
      revisions: RevisionsIndexItem[];
      error: string;
      provider: RevisionProvider;
    };

/**
 * Membaca daftar indeks revisi secara jujur, membedakan "belum ada revisi"
 * dari kegagalan koneksi, izin akses, atau payload indeks yang rusak.
 */
export async function getRevisionHistoryDetailed(
  adapter: RevisionStorageAdapter = createDefaultRevisionAdapter()
): Promise<RevisionHistoryReadResult> {
  const readRes = await adapter.readDoc<unknown>(REVISIONS_INDEX_ID);

  if (readRes.status === "missing") {
    return {
      ok: true,
      status: "empty",
      revisions: [],
      provider: adapter.provider,
    };
  }

  if (readRes.status === "error") {
    return {
      ok: false,
      status: "error",
      revisions: [],
      error: readRes.error,
      provider: adapter.provider,
    };
  }

  if (!Array.isArray(readRes.config)) {
    return {
      ok: false,
      status: "error",
      revisions: [],
      error: "Struktur indeks riwayat revisi di penyimpanan tidak berbentuk array yang valid.",
      provider: adapter.provider,
    };
  }

  if (readRes.config.length === 0) {
    return {
      ok: true,
      status: "empty",
      revisions: [],
      provider: adapter.provider,
    };
  }

  const validItems = normalizeRevisionIndexEntries(readRes.config).sort(compareRevisionsDescending);
  if (validItems.length === 0) {
    return {
      ok: false,
      status: "error",
      revisions: [],
      error: "Seluruh entri indeks riwayat revisi tidak valid atau rusak.",
      provider: adapter.provider,
    };
  }

  return {
    ok: true,
    status: "ok",
    revisions: validItems,
    provider: adapter.provider,
  };
}

export async function getRevisionHistory(
  adapter?: RevisionStorageAdapter
): Promise<RevisionsIndexItem[]> {
  const res = await getRevisionHistoryDetailed(adapter);
  if (!res.ok) {
    throw new Error(res.error);
  }
  return res.revisions;
}

export type RevisionSnapshotReadResult =
  | {
      ok: true;
      revisionId: string;
      rawSnapshot: unknown;
      snapshot: SiteConfig;
      compatibility: RevisionCompatibilityResult;
      health: ContentHealthReport;
      updatedAt?: string;
    }
  | {
      ok: false;
      reason: "invalid_id" | "not_found" | "storage_error" | "incompatible";
      error: string;
      compatibility?: RevisionCompatibilityResult;
    };

export async function getRevisionSnapshotDetailed(
  revisionId: string,
  adapter: RevisionStorageAdapter = createDefaultRevisionAdapter()
): Promise<RevisionSnapshotReadResult> {
  if (!validateRevisionIdFormat(revisionId)) {
    return {
      ok: false,
      reason: "invalid_id",
      error: "Format revisionId tidak valid.",
    };
  }

  const readRes = await adapter.readDoc<unknown>(`rev_${revisionId}`);
  if (readRes.status === "missing") {
    return {
      ok: false,
      reason: "not_found",
      error: `Snapshot revisi '${revisionId}' tidak ditemukan.`,
    };
  }

  if (readRes.status === "error") {
    return {
      ok: false,
      reason: "storage_error",
      error: readRes.error,
    };
  }

  const checked = validateRevisionSnapshotCompatibility(readRes.config);
  if (!checked.compatibility.compatible || !checked.normalized || !checked.health) {
    return {
      ok: false,
      reason: "incompatible",
      error:
        checked.compatibility.errors[0] ||
        "Snapshot revisi tidak kompatibel dengan skema konfigurasi saat ini.",
      compatibility: checked.compatibility,
    };
  }

  return {
    ok: true,
    revisionId,
    rawSnapshot: readRes.config,
    snapshot: checked.normalized,
    compatibility: checked.compatibility,
    health: checked.health,
    updatedAt: readRes.updatedAt,
  };
}

export async function getRevisionSnapshot(revisionId: string): Promise<SiteConfig | null> {
  const res = await getRevisionSnapshotDetailed(revisionId);
  return res.ok ? res.snapshot : null;
}

function buildUniqueRevisionId(
  version: number,
  nowMs: number,
  existingIds: Set<string>
): string {
  const candidate = `v${version}-${nowMs}`;
  if (!existingIds.has(candidate)) {
    existingIds.add(candidate);
    return candidate;
  }
  const unique = `${candidate}-${crypto.randomUUID().slice(0, 4)}`;
  existingIds.add(unique);
  return unique;
}

export type AtomicPublishResult =
  | {
      success: true;
      provider: RevisionProvider;
      version: number;
      revisionId: string;
      updatedAt: string;
      baselineRevisionId?: string;
    }
  | {
      success: false;
      code:
        | "INDEX_READ_FAILED"
        | "CURRENT_READ_FAILED"
        | "REVISION_SNAPSHOT_WRITE_FAILED"
        | "REVISION_INDEX_WRITE_FAILED"
        | "CURRENT_WRITE_FAILED";
      error: string;
    };

/**
 * Mempublikasikan konfigurasi ke 'current' dan mencatat revisi secara terpadu agar tidak
 * menghasilkan keadaan setengah berhasil (jika pencatatan revisi gagal, 'current' dibatalkan).
 * Jika belum ada riwayat dan 'current' sudah eksis, snapshot baseline dicatat lebih dulu
 * agar versi sebelumnya tetap bisa dipulihkan.
 */
export async function publishConfigWithRevision(params: {
  config: SiteConfig;
  editor: string;
  summary: string;
  adapter?: RevisionStorageAdapter;
}): Promise<AtomicPublishResult> {
  const adapter = params.adapter ?? createDefaultRevisionAdapter();
  const normalized = normalizeConfig(params.config);
  const nowMs = Date.now();
  const timestamp = normalized.updatedAt || new Date(nowMs).toISOString();
  const editor = params.editor || "admin";

  // 1. Baca indeks revisi saat ini (jangan timpa produksi jika indeks gagal dibaca)
  const historyRes = await getRevisionHistoryDetailed(adapter);
  if (!historyRes.ok) {
    return {
      success: false,
      code: "INDEX_READ_FAILED",
      error: `Publikasi dibatalkan karena gagal membaca riwayat revisi: ${historyRes.error}`,
    };
  }
  const prevHistory = historyRes.revisions;

  // 2. Baca state 'current' sebelum ditimpa untuk dif & pengamanan baseline
  const prevCurrentRes = await adapter.readDoc<unknown>("current");
  if (prevCurrentRes.status === "error") {
    return {
      success: false,
      code: "CURRENT_READ_FAILED",
      error: `Publikasi dibatalkan karena gagal membaca konfigurasi aktif sebelumnya: ${prevCurrentRes.error}`,
    };
  }

  let prevCurrentNormalized: SiteConfig | null = null;
  if (prevCurrentRes.status === "ok" && prevCurrentRes.config && typeof prevCurrentRes.config === "object") {
    prevCurrentNormalized = normalizeConfig(prevCurrentRes.config);
  }

  const existingIds = new Set(prevHistory.map((item) => item.revisionId));
  let nextVersion =
    prevHistory.reduce((max, item) => Math.max(max, item.version || 0), 0) + 1;

  const createdDocIds: string[] = [];
  const incomingEntries: RevisionsIndexItem[] = [];
  let baselineRevisionId: string | undefined;

  // 3. Jika belum ada riwayat sama sekali tetapi produksi sudah memiliki 'current', simpan snapshot baseline
  if (prevHistory.length === 0 && prevCurrentNormalized) {
    const baselineTs = prevCurrentRes.status === "ok" && prevCurrentRes.updatedAt
      ? prevCurrentRes.updatedAt
      : timestamp;
    baselineRevisionId = buildUniqueRevisionId(nextVersion, Math.max(0, nowMs - 1), existingIds);
    const baselineItem: RevisionsIndexItem = {
      revisionId: baselineRevisionId,
      version: nextVersion,
      timestamp: baselineTs,
      editor: "system-baseline",
      summary: "Snapshot keadaan aktif sebelumnya (pra-publikasi)",
      changesCount:
        (prevCurrentNormalized.projects?.length || 0) +
        (prevCurrentNormalized.certificates?.length || 0),
      schemaVersion: prevCurrentNormalized.schemaVersion || CURRENT_CONFIG_SCHEMA_VERSION,
    };

    const baselineSnapRes = await adapter.writeDoc(
      `rev_${baselineRevisionId}`,
      prevCurrentNormalized,
      baselineTs
    );
    if (!baselineSnapRes.ok) {
      return {
        success: false,
        code: "REVISION_SNAPSHOT_WRITE_FAILED",
        error: `Publikasi dibatalkan: gagal menyimpan snapshot versi aktif sebelumnya (${baselineSnapRes.error}). Konfigurasi produksi tidak diubah.`,
      };
    }

    createdDocIds.push(`rev_${baselineRevisionId}`);
    incomingEntries.push(baselineItem);
    nextVersion += 1;
  }

  // 4. Tulis snapshot revisi baru TERLEBIH DAHULU sebelum menyentuh indeks maupun 'current'
  const newRevisionId = buildUniqueRevisionId(nextVersion, nowMs, existingIds);
  const changedSections = computeChangedSectionsSummary(prevCurrentNormalized, normalized);
  const newEntry: RevisionsIndexItem = {
    revisionId: newRevisionId,
    version: nextVersion,
    timestamp,
    editor,
    summary: params.summary || `Publikasi Versi #${nextVersion}`,
    changesCount:
      (normalized.projects?.length || 0) + (normalized.certificates?.length || 0),
    schemaVersion: normalized.schemaVersion || CURRENT_CONFIG_SCHEMA_VERSION,
    ...(prevCurrentNormalized ? { changedSections } : {}),
  };

  const snapWrite = await adapter.writeDoc(`rev_${newRevisionId}`, normalized, timestamp);
  if (!snapWrite.ok) {
    for (const id of createdDocIds) {
      await adapter.deleteDoc(id);
    }
    return {
      success: false,
      code: "REVISION_SNAPSHOT_WRITE_FAILED",
      error: `Publikasi dibatalkan karena snapshot revisi gagal disimpan (${snapWrite.error}). Konfigurasi produksi tidak diubah.`,
    };
  }
  createdDocIds.push(`rev_${newRevisionId}`);

  // 5. Urutkan & pangkas secara aman lalu tulis indeks revisi
  const { kept, prunedIds } = sortAndPruneRevisionHistory(
    prevHistory,
    incomingEntries.concat([newEntry]),
    MAX_REVISIONS
  );

  const indexWrite = await adapter.writeDoc(REVISIONS_INDEX_ID, kept, timestamp);
  if (!indexWrite.ok) {
    for (const id of createdDocIds) {
      await adapter.deleteDoc(id);
    }
    return {
      success: false,
      code: "REVISION_INDEX_WRITE_FAILED",
      error: `Publikasi dibatalkan karena indeks riwayat revisi gagal diperbarui (${indexWrite.error}). Konfigurasi produksi tidak diubah.`,
    };
  }

  // 6. Tulis 'current' ke penyimpanan; batalkan perubahan indeks jika penulisan 'current' gagal
  const currentWrite = await adapter.writeDoc("current", normalized, timestamp);
  if (!currentWrite.ok) {
    if (prevHistory.length > 0) {
      await adapter.writeDoc(REVISIONS_INDEX_ID, prevHistory);
    } else {
      await adapter.deleteDoc(REVISIONS_INDEX_ID);
    }
    for (const id of createdDocIds) {
      await adapter.deleteDoc(id);
    }
    return {
      success: false,
      code: "CURRENT_WRITE_FAILED",
      error: `Gagal mempublikasikan konfigurasi ke situs aktif (${currentWrite.error}); pencatatan revisi dibatalkan.`,
    };
  }

  // 7. Bersihkan 'draft' & snapshot kedaluwarsa (hanya yang terlempar dari kept!)
  await adapter.deleteDoc("draft");
  const keptSet = new Set(kept.map((r) => r.revisionId));
  for (const oldId of prunedIds) {
    if (!keptSet.has(oldId)) {
      await adapter.deleteDoc(`rev_${oldId}`);
    }
  }

  return {
    success: true,
    provider: adapter.provider,
    version: nextVersion,
    revisionId: newRevisionId,
    updatedAt: currentWrite.updatedAt,
    ...(baselineRevisionId ? { baselineRevisionId } : {}),
  };
}

/**
 * Helper kompatibilitas bila diperlukan pencatatan revisi terpisah.
 * Mengembalikan status kegagalan eksplisit tanpa menelan error database.
 */
export async function recordNewRevision(
  config: SiteConfig,
  editor: string,
  summary: string,
  adapter: RevisionStorageAdapter = createDefaultRevisionAdapter()
): Promise<{ success: boolean; version: number; revisionId: string; error?: string }> {
  const historyRes = await getRevisionHistoryDetailed(adapter);
  if (!historyRes.ok) {
    return { success: false, version: 0, revisionId: "", error: historyRes.error };
  }

  const history = historyRes.revisions;
  const highestVersion = history.reduce((max, r) => Math.max(max, r.version || 0), 0);
  const nextVersion = highestVersion + 1;
  const timestamp = new Date().toISOString();
  const existingIds = new Set(history.map((r) => r.revisionId));
  const revisionId = buildUniqueRevisionId(nextVersion, Date.now(), existingIds);
  const normalized = normalizeConfig(config);

  const indexItem: RevisionsIndexItem = {
    revisionId,
    version: nextVersion,
    timestamp,
    editor: editor || "admin",
    summary: summary || `Publikasi Versi #${nextVersion}`,
    changesCount: (normalized.projects?.length || 0) + (normalized.certificates?.length || 0),
    schemaVersion: normalized.schemaVersion || CURRENT_CONFIG_SCHEMA_VERSION,
  };

  const snapRes = await adapter.writeDoc(`rev_${revisionId}`, normalized, timestamp);
  if (!snapRes.ok) {
    return { success: false, version: nextVersion, revisionId, error: snapRes.error };
  }

  const { kept, prunedIds } = sortAndPruneRevisionHistory(history, indexItem, MAX_REVISIONS);
  const idxRes = await adapter.writeDoc(REVISIONS_INDEX_ID, kept, timestamp);
  if (!idxRes.ok) {
    await adapter.deleteDoc(`rev_${revisionId}`);
    return { success: false, version: nextVersion, revisionId, error: idxRes.error };
  }

  const keptSet = new Set(kept.map((r) => r.revisionId));
  for (const oldId of prunedIds) {
    if (!keptSet.has(oldId)) {
      await adapter.deleteDoc(`rev_${oldId}`);
    }
  }

  return { success: true, version: nextVersion, revisionId };
}
