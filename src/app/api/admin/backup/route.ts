import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import {
  evaluatePublishReadiness,
  getContentReadinessSummary,
} from "@/lib/content/content-health";
import {
  createDefaultRevisionAdapter,
  publishConfigWithRevision,
} from "@/lib/content/revisions";
import {
  fetchPublishedContent,
  invalidatePublishedContentCache,
} from "@/lib/content/public-content";

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

  const rawCandidate = configCandidate as Partial<SiteConfig>;
  const validConfig = normalizeConfig(rawCandidate);
  const health = evaluatePublishReadiness(validConfig, rawCandidate);
  const readiness = getContentReadinessSummary(health);

  if (target === "publish" && !health.canPublish) {
    const errorMsgs = health.issues
      .filter((i) => i.severity === "error")
      .map((i) => `[${i.section}] ${i.message}`);
    return NextResponse.json(
      {
        error: "Publikasi langsung ditolak: Berkas cadangan memiliki kesalahan integritas data kritis.",
        details: errorMsgs,
        health,
        readiness,
      },
      { status: 422 }
    );
  }

  const editor = auth.userEmail || "admin";
  const now = new Date().toISOString();

  if (target === "publish") {
    const pubRes = await publishConfigWithRevision({
      config: { ...validConfig, updatedAt: now },
      editor,
      summary: "Impor cadangan JSON (Dipublikasikan)",
    });

    if (!pubRes.success) {
      return NextResponse.json(
        { error: pubRes.error, code: pubRes.code },
        { status: 500 }
      );
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
      provider: pubRes.provider,
      version: pubRes.version,
      revisionId: pubRes.revisionId,
      updatedAt: pubRes.updatedAt,
      message: "Cadangan berhasil diimpor dan dipublikasikan ke seluruh situs.",
      config: { ...validConfig, updatedAt: pubRes.updatedAt },
      health,
      readiness,
    });
  } else {
    const adapter = createDefaultRevisionAdapter();
    const draftRes = await adapter.writeDoc("draft", { ...validConfig, updatedAt: now }, now);
    if (!draftRes.ok) {
      return NextResponse.json(
        { error: `Gagal menyimpan draf ke penyimpanan: ${draftRes.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      target: "draft",
      provider: adapter.provider,
      updatedAt: draftRes.updatedAt,
      message: "Cadangan berhasil diimpor sebagai Draf. Silakan tinjau sebelum dipublikasikan.",
      config: validConfig,
      health,
      readiness,
    });
  }
}
