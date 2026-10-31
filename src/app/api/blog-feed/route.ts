import { NextResponse } from "next/server";
import { VERIFIED_BLOG_POSTS, sanitizeBlogPost, type BlogPost } from "@/lib/blog-feed";

export const revalidate = 3600; // Cache on Vercel CDN / server for 1 hour

export async function GET() {
  const timeoutMs = 4500;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 1. Try public JSON API if available
    const apiUrl = process.env.BLOG_API_URL || "https://zekktech.biz.id/api/public/posts?limit=3";
    try {
      const apiRes = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "ZekkTech-Portfolio/1.0",
        },
        next: { revalidate: 3600 },
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const valid = data.map((item, idx) => sanitizeBlogPost(item, idx)).filter((p): p is BlogPost => p !== null);
          if (valid.length > 0) {
            clearTimeout(timer);
            return NextResponse.json(valid.slice(0, 3), {
              headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
              },
            });
          }
        }
      }
    } catch {
      // Continue to fallback scraper
    }

    // 2. Fetch live blog HTML to get latest rendered posts if API is not deployed yet
    try {
      const blogRes = await fetch("https://zekktech.biz.id/blog", {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZekkTechPortfolio/1.0",
        },
        next: { revalidate: 3600 },
      });

      if (blogRes.ok) {
        const html = await blogRes.text();
        const articleRegex = /<a\s+[^>]*href=["'](\/post\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        const parsedPosts: BlogPost[] = [];
        let match;

        while ((match = articleRegex.exec(html)) !== null && parsedPosts.length < 3) {
          const slugPath = match[1]; // /post/slug
          const inner = match[2];
          const slug = slugPath.replace(/^\/post\//, "");
          const url = `https://zekktech.biz.id${slugPath}`;

          // Image
          let coverImage = "";
          const imgMatch = inner.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch) {
            const rawSrc = imgMatch[1];
            if (rawSrc.includes("url=")) {
              const urlParam = rawSrc.match(/url=([^&]+)/);
              coverImage = urlParam ? decodeURIComponent(urlParam[1]) : rawSrc;
            } else {
              coverImage = rawSrc;
            }
          }

          // Clean text blocks
          const textClean = inner
            .replace(/<[^>]+>/g, "\n")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);

          const category = textClean[0] || "Teknologi";
          const publishedAt = textClean[1] || "";
          const title = textClean[2] || slug.replace(/-/g, " ");
          const excerpt = textClean[3] || "";

          parsedPosts.push({
            id: slug,
            title,
            slug,
            excerpt,
            coverImage,
            category,
            publishedAt,
            url,
          });
        }

        if (parsedPosts.length > 0) {
          clearTimeout(timer);
          return NextResponse.json(parsedPosts, {
            headers: {
              "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
          });
        }
      }
    } catch {
      // Continue to static fallback
    }

    clearTimeout(timer);
    // 3. Fallback to authentic verified posts
    return NextResponse.json(VERIFIED_BLOG_POSTS.slice(0, 3), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    clearTimeout(timer);
    return NextResponse.json(VERIFIED_BLOG_POSTS.slice(0, 3), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }
}
