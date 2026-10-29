import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerClient } from "@supabase/ssr";
import { defaultCvDocs, normalizeConfig, type CvDocConfig } from "@/lib/site-config";
import { createPresignedCvUrl, isR2Configured } from "@/lib/r2";

export const dynamic = "force-dynamic";

async function getStoredCvDoc(roleKey?: string | null): Promise<CvDocConfig | undefined> {
  let cvDocs: CvDocConfig[] = defaultCvDocs;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, anonKey, {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      });
      const { data } = await supabase
        .from("site_config")
        .select("config")
        .eq("id", "main")
        .single();

      if (data?.config) {
        const normalized = normalizeConfig(data.config);
        cvDocs = normalized.cvDocs;
      }
    } catch {
      // Fallback ke defaultCvDocs jika Supabase offline/belum diset
    }
  }

  if (roleKey) {
    const match = cvDocs.find((d) => d.roleKey === roleKey);
    if (match) return match;
  }

  return cvDocs[0];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const directUrl = searchParams.get("url");
  const wantsJson = request.headers.get("accept")?.includes("application/json") || searchParams.get("format") === "json";

  const doc = await getStoredCvDoc(role);
  let targetUrl = (directUrl || doc?.pdfUrl || "/cv-ats-zakariamp-2025.pdf").trim();

  // 1. Jika URL berada di Cloudflare R2
  const isR2KeyOrUrl =
    targetUrl.startsWith("cv/") ||
    targetUrl.startsWith("uploads/") ||
    targetUrl.includes(".r2.cloudflarestorage.com") ||
    (process.env.R2_PUBLIC_DOMAIN && targetUrl.includes(process.env.R2_PUBLIC_DOMAIN));

  if (isR2KeyOrUrl && isR2Configured()) {
    try {
      const signedUrl = await createPresignedCvUrl(
        targetUrl,
        "CV-ATS-ZakariaMP-2025.pdf",
        3600
      );

      if (signedUrl) {
        if (wantsJson) {
          return NextResponse.json({ url: signedUrl });
        }
        return NextResponse.redirect(signedUrl, 302);
      }
    } catch (err) {
      console.error("[api/cv-pdf] Gagal membuat presigned R2 URL:", err);
    }
  }

  // 2. Jika targetUrl adalah URL eksternal absolut
  if (/^https?:\/\//i.test(targetUrl)) {
    if (wantsJson) {
      return NextResponse.json({ url: targetUrl });
    }
    return NextResponse.redirect(targetUrl, 302);
  }

  // 3. Fallback menyajikan berkas PDF lokal dengan Content-Type & Content-Disposition inline
  try {
    const cleanPath = targetUrl.replace(/^\/+/, "");
    const filePath = join(process.cwd(), "public", cleanPath);
    const fileBuffer = await readFile(filePath);

    if (wantsJson) {
      return NextResponse.json({ url: `/${cleanPath}` });
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="CV-ATS-ZakariaMP-2025.pdf"',
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[api/cv-pdf] Berkas lokal tidak ditemukan:", err);
    return NextResponse.json(
      { error: "Berkas PDF CV tidak ditemukan." },
      { status: 404 }
    );
  }
}
