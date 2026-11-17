import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import {
  evaluatePublishReadiness,
  getContentReadinessSummary,
} from "@/lib/content/content-health";
import {
  publishConfigWithRevision,
  shouldUseLocalRevisions,
} from "@/lib/content/revisions";
import {
  invalidatePublishedContentCache,
  fetchPublishedContentWithMeta,
} from "@/lib/content/public-content";
import { toPublicSiteConfig } from "@/lib/content/public-config-sanitizer";
import { triggerIndexNowIfConfigured } from "@/lib/indexnow";
import {
  isStrictLocalCmsStore,
  readLocalCmsDoc,
  writeLocalCmsDoc,
} from "@/lib/content/local-cms-store";

const PUBLISHED_CACHE_HEADER = "public, max-age=0, must-revalidate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  // 1. Jika mode = 'draft', wajib autentikasi admin
  if (mode === "draft") {
    const auth = await verifyAdminRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: "Akses ditolak: Draf hanya dapat dibaca oleh administrator." },
        { status: 401 }
      );
    }

    const useLocalStore = shouldUseLocalRevisions();

    // Gunakan sumber tunggal yang sama dengan operasi tulis (local-store vs Supabase)
    if (useLocalStore) {
      const localDraft = await readLocalCmsDoc<Partial<SiteConfig>>("draft");
      if (localDraft?.config) {
        return NextResponse.json(
          {
            configured: true,
            provider: "local-store",
            mode: "draft",
            config: normalizeConfig(localDraft.config),
            updatedAt: localDraft.updated_at,
          },
          {
            headers: {
              "Cache-Control": "private, no-cache, no-store, must-revalidate",
            },
          }
        );
      }
    } else if (isSupabaseConfigured() && !isStrictLocalCmsStore()) {
      try {
        const supabase = getServiceRoleClient() || getSupabaseClient();
        if (supabase) {
          const { data: draftData } = await supabase
            .from("site_config")
            .select("config, updated_at")
            .eq("id", "draft")
            .maybeSingle();

          if (draftData?.config) {
            return NextResponse.json(
              {
                configured: true,
                provider: "supabase",
                mode: "draft",
                config: normalizeConfig(draftData.config as Partial<SiteConfig>),
                updatedAt: draftData.updated_at,
              },
              {
                headers: {
                  "Cache-Control": "private, no-cache, no-store, must-revalidate",
                },
              }
            );
          }
        }
      } catch {
        // Fallback to published state below
      }
    }
  }

  // 2. Mode 'published' (admin menerima snapshot utuh dengan Cache-Control private; publik disanitasi via toPublicSiteConfig)
  const viewerAuth = await verifyAdminRequest(request);
  const isAdminViewer = viewerAuth.isAuthenticated;
  const responseCacheHeader = isAdminViewer
    ? "private, no-cache, no-store, must-revalidate"
    : PUBLISHED_CACHE_HEADER;

  if (shouldUseLocalRevisions()) {
    const localCurrent = await readLocalCmsDoc<Partial<SiteConfig>>("current");
    if (localCurrent?.config) {
      const normalized = normalizeConfig(localCurrent.config);
      const outputConfig = isAdminViewer ? normalized : toPublicSiteConfig(normalized);
      const etag = `"${Buffer.from(`${localCurrent.updated_at || "local"}:${isAdminViewer ? "adm" : "pub"}`).toString("base64")}"`;
      const ifNoneMatch = request.headers.get("if-none-match");
      if (!isAdminViewer && ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
        return new NextResponse(null, {
          status: 304,
          headers: { ETag: etag, "Cache-Control": responseCacheHeader, Vary: "Cookie" },
        });
      }
      return NextResponse.json(
        {
          configured: true,
          provider: "local-store",
          mode: "published",
          config: outputConfig,
          updatedAt: localCurrent.updated_at,
        },
        {
          headers: { ETag: etag, "Cache-Control": responseCacheHeader, Vary: "Cookie" },
        }
      );
    }
  }

  if (!isSupabaseConfigured() || isStrictLocalCmsStore()) {
    const etag = '"local-unconfigured"';
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": PUBLISHED_CACHE_HEADER },
      });
    }
    return NextResponse.json(
      {
        configured: false,
        provider: "local",
        config: null,
      },
      {
        headers: { ETag: etag, "Cache-Control": PUBLISHED_CACHE_HEADER },
      }
    );
  }

  try {
    const supabase = getServiceRoleClient() || getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ configured: false, config: null });
    }

    const { data: initialData, error } = await supabase
      .from("site_config")
      .select("config, updated_at")
      .eq("id", "current")
      .maybeSingle();

    let data = initialData;
    if (!error && (!data || !data.config)) {
      const { data: mainData, error: mainErr } = await supabase
        .from("site_config")
        .select("config, updated_at")
        .eq("id", "main")
        .maybeSingle();
      if (!mainErr && mainData?.config) {
        data = mainData;
      }
    }

    if (error) {
      return NextResponse.json(
        { configured: true, error: "Gagal membaca konfigurasi database", config: null },
        { status: 500 }
      );
    }

    if (!data || !data.config) {
      const etag = '"no-cloud-config"';
      return NextResponse.json(
        {
          configured: true,
          config: null,
          message: "Belum ada konfigurasi tersimpan di cloud",
        },
        {
          headers: { ETag: etag, "Cache-Control": PUBLISHED_CACHE_HEADER },
        }
      );
    }

    const normalized = normalizeConfig(data.config as Partial<SiteConfig>);
    const outputConfig = isAdminViewer ? normalized : toPublicSiteConfig(normalized);
    const etag = `"${Buffer.from(`${data.updated_at || "initial"}:${isAdminViewer ? "adm" : "pub"}`).toString("base64")}"`;
    const ifNoneMatch = request.headers.get("if-none-match");
    if (!isAdminViewer && ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": responseCacheHeader, Vary: "Cookie" },
      });
    }

    return NextResponse.json(
      {
        configured: true,
        provider: "supabase",
        mode: "published",
        config: outputConfig,
        updatedAt: data.updated_at,
      },
      {
        headers: { ETag: etag, "Cache-Control": responseCacheHeader, Vary: "Cookie" },
      }
    );
  } catch {
    return NextResponse.json({ error: "Gagal memuat konfigurasi cloud" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Permintaan lintas domain (Cross-Origin) ditolak" },
      { status: 403 }
    );
  }

  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json(
      {
        success: false,
        error: "Akses ditolak: Operasi penyimpanan hanya diizinkan untuk administrator terotentikasi.",
      },
      { status: 401 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Format request bukan JSON valid" },
      { status: 400 }
    );
  }

  const validation = validateSiteConfigPayload(rawBody);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: "Payload tidak valid",
        details: validation.errors,
      },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "publish";
  const forceOverwrite =
    searchParams.get("force") === "1" || request.headers.get("x-force-overwrite") === "1";
  const expectedUpdatedAt =
    request.headers.get("x-expected-updated-at")?.trim() || "";

  const normalized = normalizeConfig(rawBody as Partial<SiteConfig>);
  const timestamp = new Date().toISOString();
  const editor = auth.userEmail || "admin";
  normalized.updatedAt = timestamp;

  const useLocalStore = shouldUseLocalRevisions();
  if (!isSupabaseConfigured() && !useLocalStore) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error:
          "Supabase Cloud belum dikonfigurasi di server environment. Operasi tulis ditolak.",
      },
      { status: 503 }
    );
  }

  // Optimistic Concurrency Check (only enforced when caller supplies x-expected-updated-at)
  if (!forceOverwrite && expectedUpdatedAt) {
    try {
      const targetDocId = action === "draft" ? "draft" : "current";
      let serverUpdatedAt: string | undefined;

      if (useLocalStore) {
        const localDoc = await readLocalCmsDoc(targetDocId);
        if (localDoc?.updated_at) {
          serverUpdatedAt = localDoc.updated_at;
        }
      } else if (action === "publish") {
        const meta = await fetchPublishedContentWithMeta();
        serverUpdatedAt = meta.updatedAt;
      }

      if (serverUpdatedAt && serverUpdatedAt !== expectedUpdatedAt) {
        return NextResponse.json(
          {
            success: false,
            conflict: true,
            error:
              "Konflik versi: Konfigurasi di server telah diubah oleh sesi atau pengguna lain. Muat ulang versi terbaru atau pilih timpa paksa.",
            serverUpdatedAt,
            expectedUpdatedAt,
          },
          { status: 409 }
        );
      }
    } catch {
      // Ignore read failure during conflict check
    }
  }

  try {
    // =========================================================================
    // AKSI 1: SIMPAN DRAF
    // =========================================================================
    if (action === "draft") {
      if (useLocalStore) {
        const saved = await writeLocalCmsDoc("draft", normalized);
        return NextResponse.json({
          success: true,
          provider: "local-store",
          status: "draft",
          message: "Draf berhasil disimpan di penyimpanan lokal server (belum dipublikasikan).",
          updatedAt: saved.updated_at,
        });
      }

      const supabase = getServiceRoleClient() || getSupabaseClient();
      if (!supabase) {
        return NextResponse.json(
          { success: false, error: "Klien Supabase tidak tersedia" },
          { status: 500 }
        );
      }

      const { error: draftErr } = await supabase.from("site_config").upsert(
        {
          id: "draft",
          config: normalized,
          updated_at: timestamp,
        },
        { onConflict: "id" }
      );

      if (draftErr) {
        return NextResponse.json(
          { success: false, error: "Gagal menyimpan draf ke database." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        provider: "supabase",
        status: "draft",
        message: "Draf berhasil disimpan di server (belum dipublikasikan ke publik).",
        updatedAt: timestamp,
      });
    }

    // =========================================================================
    // AKSI 2: PUBLIKASIKAN
    // =========================================================================
    // Audit raw projects, certificates & techStackCategories sebelum normalizeConfig melakukan fallback/normalisasi otomatis
    const health = evaluatePublishReadiness(normalized, rawBody);
    const readiness = getContentReadinessSummary(health);
    if (!health.canPublish) {
      const errorMsgs = health.issues
        .filter((i) => i.severity === "error")
        .map((i) => `[${i.section}] ${i.message}`);
      return NextResponse.json(
        {
          success: false,
          error: "Publikasi ditolak: Ditemukan kesalahan integritas konten yang wajib diperbaiki.",
          details: errorMsgs,
          health,
          readiness,
        },
        { status: 400 }
      );
    }

    const pubRes = await publishConfigWithRevision({
      config: normalized,
      editor,
      summary: `Publikasi Konten oleh ${editor}`,
    });

    if (!pubRes.success) {
      return NextResponse.json(
        {
          success: false,
          code: pubRes.code,
          error: pubRes.error,
        },
        { status: 500 }
      );
    }

    invalidatePublishedContentCache();
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/admin/preview");
      revalidatePath("/sitemap.xml");
      revalidatePath("/robots.txt");
      revalidatePath("/opengraph-image");
    } catch {
      // Ignore outside Next runtime
    }

    // Pemicu IndexNow non-blocking untuk mempercepat penemuan URL oleh Bing & Yandex
    if (
      normalized.seo?.indexNowKey &&
      process.env.NODE_ENV === "production" &&
      !process.env.LOCAL_CMS_STORE
    ) {
      triggerIndexNowIfConfigured(
        normalized.seo.indexNowKey,
        normalized.seo.canonicalUrl,
        ["/"]
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      provider: pubRes.provider,
      status: "published",
      version: pubRes.version,
      revisionId: pubRes.revisionId,
      message:
        health.warningsCount > 0
          ? `Konten dipublikasikan dengan ${health.warningsCount} peringatan kelengkapan yang masih perlu ditinjau.`
          : "Konten berhasil dipublikasikan ke situs.",
      updatedAt: pubRes.updatedAt,
      health,
      readiness,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat memproses konfigurasi" },
      { status: 500 }
    );
  }
}
