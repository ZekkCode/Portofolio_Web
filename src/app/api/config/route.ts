import { NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, type SiteConfig } from "@/lib/site-store";

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
        message: "Belum ada konfigurasi di Supabase",
      });
    }

    return NextResponse.json({
      configured: true,
      provider: "supabase",
      config: normalizeConfig(data.config),
      updatedAt: data.updated_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat konfigurasi cloud";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        message: "Supabase belum dikonfigurasi di environment variables",
      },
      { status: 200 }
    );
  }

  try {
    const body = (await request.json()) as Partial<SiteConfig>;
    const normalized = normalizeConfig(body);
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
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: "supabase",
      message: "Konfigurasi berhasil disimpan ke Supabase Cloud Database",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan ke Supabase";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
