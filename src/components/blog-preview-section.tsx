"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";
import {
  BLOG_HOME_URL,
  type BlogPost,
} from "@/lib/blog-feed";
import type { BlogSyncStatus } from "@/lib/site-config";
import { isSafeHttpOrRelativeUrl, resolveBlogSyncMeta } from "@/lib/content/blog-sync";
import {
  getPublishedSectionMeta,
  mergeBlogPostsWithOverrides,
} from "@/lib/content/selectors";
import { ArrowRight, ArrowUpRight, Calendar, Loader2, Newspaper, ChevronLeft, ChevronRight } from "lucide-react";

function canOptimizeBlogCover(src?: string): boolean {
  if (!src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const { protocol, hostname } = new URL(src);
    if (protocol !== "https:") return false;
    const h = hostname.toLowerCase();
    return (
      h.endsWith(".workers.dev") ||
      h.endsWith(".r2.dev") ||
      h.endsWith(".supabase.co") ||
      h === "zekktech.biz.id" ||
      h === "raw.githubusercontent.com" ||
      h === "avatars.githubusercontent.com" ||
      h === "zakariamp.id" ||
      h.endsWith(".zakariamp.id") ||
      h === "zakariamp.my.id" ||
      h.endsWith(".zakariamp.my.id") ||
      h === "zakariamp.vercel.app"
    );
  } catch {
    return false;
  }
}

export function BlogPreviewSection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const isEn = currentLang === "en";
  const locale = isEn ? "en" : "id";

  const config = useSiteConfig();
  const { blog } = config;
  const secMeta = getPublishedSectionMeta(config, "blog", locale);

  const resolvedMeta = resolveBlogSyncMeta(blog);
  const effectiveMode = resolvedMeta.sourceMode;

  const hasInitialCachedPosts = useMemo(() => {
    const hasManual = (blog?.manualPosts || []).some(
      (p) => p.published !== false && p.visible !== false
    );
    const hasSynced = (blog?.syncedPosts || []).some(
      (p) => p.published !== false && p.visible !== false
    );
    return hasManual || hasSynced;
  }, [blog?.manualPosts, blog?.syncedPosts]);

  const [externalSynced, setExternalSynced] = useState<BlogPost[] | undefined>(undefined);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(
    () =>
      blog?.visible !== false &&
      blog?.published !== false &&
      effectiveMode !== "manual" &&
      !hasInitialCachedPosts
  );
  const [syncFetchStatus, setSyncFetchStatus] = useState<BlogSyncStatus>(resolvedMeta.status);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [currentBlogIndex, setCurrentBlogIndex] = useState(0);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (blog?.visible === false || blog?.published === false) return;
    if (effectiveMode === "manual") {
      setIsLoadingFeed(false);
      setExternalSynced(undefined);
      setSyncFetchStatus(resolvedMeta.status);
      return;
    }

    let active = true;
    if (!hasInitialCachedPosts) {
      setIsLoadingFeed(true);
    }

    async function loadLatestPosts() {
      try {
        const res = await fetch("/api/blog-feed", { cache: "no-store" });
        const data = await res.json();
        if (!active) return;

        if (Array.isArray(data)) {
          setExternalSynced(data);
          setSyncFetchStatus(data.length > 0 ? "success_posts" : "success_empty");
          return;
        }

        if (data && typeof data === "object") {
          const nextStatus = (data.status as BlogSyncStatus | undefined) || (data.ok ? "success_posts" : "error");
          setSyncFetchStatus(nextStatus);
          if (data.ok && Array.isArray(data.posts)) {
            setExternalSynced(data.posts);
          } else {
            // Kegagalan sync tidak boleh menimpa/menghapus cache artikel sinkron terakhir
            setExternalSynced(undefined);
          }
        }
      } catch {
        if (active) {
          setSyncFetchStatus("error");
          setExternalSynced(undefined);
        }
      } finally {
        if (active) {
          setIsLoadingFeed(false);
        }
      }
    }
    void loadLatestPosts();
    return () => {
      active = false;
    };
  }, [blog?.visible, blog?.published, effectiveMode, blog?.feedUrl, blog?.displayCount, resolvedMeta.status]);

  const posts = useMemo(() => {
    const asConfig =
      externalSynced !== undefined
        ? externalSynced.map((p, idx) => ({
            id: p.id || p.slug || `sync-${idx + 1}`,
            slug: p.slug || `sync-${idx + 1}`,
            title: p.title,
            excerpt: p.excerpt,
            coverImage: p.coverImage,
            url: p.url,
            category: p.category,
            date: p.publishedAt,
            published: true,
            visible: true,
          }))
        : undefined;
    return mergeBlogPostsWithOverrides(config, asConfig, locale);
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

  const rawBlogUrl = blog?.portalUrl || blog?.feedUrl || BLOG_HOME_URL;
  const blogUrl = isSafeHttpOrRelativeUrl(rawBlogUrl) ? rawBlogUrl : BLOG_HOME_URL;
  const ctaLabel =
    (isEn ? blog?.ctaLabelEn : blog?.ctaLabelId) ||
    t("blog.allPostsBtn", "Lihat Semua Artikel");
  const displayHost = blogUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const mdSeeAllSpan = posts.length % 2 === 0 ? "md:col-span-2" : "md:col-span-1";
  const lgSeeAllSpan = ["lg:col-span-3", "lg:col-span-2", "lg:col-span-1"][posts.length % 3];

  const renderEmptyOrStatusState = () => {
    if (isLoadingFeed && effectiveMode !== "manual") {
      return (
        <div
          role="status"
          aria-live="polite"
          data-blog-state="loading"
          className="rounded-2xl border border-line/60 bg-white/60 p-10 text-center text-xs text-muted dark:border-line/40 dark:bg-[#111422]/60 flex flex-col items-center justify-center gap-2.5"
        >
          <Loader2 className="size-5 animate-spin text-brand dark:text-blue-400" />
          <span>
            {isEn ? "Syncing latest articles from blog feed..." : "Memuat artikel terbaru dari sumber blog..."}
          </span>
        </div>
      );
    }

    if (effectiveMode !== "manual" && syncFetchStatus === "error") {
      return (
        <div
          data-blog-state="error"
          className="rounded-2xl border border-amber-500/30 bg-amber-50/70 p-8 sm:p-10 text-center text-xs text-muted dark:border-amber-500/25 dark:bg-amber-950/20 flex flex-col items-center gap-3"
        >
          <p className="text-ink font-semibold text-sm">
            {isEn ? "Blog feed could not be loaded right now." : "Feed blog belum dapat dimuat saat ini."}
          </p>
          <p className="max-w-md leading-relaxed">
            {isEn
              ? "External feed synchronization encountered an error and no cached articles are stored yet. You can read articles directly on the blog portal."
              : "Sinkronisasi feed eksternal mengalami kendala dan belum ada cache artikel tersimpan. Anda tetap dapat membaca artikel langsung melalui portal blog."}
          </p>
          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold text-ink hover:border-brand/50 transition-colors dark:bg-[#111422] dark:border-line/60"
          >
            <span>{ctaLabel}</span>
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      );
    }

    if (effectiveMode !== "manual" && syncFetchStatus === "never") {
      return (
        <div
          data-blog-state="never"
          className="rounded-2xl border border-line/60 bg-white/60 p-10 text-center text-xs text-muted dark:border-line/40 dark:bg-[#111422]/60"
        >
          {isEn
            ? "Blog feed has not been synced yet and no manual articles are published."
            : "Sumber blog belum pernah disinkronkan dan belum ada artikel manual yang dipublikasikan."}
        </div>
      );
    }

    return (
      <div
        data-blog-state={syncFetchStatus === "success_empty" ? "empty" : "manual-empty"}
        className="rounded-2xl border border-line/60 bg-white/60 p-10 text-center text-xs text-muted dark:border-line/40 dark:bg-[#111422]/60"
      >
        {isEn ? "No blog articles are displayed right now." : "Belum ada artikel yang dipublikasikan saat ini."}
      </div>
    );
  };

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
          renderEmptyOrStatusState()
        ) : (
          <>
            {/* MOBILE ONLY: Single-Card Carousel dengan Swipe & Navigasi Kiri/Kanan Flanking */}
            {(() => {
              const totalBlogSlides = posts.length + 1;
              const isCtaSlide = currentBlogIndex === posts.length;

              const handlePrevBlog = () => {
                setCurrentBlogIndex((prev) => Math.max(0, prev - 1));
              };

              const handleNextBlog = () => {
                setCurrentBlogIndex((prev) => Math.min(totalBlogSlides - 1, prev + 1));
              };

              const handleBlogTouchStart = (e: React.TouchEvent) => {
                touchStartXRef.current = e.touches[0].clientX;
                touchStartYRef.current = e.touches[0].clientY;
              };

              const handleBlogTouchEnd = (e: React.TouchEvent) => {
                if (touchStartXRef.current === null || touchStartYRef.current === null) return;
                const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
                const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
                  if (deltaX < 0) {
                    handleNextBlog();
                  } else {
                    handlePrevBlog();
                  }
                }
                touchStartXRef.current = null;
                touchStartYRef.current = null;
              };

              return (
                <div
                  className="md:hidden"
                  onTouchStart={handleBlogTouchStart}
                  onTouchEnd={handleBlogTouchEnd}
                >
                  {/* Flanking Layout: Tombol Kiri, Kartu di Tengah, Tombol Kanan */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Tombol Kiri (Sebelumnya) */}
                    <button
                      type="button"
                      onClick={handlePrevBlog}
                      disabled={currentBlogIndex === 0}
                      aria-label={isEn ? "Previous article" : "Artikel sebelumnya"}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line/80 bg-white text-ink shadow-sm transition-all disabled:opacity-20 disabled:pointer-events-none hover:border-brand/40 active:scale-95 dark:border-line/60 dark:bg-[#111422] dark:text-white"
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    {/* Slide Content di Tengah */}
                    <div className="min-w-0 flex-1">
                      {!isCtaSlide ? (
                        (() => {
                          const post = posts[currentBlogIndex];
                          if (!post) return null;
                          const hasError = imageErrors[post.id];

                          return (
                            <a
                              key={post.id}
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white p-3.5 transition-colors duration-200 hover:border-brand/40 dark:border-line/60 dark:bg-[#111422] min-h-[300px]"
                            >
                              <div>
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-line/50 dark:border-line/30">
                                  {post.coverImage && !hasError ? (
                                    canOptimizeBlogCover(post.coverImage) ? (
                                      <Image
                                        src={post.coverImage}
                                        alt={post.coverAlt || post.title}
                                        fill
                                        sizes="(max-width: 767px) 92vw, 320px"
                                        loading="lazy"
                                        onError={() => handleImageError(post.id)}
                                        className="object-cover"
                                      />
                                    ) : (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={post.coverImage}
                                        alt={post.coverAlt || post.title}
                                        width={640}
                                        height={360}
                                        loading="lazy"
                                        decoding="async"
                                        onError={() => handleImageError(post.id)}
                                        className="size-full object-cover"
                                      />
                                    )
                                  ) : (
                                    <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-muted bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
                                      <Newspaper className="size-7 text-brand/60 dark:text-blue-400/60" />
                                      <span className="font-display text-xs font-bold tracking-tight text-ink">
                                        {config.generalProfile?.brand || "ZekkTech"} Blog
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-muted">
                                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                                    {post.date ? (
                                      <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                                        <Calendar className="size-3 text-brand/70 dark:text-blue-400/70" />
                                        {post.date}
                                      </span>
                                    ) : (
                                      <span className="font-mono text-[10px]">
                                        {blogUrl.replace(/^https?:\/\//, "").split("/")[0]}
                                      </span>
                                    )}
                                    {post.category && (
                                      <>
                                        <span className="text-muted/45" aria-hidden="true">·</span>
                                        <span className="truncate text-[10px] font-medium text-muted">
                                          {post.category}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  <span className="text-[11px] font-medium text-brand dark:text-blue-400 inline-flex items-center gap-0.5">
                                    <span>{t("blog.readBtn", "Baca")}</span>
                                    <ArrowUpRight className="size-3" />
                                  </span>
                                </div>

                                <h3 className="mt-2 font-display text-xs sm:text-sm font-bold tracking-tight text-ink line-clamp-2 leading-snug">
                                  {post.title}
                                </h3>

                                {post.excerpt && (
                                  <p className="mt-1 text-[11px] leading-relaxed text-body line-clamp-2">
                                    {post.excerpt}
                                  </p>
                                )}
                              </div>
                            </a>
                          );
                        })()
                      ) : (
                        /* Slide CTA: Lihat Semua Artikel */
                        <a
                          href={blogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-dashed border-brand/50 bg-brand/[0.03] p-4.5 dark:border-blue-500/50 dark:bg-blue-500/[0.06] min-h-[300px]"
                        >
                          <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 text-xs font-mono text-muted">
                              <span className="flex size-6 items-center justify-center rounded-lg border border-line/70 bg-white text-brand dark:border-line/50 dark:bg-[#161b2e] dark:text-blue-400">
                                <Newspaper className="size-3.5" />
                              </span>
                              <span className="truncate">{displayHost}</span>
                            </div>

                            <h3 className="font-display text-sm font-bold tracking-tight text-ink group-hover:text-brand dark:group-hover:text-blue-400 transition-colors">
                              {ctaLabel}
                            </h3>

                            <p className="text-xs leading-relaxed text-body">
                              {isEn
                                ? "Read full technical articles, design notes, and the complete archive on ZekkTech Blog."
                                : "Baca seluruh artikel teknologi, catatan desain, dan arsip tulisan lengkap langsung di ZekkTech Blog."}
                            </p>
                          </div>

                          <div className="inline-flex items-center gap-2 self-start rounded-xl border border-brand/40 bg-white px-3 py-1.5 text-xs font-semibold text-brand dark:border-line/60 dark:bg-[#161b2e] dark:text-blue-400">
                            <span>{isEn ? "Open Blog Portal" : "Buka Portal Blog"}</span>
                            <ArrowUpRight className="size-3.5" />
                          </div>
                        </a>
                      )}
                    </div>

                    {/* Tombol Kanan (Berikutnya) */}
                    <button
                      type="button"
                      onClick={handleNextBlog}
                      disabled={isCtaSlide}
                      aria-label={isEn ? "Next article" : "Artikel berikutnya"}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line/80 bg-white text-ink shadow-sm transition-all disabled:opacity-20 disabled:pointer-events-none hover:border-brand/40 active:scale-95 dark:border-line/60 dark:bg-[#111422] dark:text-white"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>

                  {/* Indikator Posisi di Bawah (Hanya info teks, bukan kontrol tombol) */}
                  <div className="mt-2.5 flex items-center justify-center gap-1.5">
                    <span data-carousel-indicator className="font-mono text-[11px] font-semibold text-muted">
                      {currentBlogIndex + 1} / {totalBlogSlides}
                    </span>
                    {isCtaSlide && (
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[9px] font-semibold text-brand dark:bg-blue-500/15 dark:text-blue-400">
                        CTA
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* DESKTOP ONLY: Grid 2/3 Kolom Asli */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {posts.map((post) => {
                const hasError = imageErrors[post.id];

                return (
                  <a
                    key={post.id}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white p-4 sm:p-5 transition-colors duration-200 hover:border-brand/40 dark:border-line/60 dark:bg-[#111422] dark:hover:border-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <div>
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-line/50 dark:border-line/30">
                        {post.coverImage && !hasError ? (
                          canOptimizeBlogCover(post.coverImage) ? (
                            <Image
                              src={post.coverImage}
                              alt={post.coverAlt || post.title}
                              fill
                              sizes="(max-width: 1023px) 46vw, 320px"
                              loading="lazy"
                              onError={() => handleImageError(post.id)}
                              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.coverImage}
                              alt={post.coverAlt || post.title}
                              width={640}
                              height={360}
                              loading="lazy"
                              decoding="async"
                              onError={() => handleImageError(post.id)}
                              className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                            />
                          )
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
          </>
        )}
      </ScrollReveal>
    </section>
  );
}
