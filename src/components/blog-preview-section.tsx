"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";
import {
  BLOG_HOME_URL,
  type BlogPost,
} from "@/lib/blog-feed";
import {
  getPublishedSectionMeta,
  mergeBlogPostsWithOverrides,
} from "@/lib/content/selectors";
import { ArrowRight, ArrowUpRight, Calendar, Newspaper } from "lucide-react";

export function BlogPreviewSection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const isEn = currentLang === "en";
  const locale = isEn ? "en" : "id";

  const config = useSiteConfig();
  const { blog } = config;
  const secMeta = getPublishedSectionMeta(config, "blog", locale);

  const [externalSynced, setExternalSynced] = useState<BlogPost[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (blog?.visible === false || blog?.published === false) return;
    if (blog?.sourceMode === "manual") return;

    let active = true;
    async function loadLatestPosts() {
      try {
        const res = await fetch("/api/blog-feed?rawSync=1", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data)) {
            setExternalSynced(data);
          }
        }
      } catch {
        // Fallback to stored syncedPosts / manualPosts in config
      }
    }
    void loadLatestPosts();
    return () => {
      active = false;
    };
  }, [blog?.visible, blog?.published, blog?.sourceMode, blog?.feedUrl, blog?.displayCount]);

  const posts = useMemo(() => {
    const asConfig = externalSynced.map((p, idx) => ({
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
    return mergeBlogPostsWithOverrides(
      config,
      asConfig.length > 0 ? asConfig : undefined,
      locale
    );
  }, [config, externalSynced, locale]);

  if (blog?.visible === false || blog?.published === false) {
    return null;
  }

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const sectionTitle =
    (isEn ? blog?.titleEn : blog?.titleId) ||
    secMeta.title ||
    t("blog.title", "Latest from ZekkTech Blog");

  const sectionDesc =
    (isEn ? blog?.descEn : blog?.descId) ||
    secMeta.desc ||
    t("blog.desc", "Notes, thoughts, and technical articles on design and web engineering.");

  const blogUrl = blog?.portalUrl || blog?.feedUrl || BLOG_HOME_URL;
  const ctaLabel =
    (isEn ? blog?.ctaLabelEn : blog?.ctaLabelId) ||
    t("blog.allPostsBtn", "Lihat Semua Artikel");
  const displayHost = blogUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const mdSeeAllSpan = posts.length % 2 === 0 ? "md:col-span-2" : "md:col-span-1";
  const lgSeeAllSpan = ["lg:col-span-3", "lg:col-span-2", "lg:col-span-1"][posts.length % 3];

  return (
    <section
      id="blog"
      className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
      aria-label={sectionTitle}
    >
      <div id="artikel" className="absolute top-0 -mt-24" aria-hidden="true" />

      <ScrollReveal y={24} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <SectionTitle title={sectionTitle} desc={sectionDesc} />

          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand dark:text-blue-400 hover:text-brand-ink dark:hover:text-blue-300 transition-colors group shrink-0 self-start sm:self-auto pb-1"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-line/60 bg-white/60 p-10 text-center text-xs text-muted dark:border-line/40 dark:bg-[#111422]/60">
            {isEn ? "No blog articles are displayed right now." : "Belum ada artikel blog yang ditampilkan."}
          </div>
        ) : (
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
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white p-4 sm:p-5 transition-colors duration-200 hover:border-brand/40 dark:border-line/60 dark:bg-[#111422] dark:hover:border-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-line/50 dark:border-line/30">
                      {post.coverImage && !hasError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.coverImage}
                          alt={post.coverAlt || post.title}
                          loading="eager"
                          decoding="async"
                          onError={() => handleImageError(post.id)}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                        />
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-muted bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
                          <Newspaper className="size-8 text-brand/60 dark:text-blue-400/60" />
                          <span className="font-display text-xs font-bold tracking-tight text-ink">
                            {config.generalProfile?.brand || "ZekkTech"} Blog
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3.5 flex items-center justify-between gap-2 text-xs text-muted">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                        {post.date ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                            <Calendar className="size-3 text-brand/70 dark:text-blue-400/70" />
                            {post.date}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px]">
                            {blogUrl.replace(/^https?:\/\//, "").split("/")[0]}
                          </span>
                        )}
                        {post.category && (
                          <>
                            <span className="text-muted/45" aria-hidden="true">·</span>
                            <span className="truncate text-[11px] font-medium text-muted">
                              {post.category}
                            </span>
                          </>
                        )}
                      </div>

                      <span className="text-[11px] font-medium text-brand dark:text-blue-400 inline-flex items-center gap-0.5">
                        <span>{t("blog.readBtn", "Baca")}</span>
                        <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-base font-bold tracking-tight text-ink group-hover:text-brand dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-body line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}

            {/* Kartu ke-5: Lihat Semua mengarah langsung ke ZekkTech Blog */}
            <a
              href={blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-blog-see-all="true"
              aria-label={`${ctaLabel} (${displayHost})`}
              className={`group relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-dashed border-line/90 bg-slate-50/75 p-5 sm:p-6 transition-colors duration-200 hover:border-brand/50 hover:bg-brand/[0.03] dark:border-line/60 dark:bg-[#111422]/75 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${mdSeeAllSpan} ${lgSeeAllSpan}`}
            >
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-muted">
                  <span className="flex size-8 items-center justify-center rounded-lg border border-line/70 bg-white text-brand dark:border-line/50 dark:bg-[#161b2e] dark:text-blue-400">
                    <Newspaper className="size-4" />
                  </span>
                  <span className="truncate">{displayHost}</span>
                </div>

                <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink group-hover:text-brand dark:group-hover:text-blue-400 transition-colors">
                  {ctaLabel}
                </h3>

                <p className="max-w-lg text-xs sm:text-sm leading-relaxed text-body">
                  {isEn
                    ? "Read full technical articles, design notes, and the complete archive on ZekkTech Blog."
                    : "Baca seluruh artikel teknologi, catatan desain, dan arsip tulisan lengkap langsung di ZekkTech Blog."}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-xl border border-line/80 bg-white px-4 py-2 text-xs font-semibold text-ink transition-colors duration-200 group-hover:border-brand/40 group-hover:text-brand dark:border-line/60 dark:bg-[#161b2e] dark:text-slate-200 dark:group-hover:border-blue-500/50 dark:group-hover:text-blue-400">
                <span>{isEn ? "View All on Blog" : "Lihat Semua Artikel"}</span>
                <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
              </div>
            </a>
          </div>
        )}
      </ScrollReveal>
    </section>
  );
}
