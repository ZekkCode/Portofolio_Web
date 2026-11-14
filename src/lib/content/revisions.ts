import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";

const REVISIONS_INDEX_ID = "revisions_index";
const MAX_REVISIONS = 25;

export interface RevisionsIndexItem {
  revisionId: string;
  version: number;
  timestamp: string;
  editor: string;
  summary: string;
  changesCount: number;
}

/**
 * Mengambil daftar riwayat revisi yang tersimpan di Supabase
 */
export async function getRevisionHistory(): Promise<RevisionsIndexItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = getServiceRoleClient() || getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("site_config")
      .select("config")
      .eq("id", REVISIONS_INDEX_ID)
      .maybeSingle();

    if (error || !data || !Array.isArray(data.config)) return [];
    return data.config as RevisionsIndexItem[];
  } catch {
    return [];
  }
}

/**
 * Mengambil detail snapshot lengkap dari satu revisi tertentu
 */
export async function getRevisionSnapshot(revisionId: string): Promise<SiteConfig | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getServiceRoleClient() || getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("site_config")
      .select("config")
      .eq("id", `rev_${revisionId}`)
      .maybeSingle();

    if (error || !data || !data.config) return null;
    return normalizeConfig(data.config as Partial<SiteConfig>);
  } catch {
    return null;
  }
}

/**
 * Menyimpan snapshot revisi baru saat admin melakukan publikasi
 */
export async function recordNewRevision(
  config: SiteConfig,
  editor: string,
  summary: string
): Promise<{ success: boolean; version: number; revisionId: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, version: 1, revisionId: "local-" + Date.now() };
  }

  const supabase = getServiceRoleClient() || getSupabaseClient();
  if (!supabase) {
    return { success: false, version: 1, revisionId: "" };
  }

  const history = await getRevisionHistory();
  const latestVersion = history.length > 0 ? history[0].version : 0;
  const nextVersion = latestVersion + 1;
  const timestamp = new Date().toISOString();
  const revisionId = `v${nextVersion}-${Date.now()}`;

  const indexItem: RevisionsIndexItem = {
    revisionId,
    version: nextVersion,
    timestamp,
    editor: editor || "admin",
    summary: summary || `Publikasi Versi #${nextVersion}`,
    changesCount: (config.projects?.length || 0) + (config.certificates?.length || 0),
  };

  const newHistory = [indexItem, ...history].slice(0, MAX_REVISIONS);

  try {
    // 1. Simpan snapshot data lengkap revisi
    await supabase.from("site_config").upsert({
      id: `rev_${revisionId}`,
      config,
      updated_at: timestamp,
    });

    // 2. Perbarui indeks daftar riwayat revisi
    await supabase.from("site_config").upsert({
      id: REVISIONS_INDEX_ID,
      config: newHistory,
      updated_at: timestamp,
    });

    return { success: true, version: nextVersion, revisionId };
  } catch {
    return { success: false, version: nextVersion, revisionId };
  }
}
