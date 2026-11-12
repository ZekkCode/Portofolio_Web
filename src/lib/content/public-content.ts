import { getSupabaseClient, getServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, defaultSiteConfig, type SiteConfig } from "@/lib/site-config";

let memorySnapshot: SiteConfig | null = null;
let memoryTimestamp = 0;
const MEMORY_TTL_MS = 60 * 1000; // 1 minute in-memory cache on server

/**
 * Mengambil konfigurasi konten terpublikasi (Published Only) dari Supabase Cloud.
 * Digunakan oleh Server Components (layout.tsx, sitemap, SEO) dan API routes.
 */
export async function fetchPublishedContent(): Promise<SiteConfig> {
  const now = Date.now();
  if (memorySnapshot && now - memoryTimestamp < MEMORY_TTL_MS) {
    return memorySnapshot;
  }

  if (!isSupabaseConfigured()) {
    return defaultSiteConfig;
  }

  try {
    const supabase = getServiceRoleClient() || getSupabaseClient();
    if (!supabase) return defaultSiteConfig;

    const { data, error } = await supabase
      .from("site_config")
      .select("config, updated_at")
      .eq("id", "current")
      .maybeSingle();

    if (error || !data || !data.config) {
      // Coba fallback ke 'main' jika 'current' belum ada
      const { data: mainData } = await supabase
        .from("site_config")
        .select("config, updated_at")
        .eq("id", "main")
        .maybeSingle();

      if (mainData?.config) {
        memorySnapshot = normalizeConfig(mainData.config as Partial<SiteConfig>);
        memoryTimestamp = now;
        return memorySnapshot;
      }

      return defaultSiteConfig;
    }

    memorySnapshot = normalizeConfig(data.config as Partial<SiteConfig>);
    memoryTimestamp = now;
    return memorySnapshot;
  } catch {
    return defaultSiteConfig;
  }
}

/**
 * Invalidate server memory cache saat admin mempublikasikan perubahan baru.
 */
export function invalidatePublishedContentCache() {
  memorySnapshot = null;
  memoryTimestamp = 0;
}
