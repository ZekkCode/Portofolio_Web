import { NextResponse } from "next/server";
import { isR2Configured, uploadFileToR2 } from "@/lib/r2";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    r2: isR2Configured(),
    supabase: isSupabaseConfigured(),
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan dalam permintaan" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "application/octet-stream";
    const filename = file.name || "upload";

    if (isR2Configured()) {
      const result = await uploadFileToR2({
        buffer,
        filename,
        contentType,
        folder,
      });

      return NextResponse.json({
        success: true,
        url: result.url,
        key: result.key,
        provider: "r2",
      });
    }

    // Fallback jika Cloudflare R2 belum diset di .env.local
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      provider: "fallback-data-uri",
      warning:
        "Cloudflare R2 belum aktif. Berkas disimpan sementara sebagai data URI. Isi .env.local untuk menyimpan ke Cloudflare R2.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat unggah";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
