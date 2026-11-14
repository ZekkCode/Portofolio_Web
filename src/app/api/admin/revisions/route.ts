import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import {
  getRevisionHistory,
  getRevisionSnapshot,
  recordNewRevision,
} from "@/lib/content/revisions";
import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { invalidatePublishedContentCache } from "@/lib/content/public-content";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import { isLocalCmsOverrideAllowed, writeLocalCmsDoc } from "@/lib/content/local-cms-store";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const snapshot = await getRevisionSnapshot(id);
    if (!snapshot) {
      return NextResponse.json({ error: "Revisi tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ revisionId: id, snapshot });
  }

  const history = await getRevisionHistory();
  return NextResponse.json({ revisions: history });
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: "Cross-Origin request ditolak" }, { status: 403 });
  }

  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
  }

  let body: { action?: string; revisionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid" }, { status: 400 });
  }

  if (body.action === "rollback") {
    if (!body.revisionId) {
      return NextResponse.json({ error: "Parameter revisionId diperlukan" }, { status: 400 });
    }

    const snapshot = await getRevisionSnapshot(body.revisionId);
    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot revisi tidak ditemukan" }, { status: 404 });
    }

    const validation = validateSiteConfigPayload(snapshot);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Data revisi tidak memenuhi skema saat ini", details: validation.errors },
        { status: 400 }
      );
    }

    const editor = auth.userEmail || "admin";
    const timestamp = new Date().toISOString();
    const useLocal =
      !isSupabaseConfigured() ||
      process.env.LOCAL_CMS_STORE === "1" ||
      (!process.env.VERCEL && !getServiceRoleClient());

    await recordNewRevision(snapshot, editor, `Dipulihkan dari revisi ${body.revisionId}`);

    if (useLocal && isLocalCmsOverrideAllowed()) {
      await writeLocalCmsDoc("current", snapshot);
    } else {
      const supabase = getServiceRoleClient() || getSupabaseClient();
      if (!supabase) {
        return NextResponse.json({ error: "Klien database tidak tersedia" }, { status: 500 });
      }
      const { error: upsertErr } = await supabase.from("site_config").upsert(
        {
          id: "current",
          config: snapshot,
          updated_at: timestamp,
        },
        { onConflict: "id" }
      );
      if (upsertErr) {
        if (isLocalCmsOverrideAllowed()) {
          await writeLocalCmsDoc("current", snapshot);
        } else {
          return NextResponse.json({ error: "Gagal memperbarui konfigurasi aktif" }, { status: 500 });
        }
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
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memulihkan ke revisi ${body.revisionId}`,
      config: snapshot,
    });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
}
