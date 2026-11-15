import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import {
  CURRENT_CONFIG_SCHEMA_VERSION,
  buildRevisionInspectSummary,
  createDefaultRevisionAdapter,
  getRevisionHistoryDetailed,
  getRevisionSnapshotDetailed,
  publishConfigWithRevision,
} from "@/lib/content/revisions";
import {
  fetchPublishedContent,
  invalidatePublishedContentCache,
} from "@/lib/content/public-content";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";
import { getContentReadinessSummary } from "@/lib/content/content-health";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const inspect = searchParams.get("inspect") === "1";

  if (id !== null) {
    const snapRes = await getRevisionSnapshotDetailed(id);
    if (!snapRes.ok) {
      const status =
        snapRes.reason === "invalid_id"
          ? 400
          : snapRes.reason === "not_found"
            ? 404
            : snapRes.reason === "incompatible"
              ? 422
              : 500;
      return NextResponse.json(
        {
          error: snapRes.error,
          reason: snapRes.reason,
          ...(snapRes.compatibility ? { compatibility: snapRes.compatibility } : {}),
        },
        { status }
      );
    }

    const readiness = getContentReadinessSummary(snapRes.health);
    if (!inspect) {
      return NextResponse.json({
        revisionId: id,
        snapshot: snapRes.snapshot,
        compatibility: snapRes.compatibility,
        health: snapRes.health,
        readiness,
        updatedAt: snapRes.updatedAt,
      });
    }

    const adapter = createDefaultRevisionAdapter();
    const currentDoc = await adapter.readDoc<Partial<SiteConfig>>("current");
    const activeConfig =
      currentDoc.status === "ok" && currentDoc.config && typeof currentDoc.config === "object"
        ? normalizeConfig(currentDoc.config)
        : await fetchPublishedContent();

    const inspectSummary = buildRevisionInspectSummary(snapRes.snapshot, activeConfig);

    return NextResponse.json({
      revisionId: id,
      snapshot: snapRes.snapshot,
      compatibility: snapRes.compatibility,
      health: snapRes.health,
      readiness,
      inspectSummary,
      updatedAt: snapRes.updatedAt,
    });
  }

  const historyRes = await getRevisionHistoryDetailed();
  if (!historyRes.ok) {
    return NextResponse.json(
      {
        error: historyRes.error,
        status: "error",
        provider: historyRes.provider,
        currentSchemaVersion: CURRENT_CONFIG_SCHEMA_VERSION,
        revisions: [],
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: historyRes.status,
    provider: historyRes.provider,
    currentSchemaVersion: CURRENT_CONFIG_SCHEMA_VERSION,
    revisions: historyRes.revisions,
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

  let body: { action?: string; revisionId?: string; target?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid" }, { status: 400 });
  }

  if (body.action === "rollback") {
    if (!body.revisionId) {
      return NextResponse.json({ error: "Parameter revisionId diperlukan" }, { status: 400 });
    }

    const target = body.target === "publish" ? "publish" : "draft";
    const snapRes = await getRevisionSnapshotDetailed(body.revisionId);
    if (!snapRes.ok) {
      const status =
        snapRes.reason === "invalid_id"
          ? 400
          : snapRes.reason === "not_found"
            ? 404
            : snapRes.reason === "incompatible"
              ? 422
              : 500;
      return NextResponse.json(
        {
          error: snapRes.error,
          reason: snapRes.reason,
          ...(snapRes.compatibility ? { compatibility: snapRes.compatibility } : {}),
        },
        { status }
      );
    }

    const readiness = getContentReadinessSummary(snapRes.health);
    const timestamp = new Date().toISOString();
    const restoredConfig: SiteConfig = {
      ...snapRes.snapshot,
      updatedAt: timestamp,
    };

    if (target === "draft") {
      const adapter = createDefaultRevisionAdapter();
      const draftWrite = await adapter.writeDoc("draft", restoredConfig, timestamp);
      if (!draftWrite.ok) {
        return NextResponse.json(
          { error: `Gagal memuat revisi ke draf server: ${draftWrite.error}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        target: "draft",
        provider: adapter.provider,
        revisionId: body.revisionId,
        updatedAt: draftWrite.updatedAt,
        message: `Snapshot revisi ${body.revisionId} dimuat ke draf. Konfigurasi produksi tidak diubah.`,
        config: { ...restoredConfig, updatedAt: draftWrite.updatedAt },
        compatibility: snapRes.compatibility,
        health: snapRes.health,
        readiness,
      });
    }

    if (!snapRes.health.canPublish) {
      const errorMsgs = snapRes.health.issues
        .filter((i) => i.severity === "error")
        .map((i) => `[${i.section}] ${i.message}`);
      return NextResponse.json(
        {
          error:
            "Publikasi rollback ditolak: Snapshot revisi memiliki blocker integritas konten. Muat ke draf terlebih dahulu untuk memperbaikinya.",
          details: errorMsgs,
          health: snapRes.health,
          readiness,
        },
        { status: 400 }
      );
    }

    const editor = auth.userEmail || "admin";
    const pubRes = await publishConfigWithRevision({
      config: restoredConfig,
      editor,
      summary: `Dipulihkan dari revisi ${body.revisionId}`,
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
      revalidatePath("/sitemap.xml");
      revalidatePath("/robots.txt");
      revalidatePath("/opengraph-image");
    } catch {
      // ignore outside Next runtime
    }

    return NextResponse.json({
      success: true,
      target: "publish",
      provider: pubRes.provider,
      revisionId: pubRes.revisionId,
      version: pubRes.version,
      restoredFromRevisionId: body.revisionId,
      updatedAt: pubRes.updatedAt,
      message: `Konfigurasi situs berhasil dipulihkan dan dipublikasikan dari revisi ${body.revisionId} (menjadi v${pubRes.version}).`,
      config: { ...restoredConfig, updatedAt: pubRes.updatedAt },
      compatibility: snapRes.compatibility,
      health: snapRes.health,
      readiness,
    });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
}
