import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import { auditContentHealth } from "@/lib/content/content-health";
import { recordNewRevision } from "@/lib/content/revisions";
import { invalidatePublishedContentCache } from "@/lib/content/public-content";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    const etag = '"local-unconfigured"';
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }
    return NextResponse.json(
      {
        configured: false,
        provider: "local",
        config: null,
      },
      {
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  try {
    const supabase = getServiceRoleClient() || getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ configured: false, config: null });
    }

    // 1. Jika mode = 'draft', wajib autentikasi admin
    if (mode === "draft") {
      const auth = await verifyAdminRequest(request);
      if (!auth.isAuthenticated) {
        return NextResponse.json(
          { error: "Akses ditolak: Draf hanya dapat dibaca oleh administrator." },
          { status: 401 }
        );
      }

      // Ambil draft tersimpan
      const { data: draftData } = await supabase
        .from("site_config")
        .select("config, updated_at")
        .eq("id", "draft")
        .maybeSingle();

      if (draftData?.config) {
        return NextResponse.json(
          {
            configured: true,
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

      // Jika draft belum ada, kembalikan published config sebagai basis editor
    }

    // 2. Mode 'published' (Default untuk pengunjung publik dan website)
    const { data: initialData, error } = await supabase
      .from("site_config")
      .select("config, updated_at")
      .eq("id", "current")
      .maybeSingle();

    let data = initialData;

    // Fallback: Jika ID "current" belum ada, coba baca konfigurasi lama dengan ID "main"
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
      const ifNoneMatch = request.headers.get("if-none-match");
      if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            ETag: etag,
            "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
          },
        });
      }
      return NextResponse.json(
        {
          configured: true,
          config: null,
          message: "Belum ada konfigurasi tersimpan di cloud",
        },
        {
          headers: {
            ETag: etag,
            "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    // Sanitasi data publik sebelum dikirim ke client
    const normalized = normalizeConfig(data.config as Partial<SiteConfig>);

    const etag = `"${Buffer.from(data.updated_at || "initial").toString("base64")}"`;
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
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
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Gagal memuat konfigurasi cloud" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 1. Validasi CSRF / Origin
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Permintaan lintas domain (Cross-Origin) ditolak" },
      { status: 403 }
    );
  }

  // 2. Wajib Autentikasi Admin Server-Side
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

  // 3. Validasi Payload Schema & Sanitasi
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

  // 4. Kredensial cloud yang belum ada harus menolak operasi tulis server
  if (!isSupabaseConfigured()) {
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

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "publish";

  try {
    const normalized = normalizeConfig(rawBody as Partial<SiteConfig>);
    const supabase = getServiceRoleClient() || getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Klien Supabase tidak tersedia" },
        { status: 500 }
      );
    }

    const timestamp = new Date().toISOString();
    const editor = auth.userEmail || "admin";

    // =========================================================================
    // AKSI 1: SIMPAN DRAF (Hanya menyimpan di database tanpa mengubah publik)
    // =========================================================================
    if (action === "draft") {
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
        status: "draft",
        message: "Draf berhasil disimpan di server (belum dipublikasikan ke publik).",
        updatedAt: timestamp,
      });
    }

    // =========================================================================
    // AKSI 2: PUBLIKASIKAN (Audit integritas, catat revisi, update 'current', bersihkan cache)
    // =========================================================================
    // Cek integritas konten (blokir jika ada kesalahan kritis seperti URL berbahaya atau data rusak)
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

    // Catat ke riwayat revisi (Version History)
    const revResult = await recordNewRevision(
      normalized,
      editor,
      `Publikasi Konten oleh ${editor}`
    );

    // Tulis ke record publik 'current'
    const { error: publishErr } = await supabase.from("site_config").upsert(
      {
        id: "current",
        config: normalized,
        updated_at: timestamp,
      },
      { onConflict: "id" }
    );

    if (publishErr) {
      return NextResponse.json(
        { success: false, error: "Gagal mempublikasikan konfigurasi pada database." },
        { status: 500 }
      );
    }

    // Hapus draft lama karena sudah terpublikasi
    await supabase.from("site_config").delete().eq("id", "draft");

    // Invalidate server memory cache & Next.js cache
    invalidatePublishedContentCache();
    try {
      revalidatePath("/");
      revalidatePath("/admin");
    } catch {
      // Abaikan jika dipanggil di luar konteks Next.js cache
    }

    return NextResponse.json({
      success: true,
      status: "published",
      version: revResult.version,
      revisionId: revResult.revisionId,
      message: "Konten berhasil dipublikasikan secara langsung ke seluruh situs.",
      updatedAt: timestamp,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat memproses konfigurasi" },
      { status: 500 }
    );
  }
}
