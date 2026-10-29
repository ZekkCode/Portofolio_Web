import { NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import { validateSiteConfigPayload } from "@/lib/config-validator";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: "local",
      config: null,
    });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ configured: false, config: null });
    }

    const { data, error } = await supabase
      .from("site_config")
      .select("config, updated_at")
      .eq("id", "current")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { configured: true, error: error.message, config: null },
        { status: 200 }
      );
    }

    if (!data || !data.config) {
      return NextResponse.json({
        configured: true,
        config: null,
        message: "Belum ada konfigurasi tersimpan di cloud",
      });
    }

    // Sanitasi data publik sebelum dikirim ke client
    const normalized = normalizeConfig(data.config as Partial<SiteConfig>);

    return NextResponse.json({
      configured: true,
      provider: "supabase",
      config: normalized,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat konfigurasi cloud";
    return NextResponse.json({ error: message }, { status: 500 });
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
        message:
          "Supabase Cloud belum dikonfigurasi di server environment. Perubahan hanya tersimpan di draft lokal perangkat Anda dan belum terpublikasi ke server.",
      },
      { status: 200 }
    );
  }

  try {
    const normalized = normalizeConfig(rawBody as Partial<SiteConfig>);
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, message: "Klien Supabase tidak tersedia" },
        { status: 500 }
      );
    }

    const { error } = await supabase.from("site_config").upsert(
      {
        id: "current",
        config: normalized,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      return NextResponse.json(
        { success: false, error: `Database Supabase menolak operasi: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Konfigurasi berhasil disimpan dan dipublikasikan ke Supabase Cloud",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan server saat menyimpan konfigurasi";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
