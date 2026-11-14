import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import { auditContentHealth } from "@/lib/content/content-health";
import { recordNewRevision } from "@/lib/content/revisions";
import {
  invalidatePublishedContentCache,
  fetchPublishedContentWithMeta,
} from "@/lib/content/public-content";
import {
  deleteLocalCmsDoc,
  isLocalCmsOverrideAllowed,
  readLocalCmsDoc,
  writeLocalCmsDoc,
} from "@/lib/content/local-cms-store";

const PUBLISHED_CACHE_HEADER = "public, max-age=0, must-revalidate";

function shouldUseLocalCmsWriteFallback(): boolean {
  if (!isSupabaseConfigured()) return isLocalCmsOverrideAllowed();
  if (process.env.LOCAL_CMS_STORE === "1") return isLocalCmsOverrideAllowed();
  const hasServiceRole = Boolean(getServiceRoleClient());
  if (!process.env.VERCEL && !hasServiceRole) {
    return isLocalCmsOverrideAllowed();
  }
  return false;
}

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

    // Prefer local draft when local store override applies
    if (isLocalCmsOverrideAllowed()) {
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
    }

    if (isSupabaseConfigured()) {
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

  // 2. Mode 'published'
  if (isLocalCmsOverrideAllowed()) {
    const localCurrent = await readLocalCmsDoc<Partial<SiteConfig>>("current");
    if (localCurrent?.config) {
      const normalized = normalizeConfig(localCurrent.config);
      const etag = `"${Buffer.from(localCurrent.updated_at || "local").toString("base64")}"`;
      const ifNoneMatch = request.headers.get("if-none-match");
      if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
        return new NextResponse(null, {
          status: 304,
          headers: { ETag: etag, "Cache-Control": PUBLISHED_CACHE_HEADER },
        });
      }
      return NextResponse.json(
        {
          configured: true,
          provider: "local-store",
          mode: "published",
          config: normalized,
          updatedAt: localCurrent.updated_at,
        },
        {
          headers: { ETag: etag, "Cache-Control": PUBLISHED_CACHE_HEADER },
        }
      );
    }
  }

  if (!isSupabaseConfigured()) {
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
    const etag = `"${Buffer.from(data.updated_at || "initial").toString("base64")}"`;
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": PUBLISHED_CACHE_HEADER },
      });
    }

    return NextResponse.json(
      {
        configured: true,
        provider: "supabase",
        mode: "published",
        config: normalized,
        updatedAt: data.updated_at,
      },
      {
        headers: { ETag: etag, "Cache-Control": PUBLISHED_CACHE_HEADER },
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

  const useLocalStore = shouldUseLocalCmsWriteFallback();
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

      if (useLocalStore || isLocalCmsOverrideAllowed()) {
        const localDoc = await readLocalCmsDoc(targetDocId);
        if (localDoc?.updated_at) {
          serverUpdatedAt = localDoc.updated_at;
        }
      }
      if (!serverUpdatedAt && action === "publish") {
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
        if (isLocalCmsOverrideAllowed()) {
          const saved = await writeLocalCmsDoc("draft", normalized);
          return NextResponse.json({
            success: true,
            provider: "local-store",
            status: "draft",
            message: "Draf disimpan di penyimpanan lokal server (Supabase RLS aktif).",
            updatedAt: saved.updated_at,
          });
        }
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
    const health = auditContentHealth(normalized);
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
        },
        { status: 400 }
      );
    }

    const revResult = await recordNewRevision(
      normalized,
      editor,
      `Publikasi Konten oleh ${editor}`
    );

    let savedUpdatedAt = timestamp;
    let usedProvider = "supabase";

    if (useLocalStore) {
      const saved = await writeLocalCmsDoc("current", normalized);
      await deleteLocalCmsDoc("draft");
      savedUpdatedAt = saved.updated_at;
      usedProvider = "local-store";
    } else {
      const supabase = getServiceRoleClient() || getSupabaseClient();
      if (!supabase) {
        return NextResponse.json(
          { success: false, error: "Klien Supabase tidak tersedia" },
          { status: 500 }
        );
      }

      const { error: publishErr } = await supabase.from("site_config").upsert(
        {
          id: "current",
          config: normalized,
          updated_at: timestamp,
        },
        { onConflict: "id" }
      );

      if (publishErr) {
        if (isLocalCmsOverrideAllowed()) {
          const saved = await writeLocalCmsDoc("current", normalized);
          await deleteLocalCmsDoc("draft");
          savedUpdatedAt = saved.updated_at;
          usedProvider = "local-store";
        } else {
          return NextResponse.json(
            { success: false, error: "Gagal mempublikasikan konfigurasi pada database." },
            { status: 500 }
          );
        }
      } else {
        await supabase.from("site_config").delete().eq("id", "draft");
      }
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

    return NextResponse.json({
      success: true,
      provider: usedProvider,
      status: "published",
      version: revResult.version,
      revisionId: revResult.revisionId,
      message: "Konten berhasil dipublikasikan secara langsung ke seluruh situs.",
      updatedAt: savedUpdatedAt,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat memproses konfigurasi" },
      { status: 500 }
    );
  }
}
