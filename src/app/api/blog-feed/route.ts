import { NextResponse } from "next/server";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import type { BlogPost } from "@/lib/blog-feed";
import type { ManualBlogPostConfig } from "@/lib/site-config";
import type { BlogFeedErrorCode } from "@/lib/content/blog-sync";
import { fetchBlogFeedSecurely } from "@/lib/content/blog-feed-server";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { mergeBlogPostsWithOverrides } from "@/lib/content/selectors";

export const dynamic = "force-dynamic";

function mapErrorCodeToHttpStatus(code?: BlogFeedErrorCode): number {
  switch (code) {
    case "missing_feed_url":
    case "unsafe_url":
    case "blocked_destination":
      return 400;
    case "html_not_feed":
    case "invalid_feed_format":
      return 422;
    case "timeout":
      return 504;
    default:
      return 502;
  }
}

function toManualPostShapes(posts: BlogPost[]): ManualBlogPostConfig[] {
  return posts.map((p, idx) => ({
    id: p.id || `sync-${idx + 1}`,
    slug: p.slug || `sync-${idx + 1}`,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage || "",
    url: p.url,
    category: p.category || "Article",
    date: p.publishedAt || "",
    featured: false,
    pinned: false,
    published: true,
    visible: true,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSync = searchParams.get("rawSync") === "1";
  const refresh = searchParams.get("refresh") === "1";
  const locale = searchParams.get("locale") === "en" ? "en" : "id";

  const config = await fetchPublishedContent();
  const blogConfig = config?.blog;

  const limitParam = Number(searchParams.get("limit"));
  const defaultLimit = blogConfig?.displayCount || 4;
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(Math.max(Math.round(limitParam), 1), 12)
    : Math.min(Math.max(defaultLimit, 1), 12);

  if (blogConfig?.visible === false || blogConfig?.published === false) {
    return NextResponse.json(
      {
        ok: true,
        status: "success_empty",
        mode: "disabled",
        attemptAt: null,
        syncedAt: blogConfig?.lastSyncedAt || null,
        sourceHost: "",
        count: 0,
        posts: [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const rawMode = (blogConfig?.sourceMode as string | undefined) || "hybrid";
  const mode: "hybrid" | "manual" | "sync" =
    rawMode === "manual" ? "manual" : rawMode === "sync" || rawMode === "synced" ? "sync" : "hybrid";

  if (mode === "manual") {
    if (rawSync) {
      return NextResponse.json(
        {
          ok: true,
          status: "success_empty",
          mode: "manual",
          attemptAt: blogConfig?.lastSyncAttemptAt || null,
          syncedAt: blogConfig?.lastSyncedAt || null,
          sourceHost: "",
          count: 0,
          posts: [],
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const manualMerged = mergeBlogPostsWithOverrides(config, undefined, locale);
    return NextResponse.json(
      {
        ok: true,
        status: manualMerged.length > 0 ? "success_posts" : "success_empty",
        mode: "manual",
        attemptAt: blogConfig?.lastSyncAttemptAt || null,
        syncedAt: blogConfig?.lastSyncedAt || null,
        sourceHost: "",
        count: manualMerged.length,
        posts: manualMerged,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const feedUrl = (blogConfig?.feedUrl || "").trim();
  if (!feedUrl && rawSync) {
    return NextResponse.json(
      {
        ok: false,
        status: "never",
        mode,
        attemptAt: blogConfig?.lastSyncAttemptAt || null,
        syncedAt: blogConfig?.lastSyncedAt || null,
        sourceHost: "",
        count: 0,
        posts: [],
        errorCode: "missing_feed_url",
        errorMessage: "URL sumber feed blog belum diisi.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const fetchLimit = rawSync ? Math.max(limit, 12) : Math.max(limit, 8);
  const result = await fetchBlogFeedSecurely(feedUrl, {
    limit: fetchLimit,
    noCache: refresh,
  });

  if (rawSync) {
    return NextResponse.json(
      {
        ...result,
        mode,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (result.ok) {
    const externalAsManual = toManualPostShapes(result.posts);
    const merged = mergeBlogPostsWithOverrides(config, externalAsManual, locale);
    return NextResponse.json(
      {
        ok: true,
        status: result.status,
        mode,
        attemptAt: result.attemptAt,
        syncedAt: result.syncedAt,
        sourceHost: result.sourceHost,
        syncCount: result.count,
        count: merged.length,
        posts: merged,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // Pada kegagalan sinkronisasi: pertahankan artikel valid terakhir + kurasi manual (JANGAN pakai data dummy)
  const fallbackMerged = mergeBlogPostsWithOverrides(config, undefined, locale);
  return NextResponse.json(
    {
      ok: false,
      status: "error",
      mode,
      attemptAt: result.attemptAt,
      syncedAt: blogConfig?.lastSyncedAt || null,
      sourceHost: result.sourceHost,
      count: fallbackMerged.length,
      posts: fallbackMerged,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      usedCachedFallback: (blogConfig?.syncedPosts?.length || 0) > 0,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: "Cross-Origin request ditolak" }, { status: 403 });
  }

  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
  }

  let body: { feedUrl?: string; limit?: number } = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as { feedUrl?: string; limit?: number };
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        attemptAt: new Date().toISOString(),
        syncedAt: null,
        sourceHost: "",
        count: 0,
        posts: [],
        errorCode: "invalid_feed_format",
        errorMessage: "Body permintaan sinkronisasi harus berupa JSON valid.",
      },
      { status: 400 }
    );
  }

  const config = await fetchPublishedContent();
  const targetUrl =
    typeof body.feedUrl === "string"
      ? body.feedUrl.trim()
      : (config?.blog?.feedUrl || "").trim();

  const limitParam = Number(body.limit);
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(Math.max(Math.round(limitParam), 1), 24)
      : 12;

  const result = await fetchBlogFeedSecurely(targetUrl, {
    limit,
    noCache: true,
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : mapErrorCodeToHttpStatus(result.errorCode),
    headers: { "Cache-Control": "no-store" },
  });
}
