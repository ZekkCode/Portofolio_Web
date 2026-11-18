import { getSupabaseClient, getServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeConfig, defaultSiteConfig, type SiteConfig } from "@/lib/site-config";
import {
  isStrictLocalCmsStore,
  readLocalCmsDoc,
} from "@/lib/content/local-cms-store";
import { shouldUseLocalRevisions } from "@/lib/content/revisions";

type PublishedContentCache = {
  snapshot: SiteConfig | null;
  updatedAt: string | undefined;
  timestamp: number;
};

const GLOBAL_CACHE_KEY = "__zekkPublishedContentCache" as const;
const MEMORY_TTL_MS = 15 * 1000;

function getPublishedCache(): PublishedContentCache {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_CACHE_KEY]?: PublishedContentCache;
  };
  if (!g[GLOBAL_CACHE_KEY]) {
    g[GLOBAL_CACHE_KEY] = {
      snapshot: null,
      updatedAt: undefined,
      timestamp: 0,
    };
  }
  return g[GLOBAL_CACHE_KEY];
}

export async function fetchPublishedContentWithMeta(options?: {
  bypassCache?: boolean;
}): Promise<{
  config: SiteConfig;
  updatedAt?: string;
  provider: "local-store" | "supabase" | "default";
}> {
  const cache = getPublishedCache();
  const now = Date.now();
  const useLocalStore = shouldUseLocalRevisions();
  if (!options?.bypassCache && cache.snapshot && now - cache.timestamp < MEMORY_TTL_MS) {
    return {
      config: cache.snapshot,
      updatedAt: cache.updatedAt,
      provider: useLocalStore ? "local-store" : "supabase",
    };
  }

  // Gunakan penyimpan lokal hanya jika mode local store memang aktif (konsisten dengan /api/config)
  if (useLocalStore) {
    const localDoc = await readLocalCmsDoc<Partial<SiteConfig>>("current");
    if (localDoc?.config) {
      cache.snapshot = normalizeConfig(localDoc.config);
      cache.updatedAt = localDoc.updated_at;
      cache.timestamp = now;
      return {
        config: cache.snapshot,
        updatedAt: localDoc.updated_at,
        provider: "local-store",
      };
    }
  }

  if (!isSupabaseConfigured() || isStrictLocalCmsStore()) {
    return {
      config: defaultSiteConfig,
      provider: "default",
    };
  }

  try {
    const supabase = getServiceRoleClient() || getSupabaseClient();
    if (!supabase) {
      return { config: defaultSiteConfig, provider: "default" };
    }

    const { data, error } = await supabase
      .from("site_config")
      .select("config, updated_at")
      .eq("id", "current")
      .maybeSingle();

    if (error || !data || !data.config) {
      const { data: mainData } = await supabase
        .from("site_config")
        .select("config, updated_at")
        .eq("id", "main")
        .maybeSingle();

      if (mainData?.config) {
        cache.snapshot = normalizeConfig(mainData.config as Partial<SiteConfig>);
        cache.updatedAt = mainData.updated_at;
        cache.timestamp = now;
        return {
          config: cache.snapshot,
          updatedAt: mainData.updated_at,
          provider: "supabase",
        };
      }

      return { config: defaultSiteConfig, provider: "default" };
    }

    cache.snapshot = normalizeConfig(data.config as Partial<SiteConfig>);
    cache.updatedAt = data.updated_at;
    cache.timestamp = now;
    return {
      config: cache.snapshot,
      updatedAt: data.updated_at,
      provider: "supabase",
    };
  } catch {
    return { config: defaultSiteConfig, provider: "default" };
  }
}

/**
 * Mengambil konfigurasi konten terpublikasi (Published Only) dari storage aktif.
 * Digunakan oleh Server Components (layout.tsx, page.tsx, sitemap, SEO) dan API routes.
 */
export async function fetchPublishedContent(): Promise<SiteConfig> {
  const res = await fetchPublishedContentWithMeta();
  return res.config;
}

/**
 * Mengambil konfigurasi terpublikasi dengan batas waktu cepat untuk endpoint crawler (/robots.txt)
 * agar cold-start database tidak pernah memicu timeout pada Googlebot atau Lighthouse.
 */
export async function fetchPublishedContentFast(timeoutMs = 250): Promise<SiteConfig> {
  const cache = getPublishedCache();
  if (cache.snapshot) {
    if (Date.now() - cache.timestamp >= MEMORY_TTL_MS) {
      void fetchPublishedContentWithMeta().catch(() => {});
    }
    return cache.snapshot;
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const raced = await Promise.race([
      fetchPublishedContentWithMeta().then((res) => res.config),
      new Promise<SiteConfig>((resolve) => {
        timer = setTimeout(() => resolve(cache.snapshot ?? defaultSiteConfig), timeoutMs);
      }),
    ]);
    return raced;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Mengambil konfigurasi Draf (untuk halaman /admin/preview terotentikasi).
 * Jika draf belum ada, fallback ke konten terpublikasi saat ini.
 */
export async function fetchDraftOrPublishedContent(): Promise<{
  config: SiteConfig;
  isDraft: boolean;
  updatedAt?: string;
  publishedUpdatedAt?: string;
}> {
  const published = await fetchPublishedContentWithMeta({ bypassCache: true });

  if (shouldUseLocalRevisions()) {
    const localDraft = await readLocalCmsDoc<Partial<SiteConfig>>("draft");
    if (localDraft?.config) {
      return {
        config: normalizeConfig(localDraft.config),
        isDraft: true,
        updatedAt: localDraft.updated_at,
        publishedUpdatedAt: published.updatedAt,
      };
    }
  }

  if (isSupabaseConfigured() && !isStrictLocalCmsStore()) {
    try {
      const supabase =
        getServiceRoleClient() ||
        (await createServerSupabaseClient().catch(() => null)) ||
        getSupabaseClient();
      if (supabase) {
        const { data } = await supabase
          .from("site_config")
          .select("config, updated_at")
          .eq("id", "draft")
          .maybeSingle();

        if (data?.config) {
          return {
            config: normalizeConfig(data.config as Partial<SiteConfig>),
            isDraft: true,
            updatedAt: data.updated_at,
            publishedUpdatedAt: published.updatedAt,
          };
        }
      }
    } catch {
      // Fallback cleanly to published
    }
  }

  return {
    config: published.config,
    isDraft: false,
    updatedAt: published.updatedAt,
    publishedUpdatedAt: published.updatedAt,
  };
}

/**
 * Invalidate server memory cache saat admin mempublikasikan perubahan baru.
 */
export function invalidatePublishedContentCache() {
  const cache = getPublishedCache();
  cache.snapshot = null;
  cache.updatedAt = undefined;
  cache.timestamp = 0;
}
