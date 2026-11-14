import { getSupabaseClient, getServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, defaultSiteConfig, type SiteConfig } from "@/lib/site-config";
import {
  isLocalCmsOverrideAllowed,
  readLocalCmsDoc,
} from "@/lib/content/local-cms-store";

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

export async function fetchPublishedContentWithMeta(): Promise<{
  config: SiteConfig;
  updatedAt?: string;
  provider: "local-store" | "supabase" | "default";
}> {
  const cache = getPublishedCache();
  const now = Date.now();
  if (cache.snapshot && now - cache.timestamp < MEMORY_TTL_MS) {
    return {
      config: cache.snapshot,
      updatedAt: cache.updatedAt,
      provider: isLocalCmsOverrideAllowed() ? "local-store" : "supabase",
    };
  }

  // Prefer local override store in non-Vercel local mode if written
  if (isLocalCmsOverrideAllowed()) {
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

  if (!isSupabaseConfigured()) {
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
 * Mengambil konfigurasi Draf (untuk halaman /admin/preview terotentikasi).
 * Jika draf belum ada, fallback ke konten terpublikasi saat ini.
 */
export async function fetchDraftOrPublishedContent(): Promise<{
  config: SiteConfig;
  isDraft: boolean;
  updatedAt?: string;
}> {
  if (isLocalCmsOverrideAllowed()) {
    const localDraft = await readLocalCmsDoc<Partial<SiteConfig>>("draft");
    if (localDraft?.config) {
      return {
        config: normalizeConfig(localDraft.config),
        isDraft: true,
        updatedAt: localDraft.updated_at,
      };
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = getServiceRoleClient() || getSupabaseClient();
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
          };
        }
      }
    } catch {
      // Fallback cleanly to published
    }
  }

  const published = await fetchPublishedContentWithMeta();
  return {
    config: published.config,
    isDraft: false,
    updatedAt: published.updatedAt,
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
