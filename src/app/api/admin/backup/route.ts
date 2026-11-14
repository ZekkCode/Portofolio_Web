import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import { auditContentHealth } from "@/lib/content/content-health";
import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { recordNewRevision } from "@/lib/content/revisions";
import {
  fetchPublishedContent,
  invalidatePublishedContentCache,
} from "@/lib/content/public-content";
import { isLocalCmsOverrideAllowed, writeLocalCmsDoc } from "@/lib/content/local-cms-store";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
  }

  const configToExport: SiteConfig = await fetchPublishedContent();
  const timestamp = new Date().toISOString();
  const filename = `zekktech-backup-${timestamp.replace(/[:.]/g, "-")}.json`;

  const payload = {
    _meta: {
      generator: "ZekkTech Portfolio CMS v3",
      exportedAt: timestamp,
      exportedBy: auth.userEmail || "admin",
      schemaVersion: configToExport.schemaVersion || 2,
    },
    config: configToExport,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: "Cross-Origin request ditolak" }, { status: 403 });
  }

  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target") === "publish" ? "publish" : "draft";

  let rawData: unknown;
  try {
    rawData = await request.json();
  } catch {
    return NextResponse.json({ error: "Format berkas bukan JSON valid" }, { status: 400 });
  }

  const configCandidate: unknown =
    rawData && typeof rawData === "object" && "config" in rawData
      ? (rawData as { config: unknown }).config
      : rawData;

  const validation = validateSiteConfigPayload(configCandidate);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        error: "Berkas cadangan tidak valid atau tidak memenuhi skema konfigurasi",
        details: validation.errors,
      },
      { status: 400 }
    );
  }

  const validConfig = normalizeConfig(configCandidate as Partial<SiteConfig>);
  const health = auditContentHealth(validConfig);

  if (target === "publish" && !health.canPublish) {
    return NextResponse.json(
      {
        error: "Publikasi langsung ditolak: Berkas cadangan memiliki kesalahan integritas data kritis.",
        health,
      },
      { status: 422 }
    );
  }

  const useLocal =
    !isSupabaseConfigured() ||
    process.env.LOCAL_CMS_STORE === "1" ||
    (!process.env.VERCEL && !getServiceRoleClient());

  const editor = auth.userEmail || "admin";
  const now = new Date().toISOString();

  if (target === "publish") {
    await recordNewRevision(validConfig, editor, "Impor cadangan JSON (Dipublikasikan)");

    if (useLocal && isLocalCmsOverrideAllowed()) {
      await writeLocalCmsDoc("current", validConfig);
    } else {
      const supabase = getServiceRoleClient() || getSupabaseClient();
      if (!supabase) {
        return NextResponse.json({ error: "Klien database tidak tersedia" }, { status: 500 });
      }
      const { error: upsertErr } = await supabase.from("site_config").upsert(
        { id: "current", config: validConfig, updated_at: now },
        { onConflict: "id" }
      );
      if (upsertErr) {
        if (isLocalCmsOverrideAllowed()) {
          await writeLocalCmsDoc("current", validConfig);
        } else {
          return NextResponse.json({ error: "Gagal menyimpan konfigurasi ke database" }, { status: 500 });
        }
      }
    }

    invalidatePublishedContentCache();
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/admin/preview");
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      target: "publish",
      message: "Cadangan berhasil diimpor dan dipublikasikan ke seluruh situs.",
      config: validConfig,
      health,
    });
  } else {
    if (useLocal && isLocalCmsOverrideAllowed()) {
      await writeLocalCmsDoc("draft", validConfig);
    } else {
      const supabase = getServiceRoleClient() || getSupabaseClient();
      if (!supabase) {
        return NextResponse.json({ error: "Klien database tidak tersedia" }, { status: 500 });
      }
      const { error: draftErr } = await supabase.from("site_config").upsert(
        { id: "draft", config: validConfig, updated_at: now },
        { onConflict: "id" }
      );
      if (draftErr) {
        if (isLocalCmsOverrideAllowed()) {
          await writeLocalCmsDoc("draft", validConfig);
        } else {
          return NextResponse.json({ error: "Gagal menyimpan draf ke database" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      target: "draft",
      message: "Cadangan berhasil diimpor sebagai Draf. Silakan tinjau sebelum dipublikasikan.",
      config: validConfig,
      health,
    });
  }
}
