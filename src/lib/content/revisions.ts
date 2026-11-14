import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";
import {
  isLocalCmsOverrideAllowed,
  readLocalCmsDoc,
  writeLocalCmsDoc,
} from "@/lib/content/local-cms-store";

import type { RevisionsIndexItem } from "./types";

export type { RevisionsIndexItem };

const REVISIONS_INDEX_ID = "revisions_index";
const MAX_REVISIONS = 25;

function shouldUseLocalRevisions(): boolean {
  if (!isSupabaseConfigured()) return isLocalCmsOverrideAllowed();
  if (process.env.LOCAL_CMS_STORE === "1") return isLocalCmsOverrideAllowed();
  if (!process.env.VERCEL && !getServiceRoleClient()) {
    return isLocalCmsOverrideAllowed();
  }
  return false;
}

export async function getRevisionHistory(): Promise<RevisionsIndexItem[]> {
  if (isLocalCmsOverrideAllowed()) {
    const localIdx = await readLocalCmsDoc<RevisionsIndexItem[]>(REVISIONS_INDEX_ID);
    if (localIdx && Array.isArray(localIdx.config)) {
      return localIdx.config;
    }
  }

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

export async function getRevisionSnapshot(revisionId: string): Promise<SiteConfig | null> {
  if (isLocalCmsOverrideAllowed()) {
    const localSnap = await readLocalCmsDoc<Partial<SiteConfig>>(`rev_${revisionId}`);
    if (localSnap?.config) {
      return normalizeConfig(localSnap.config);
    }
  }

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

export async function recordNewRevision(
  config: SiteConfig,
  editor: string,
  summary: string
): Promise<{ success: boolean; version: number; revisionId: string }> {
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

  if (shouldUseLocalRevisions()) {
    await writeLocalCmsDoc(`rev_${revisionId}`, config);
    await writeLocalCmsDoc(REVISIONS_INDEX_ID, newHistory);
    return { success: true, version: nextVersion, revisionId };
  }

  if (!isSupabaseConfigured()) {
    return { success: true, version: nextVersion, revisionId };
  }

  const supabase = getServiceRoleClient() || getSupabaseClient();
  if (!supabase) {
    return { success: false, version: 1, revisionId: "" };
  }

  try {
    const { error: snapErr } = await supabase.from("site_config").upsert({
      id: `rev_${revisionId}`,
      config,
      updated_at: timestamp,
    });

    if (snapErr && isLocalCmsOverrideAllowed()) {
      await writeLocalCmsDoc(`rev_${revisionId}`, config);
      await writeLocalCmsDoc(REVISIONS_INDEX_ID, newHistory);
      return { success: true, version: nextVersion, revisionId };
    }

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
