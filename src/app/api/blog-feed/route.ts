import { NextResponse } from "next/server";
import { VERIFIED_BLOG_POSTS, sanitizeBlogPost, type BlogPost } from "@/lib/blog-feed";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { mergeBlogPostsWithOverrides } from "@/lib/content/selectors";

export const dynamic = "force-dynamic";

async function fetchExternalBlogFeed(baseFeedUrl: string, limit: number, noCache = false): Promise<BlogPost[]> {
  const timeoutMs = 4500;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const cleanFeed = (baseFeedUrl || "https://zekktech.biz.id").replace(/\/$/, "");

  try {
    // 1. Try public JSON API endpoint if feedUrl is an API URL or standard root
    const apiUrl =
      cleanFeed.includes("/api/") || cleanFeed.endsWith(".json")
        ? cleanFeed
        : `${cleanFeed}/api/public/posts?limit=${limit}`;

    try {
      const apiRes = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "ZekkTech-Portfolio/1.0",
        },
        cache: noCache ? "no-store" : "default",
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data?.posts)
          ? data.posts
          : [];
        if (rawList.length > 0) {
          const valid = rawList
            .map((item: unknown, idx: number) => sanitizeBlogPost(item, idx))
            .filter((p: BlogPost | null): p is BlogPost => p !== null);
          if (valid.length > 0) {
            clearTimeout(timer);
            return valid.slice(0, limit);
          }
        }
      }
    } catch {
      // Fallback to HTML scraping
    }

    // 2. Scrape HTML from blog root
    const blogHtmlUrl = cleanFeed.endsWith("/blog") ? cleanFeed : `${cleanFeed}/blog`;
    try {
      const blogRes = await fetch(blogHtmlUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZekkTechPortfolio/1.0",
        },
        cache: noCache ? "no-store" : "default",
      });

      if (blogRes.ok) {
        const html = await blogRes.text();
        const origin = new URL(cleanFeed).origin;
        const articleRegex = /<a\s+[^>]*href=["'](\/post\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        const parsedPosts: BlogPost[] = [];
        let match;

        while ((match = articleRegex.exec(html)) !== null && parsedPosts.length < limit) {
          const slugPath = match[1];
          const inner = match[2];
          const slug = slugPath.replace(/^\/post\//, "");
          const url = `${origin}${slugPath}`;

          let coverImage = "";
          const imgMatch = inner.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch) {
            const rawSrc = imgMatch[1];
            if (rawSrc.includes("url=")) {
              const urlParam = rawSrc.match(/url=([^&]+)/);
              coverImage = urlParam ? decodeURIComponent(urlParam[1]) : rawSrc;
            } else {
              coverImage = rawSrc.startsWith("http") ? rawSrc : `${origin}${rawSrc.startsWith("/") ? rawSrc : `/${rawSrc}`}`;
            }
          }

          const textClean = inner
            .replace(/<[^>]+>/g, "\n")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);

          parsedPosts.push({
            id: slug,
            title: textClean[2] || slug.replace(/-/g, " "),
            slug,
            excerpt: textClean[3] || "",
            coverImage,
            category: textClean[0] || "Teknologi",
            publishedAt: textClean[1] || "",
            url,
          });
        }

        if (parsedPosts.length > 0) {
          clearTimeout(timer);
          return parsedPosts;
        }
      }
    } catch {
      // Fallback below
    }
  } finally {
    clearTimeout(timer);
  }

  return VERIFIED_BLOG_POSTS.slice(0, limit);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "1";
  const locale = searchParams.get("locale") === "en" ? "en" : "id";
  const rawOnly = searchParams.get("rawSync") === "1";

  const config = await fetchPublishedContent();
  const blogConfig = config.blog;
  const limit = Math.min(Math.max(blogConfig?.displayCount || 4, 1), 12);

  if (rawOnly) {
    const synced = await fetchExternalBlogFeed(
      blogConfig?.feedUrl || "https://zekktech.biz.id",
      limit,
      refresh
    );
    return NextResponse.json(synced, {
      headers: {
        "Cache-Control": refresh
          ? "no-store"
          : "public, s-maxage=900, stale-while-revalidate=3600",
      },
    });
  }

  if (blogConfig?.visible === false || blogConfig?.published === false) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
    });
  }

  const mode = blogConfig?.sourceMode || "hybrid";
  const externalRaw =
    mode === "manual"
      ? []
      : await fetchExternalBlogFeed(
          blogConfig?.feedUrl || "https://zekktech.biz.id",
          limit,
          refresh
        );

  const externalAsManual = externalRaw.map((p, idx) => ({
    id: p.id || p.slug,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    url: p.url,
    category: p.category,
    date: p.publishedAt,
    published: true,
    visible: true,
    sortOrder: idx + 1,
  }));

  const merged = mergeBlogPostsWithOverrides(config, externalAsManual, locale).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage || "",
    coverAlt: p.coverAlt,
    category: p.category,
    publishedAt: p.date,
    readTime: p.readTime,
    url: p.url,
    featured: p.featured,
    pinned: p.pinned,
    source: p.source,
  }));

  return NextResponse.json(merged, {
    headers: {
      "Cache-Control": refresh
        ? "no-store"
        : "public, s-maxage=300, stale-while-revalidate=1800",
    },
  });
}
