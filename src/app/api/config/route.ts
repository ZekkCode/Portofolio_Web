import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
        { configured: true, error: "Gagal membaca konfigurasi database", config: null },
        { status: 500 }
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

  try {
    const normalized = normalizeConfig(rawBody as Partial<SiteConfig>);
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Klien Supabase tidak tersedia" },
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
        { success: false, error: "Gagal memperbarui konfigurasi pada database." },
        { status: 500 }
      );
    }

    // 5. Segarkan cache halaman publik setelah penyimpanan berhasil
    try {
      revalidatePath("/");
      revalidatePath("/admin");
    } catch {
      // Abaikan jika dipanggil di luar konteks Next.js cache
    }

    return NextResponse.json({
      success: true,
      message: "Konfigurasi berhasil disimpan dan dipublikasikan ke Supabase Cloud",
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat menyimpan konfigurasi" },
      { status: 500 }
    );
  }
}
