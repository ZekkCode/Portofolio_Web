"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import {
  VERIFIED_BLOG_POSTS,
  BLOG_HOME_URL,
  type BlogPost,
} from "@/lib/blog-feed";
import { ArrowRight, ArrowUpRight, Calendar, Newspaper } from "lucide-react";

export function BlogPreviewSection() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>(VERIFIED_BLOG_POSTS);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    async function loadLatestPosts() {
      try {
        const res = await fetch("/api/blog-feed", { cache: "default" });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            setPosts(data.slice(0, 3));
          }
        }
      } catch {
        // Keeps verified fallback posts silently
      }
    }
    void loadLatestPosts();
    return () => {
      active = false;
    };
  }, []);

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section
      id="blog"
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
      aria-label="Latest from ZekkTech Blog"
    >
      {/* Anchor alias for url-friendly Indonesian navigation */}
      <div id="artikel" className="absolute top-0 -mt-24" aria-hidden="true" />

      <ScrollReveal y={24} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <SectionTitle
            title={t("blog.title", "Latest from ZekkTech Blog")}
            desc={t(
              "blog.desc",
              "Catatan, pembahasan, dan artikel seputar teknologi serta dunia digital."
            )}
          />

          <a
            href={BLOG_HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand dark:text-blue-400 hover:text-brand-ink dark:hover:text-blue-300 transition-colors group shrink-0 self-start sm:self-auto pb-1"
          >
            <span>{t("blog.allPostsBtn", "Lihat Semua Artikel")}</span>
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>

        {/* 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {posts.map((post) => {
            const hasError = imageErrors[post.id];

            return (
              <a
                key={post.id}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${post.title} (Buka di tab baru)`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-300 hover:border-brand/50 hover:shadow-md hover:-translate-y-1 dark:border-line/60 dark:bg-[#111422] dark:hover:border-blue-500/50 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <div>
                  {/* Thumbnail Container (16:9 aspect ratio, overflow hidden) */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-line/50 dark:border-line/30">
                    {post.coverImage && !hasError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        loading="lazy"
                        onError={() => handleImageError(post.id)}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-muted bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
                        <Newspaper className="size-8 text-brand/60 dark:text-blue-400/60" />
                        <span className="font-display text-xs font-bold tracking-tight text-ink">
                          ZekkTech Blog
                        </span>
                      </div>
                    )}

                    {/* Category Pill Tag on Thumbnail */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center rounded-md bg-white/90 dark:bg-black/80 px-2 py-0.5 text-[10.5px] font-semibold text-brand dark:text-blue-400 backdrop-blur-xs shadow-2xs border border-white/20">
                        {post.category || "Teknologi"}
                      </span>
                    </div>
                  </div>

                  {/* Date & Metadata */}
                  <div className="mt-3.5 flex items-center justify-between text-xs text-muted">
                    {post.publishedAt ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                        <Calendar className="size-3 text-brand/70 dark:text-blue-400/70" />
                        {post.publishedAt}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px]">ZekkTech Blog</span>
                    )}

                    <span className="text-[11px] text-muted group-hover:text-brand dark:group-hover:text-blue-400 transition-colors inline-flex items-center gap-0.5">
                      <span>Baca</span>
                      <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-2.5 font-display text-base font-bold tracking-tight text-ink group-hover:text-brand dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  {/* Excerpt limited to 2-3 lines */}
                  {post.excerpt && (
                    <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-body line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </div>

                {/* Subtle Bottom Accent Indicator */}
                <div className="mt-4 pt-3 border-t border-line/40 dark:border-line/20 flex items-center justify-between text-[11px] font-medium text-muted">
                  <span className="font-mono text-brand/80 dark:text-blue-400/80">zekktech.biz.id</span>
                  <span className="text-body group-hover:text-ink transition-colors">Tab Baru</span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Mobile View All CTA Button */}
        <div className="mt-8 flex justify-center sm:hidden">
          <a
            href={BLOG_HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line bg-white px-6 py-2.5 text-xs font-semibold text-ink shadow-2xs transition-all hover:bg-brand/5 hover:border-brand/40 hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:text-slate-200 dark:hover:bg-brand/10 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span>{t("blog.allPostsBtn", "Lihat Semua Artikel")}</span>
            <ArrowRight className="size-3.5" />
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}
