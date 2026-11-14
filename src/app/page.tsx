"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { LanyardStage } from "@/components/lanyard-stage";
import { Parallax, ScrollReveal, SmoothNavLink } from "@/components/parallax";
import { PortfolioPillNav } from "@/components/portfolio-pill-nav";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SectionTitle } from "@/components/section-title";
import ShapeGrid from "@/components/shape-grid";
import { BackgroundStickers } from "@/components/background-stickers";
import { LanguageToggle, ThemeToggle } from "@/components/theme-language-toggle";
import { AnimatedEye } from "@/components/animated-eye";
import { usePageViews } from "@/lib/use-page-views";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import { useAdaptivePerformance } from "@/lib/device-performance";
import { useSiteConfig, type SectionKey } from "@/lib/site-store";
import {
  getOrderedSectionKeys,
  getPublishedContact,
  getPublishedExperience,
  getPublishedFooter,
  getPublishedProfile,
  getPublishedSectionMeta,
  getPublishedSeo,
  getPublishedStats,
  getPublishedTechStack,
  getPublishedTechStackCategories,
  isSectionVisible,
} from "@/lib/content/selectors";
import { ArrowRight, Mail } from "lucide-react";
import { AcademicJourneySection } from "@/components/academic-journey-section";
import { AchievementsSection } from "@/components/achievements-section";
import { AboutPersonaCard } from "@/components/about-persona-card";
import { ExperienceTimeline } from "@/components/experience-timeline";
import { ServicesSection } from "@/components/services-section";
import { ProjectsSection } from "@/components/projects-section";
import { BlogPreviewSection } from "@/components/blog-preview-section";
import { CertificatesSection } from "@/components/certificates-section";
import { FaqSection } from "@/components/faq-section";
import { SocialIcon, getSocialHoverClasses } from "@/components/social-icon";
import { AnimatedHeroTitle } from "@/components/animated-hero-title";
import { ContactForm } from "@/components/contact-form";

// Dynamically code-split heavy 3D/physics modules
const DynamicCvFolderSection = dynamic(
  () => import("@/components/cv-folder-section").then((m) => m.CvFolderSection),
  {
    ssr: false,
    loading: () => (
      <section id="cv" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28 min-h-[520px]">
        <div id="resume" className="absolute top-0 -mt-24" aria-hidden="true" />
      </section>
    ),
  }
);

const DynamicProfileCardStage = dynamic(
  () => import("@/components/profile-card-stage").then((m) => m.ProfileCardStage),
  {
    ssr: false,
    loading: () => (
      <div className="w-[280px] sm:w-[320px] aspect-[1/1.5] rounded-2xl bg-slate-100/60 dark:bg-slate-800/30 border border-line/60" />
    ),
  }
);

function Header() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const config = useSiteConfig();
  const pubProfile = getPublishedProfile(config, locale);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 pt-[env(safe-area-inset-top,0px)] dark:border-line dark:bg-[#08090e]/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-5">
        <SmoothNavLink
          href="#atas"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {config.headerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.headerLogoUrl}
              alt={pubProfile.brand}
              className="size-7.5 rounded-full object-cover border border-brand/30"
            />
          ) : (
            <div className="flex size-7.5 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-ink text-xs font-black tracking-wider text-white">
              {pubProfile.brand ? pubProfile.brand.charAt(0) : "Z"}
            </div>
          )}
          <span className="font-display text-base font-bold tracking-tight text-ink">
            {pubProfile.brand}
          </span>
        </SmoothNavLink>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <LanguageToggle />
          <ThemeToggle />
          <a
            href={`mailto:${pubProfile.email}`}
            className="hidden md:inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-ink active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <Mail className="size-4" />
            <span>{t("nav.contactBtn")}</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const config = useSiteConfig();
  const pubProfile = getPublishedProfile(config, locale);

  const primaryHref = pubProfile.ctaPrimaryHref || `mailto:${pubProfile.email}`;
  const secondaryHref = pubProfile.ctaSecondaryHref || "#cv";

  return (
    <section
      id="atas"
      className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 pt-3 sm:pt-8 lg:pt-10 pb-6 sm:pb-8"
    >
      <div id="hero" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div className="grid items-start gap-3 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        {/* Left Column: Editorial Information */}
        <div className="relative z-10 flex w-full flex-col items-center lg:items-start gap-4 sm:gap-5 text-center lg:text-start order-2 lg:order-1 pt-0 lg:pt-6">
          <div className="space-y-2.5 w-full max-w-xl mx-auto lg:mx-0">
            <AnimatedHeroTitle
              name={pubProfile.name}
              className="w-full justify-center text-center lg:justify-start lg:text-start"
            />
            <ScrollReveal y={16} duration={0.65} delay={0.12} className="w-full">
              <p className="text-base sm:text-lg font-semibold text-body">
                {pubProfile.roles || t("hero.roles")}
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal y={18} duration={0.65} delay={0.2} className="space-y-5 w-full max-w-xl mx-auto lg:mx-0">
            <p className="text-sm sm:text-base leading-relaxed text-body">
              {pubProfile.heroDesc || t("hero.desc")}
            </p>

            {/* Action Buttons */}
            <div className="relative z-40 flex flex-col sm:flex-row w-full max-w-[280px] sm:max-w-none mx-auto lg:mx-0 lg:w-auto items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-1">
              {primaryHref.startsWith("#") ? (
                <SmoothNavLink
                  href={primaryHref}
                  className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-ink active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <Mail className="size-4" />
                  <span>{pubProfile.ctaPrimaryLabel || t("hero.emailBtn", "Kirim Email")}</span>
                </SmoothNavLink>
              ) : (
                <a
                  href={primaryHref}
                  className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-ink active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <Mail className="size-4" />
                  <span>{pubProfile.ctaPrimaryLabel || t("hero.emailBtn", "Kirim Email")}</span>
                </a>
              )}

              {secondaryHref.startsWith("#") ? (
                <SmoothNavLink
                  href={secondaryHref}
                  className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl border border-line/80 bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-brand/5 hover:border-brand/40 hover:text-brand active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/60 dark:text-slate-200 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
                >
                  <span>{pubProfile.ctaSecondaryLabel || t("hero.cvBtn", "Folder Berkas Karir")}</span>
                  <ArrowRight className="size-3.5" />
                </SmoothNavLink>
              ) : (
                <a
                  href={secondaryHref}
                  className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl border border-line/80 bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-brand/5 hover:border-brand/40 hover:text-brand active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/60 dark:text-slate-200 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
                >
                  <span>{pubProfile.ctaSecondaryLabel || t("hero.cvBtn", "Folder Berkas Karir")}</span>
                  <ArrowRight className="size-3.5" />
                </a>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* Right Column: Interactive 3D Lanyard ID Card */}
        <div className="relative flex flex-col items-center justify-center lg:items-end w-full order-1 lg:order-2 z-20">
          <div className="relative w-full max-w-[330px] sm:max-w-[400px] lg:max-w-[460px] h-[268px] min-[390px]:h-[320px] sm:h-[400px] lg:h-[440px] -mt-6 sm:-mt-10 lg:-mt-[56px]">
            <LanyardStage className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const config = useSiteConfig();

  const pubProfile = getPublishedProfile(config, locale);
  const sectionMeta = getPublishedSectionMeta(config, "about", locale);
  const resolvedStats = getPublishedStats(config);
  const publishedExperience = getPublishedExperience(config, locale);

  const statItems = [
    { value: String(resolvedStats.projectsCount), key: "projects" },
    { value: String(resolvedStats.certificatesCount), key: "certificates" },
    { value: resolvedStats.experienceYears, key: "years" },
    { value: String(resolvedStats.organizationsCount), key: "organizations" },
  ];

  return (
    <section id="tentang" className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 pt-6 pb-14 sm:pt-8 sm:pb-16">
      <div id="about" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div id="about-me" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          eyebrow={sectionMeta.eyebrow || undefined}
          title={sectionMeta.title || t("about.title")}
          desc={sectionMeta.desc || t("about.desc")}
        />
      </ScrollReveal>

      <div className="space-y-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-12 items-start">
          <div className="space-y-7 min-w-0">
            {pubProfile.bio.length > 0 && (
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-body">
                {pubProfile.bio.map((par, idx) => (
                  <p key={`${idx}-${par.slice(0, 24)}`}>{par}</p>
                ))}
              </div>
            )}

            {/* Dynamic Interval-Merged Typographic Stat Ledger */}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-line/70 pt-5 dark:border-line/50">
              {statItems.map((stat) => (
                <div
                  key={stat.key}
                  className="border-l-2 border-brand/25 pl-3.5 dark:border-blue-400/25"
                >
                  <dt className="text-xs font-medium text-muted">
                    {t(`about.stats.${stat.key}`)}
                  </dt>
                  <dd className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-ink leading-none">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Interactive Layered Role ID Card Stack */}
          <Parallax speed={0.05}>
            <AboutPersonaCard />
          </Parallax>
        </div>

        {/* Full-width Horizontal Career Experience Timeline (hidden cleanly when empty) */}
        {publishedExperience.length > 0 && (
          <div className="pt-8 border-t border-line/60 dark:border-line/40">
            <ExperienceTimeline />
          </div>
        )}
      </div>
    </section>
  );
}

function Stack() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const config = useSiteConfig();

  const sectionMeta = getPublishedSectionMeta(config, "stack", locale);
  const stackCategories = useMemo(
    () => getPublishedTechStackCategories(config, locale),
    [config, locale]
  );
  const gridToolsAll = useMemo(
    () => getPublishedTechStack(config, undefined, { gridOnly: true, locale }),
    [config, locale]
  );
  const marqueeTools = useMemo(
    () => getPublishedTechStack(config, undefined, { marqueeOnly: true, locale }),
    [config, locale]
  );

  const marqueeRef = useRef<HTMLDivElement>(null);
  const [isStackVisible, setIsStackVisible] = useState(false);

  useEffect(() => {
    const el = marqueeRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsStackVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsStackVisible(entry.isIntersecting),
      { rootMargin: "160px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const disciplines = useMemo(() => {
    const grouped = stackCategories
      .map((cat) => ({
        key: cat.key,
        category: cat.label,
        tools: gridToolsAll.filter((s) => s.category === cat.key),
      }))
      .filter((d) => d.tools.length > 0);

    // Include tools whose category isn't in standard category list if any
    const knownKeys = new Set(stackCategories.map((c) => c.key));
    const orphans = gridToolsAll.filter((s) => !knownKeys.has(s.category));
    if (orphans.length > 0) {
      grouped.push({
        key: "other",
        category: locale === "en" ? "Other Tools" : "Perangkat Lainnya",
        tools: orphans,
      });
    }
    return grouped;
  }, [stackCategories, gridToolsAll, locale]);

  const marqueeSeed = marqueeTools.length > 0 ? marqueeTools : [];
  const stackRow1 = useMemo(
    () => (marqueeSeed.length > 0 ? Array.from({ length: 4 }, () => marqueeSeed).flat() : []),
    [marqueeSeed]
  );
  const stackRow2 = useMemo(() => {
    if (marqueeSeed.length === 0) return [];
    const offsetCount = Math.floor(marqueeSeed.length / 2) || 1;
    const offsetTools = [
      ...marqueeSeed.slice(offsetCount),
      ...marqueeSeed.slice(0, offsetCount),
    ];
    return Array.from({ length: 4 }, () => offsetTools).flat();
  }, [marqueeSeed]);

  return (
    <section id="stack" className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="tech-stack" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          eyebrow={sectionMeta.eyebrow || undefined}
          title={sectionMeta.title || t("stack.title")}
          desc={sectionMeta.desc || t("stack.desc")}
        />
      </ScrollReveal>

      {disciplines.length === 0 && marqueeSeed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/80 bg-white/50 p-10 text-center dark:border-line/40 dark:bg-[#111422]/50">
          <p className="text-sm font-medium text-muted">
            {locale === "en"
              ? "No tech stack tools are currently published."
              : "Belum ada daftar teknologi yang ditampilkan."}
          </p>
        </div>
      ) : (
        <>
          {disciplines.length > 0 && (
            <ScrollReveal y={20}>
              <div className="grid gap-4 sm:grid-cols-2 mb-8 auto-rows-fr items-stretch">
                {disciplines.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-col justify-between rounded-xl border border-line/80 bg-white p-5 sm:p-6 dark:border-line/60 dark:bg-[#111422]"
                  >
                    <div>
                      <h3 className="font-display text-base font-bold text-ink">
                        {item.category}
                      </h3>

                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {item.tools.map((tool) => {
                          const content = (
                            <>
                              {tool.icon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={tool.icon}
                                  alt={tool.name}
                                  width={14}
                                  height={14}
                                  loading="lazy"
                                  decoding="async"
                                  className={`size-3.5 shrink-0 object-contain ${
                                    tool.name === "GitHub" || tool.name === "CapCut" || tool.name === "Next.js"
                                      ? "dark:invert"
                                      : ""
                                  }`}
                                />
                              )}
                              <span>{tool.name}</span>
                            </>
                          );

                          if (tool.url) {
                            return (
                              <a
                                key={tool.id || tool.name}
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={tool.desc || tool.name}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-line/60 px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-brand/50 hover:text-brand dark:border-line/40"
                              >
                                {content}
                              </a>
                            );
                          }

                          return (
                            <span
                              key={tool.id || tool.name}
                              title={tool.desc || tool.name}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line/60 px-2.5 py-1 text-xs font-medium text-ink dark:border-line/40"
                            >
                              {content}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* Seamless Dual-Direction Ribbon Ticker */}
          {marqueeSeed.length > 0 && (
            <div
              ref={marqueeRef}
              className={`relative w-full overflow-hidden py-6 sm:py-8 space-y-4 [contain:layout_paint]${
                isStackVisible ? "" : " marquee-paused"
              }`}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 sm:w-24 bg-gradient-to-r from-[var(--bg-page)] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 sm:w-24 bg-gradient-to-l from-[var(--bg-page)] to-transparent" />

              <div className="animate-marquee flex items-center gap-3.5 sm:gap-4 py-2">
                {stackRow1.map((tool, idx) => (
                  <div
                    key={`row1-${tool.id}-${idx}`}
                    aria-hidden={idx >= marqueeSeed.length ? "true" : undefined}
                    className="group/tool relative flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl border border-line/70 bg-white/95 p-2.5 transition-colors duration-200 hover:z-30 hover:border-brand/40 hover:bg-white dark:border-line/40 dark:bg-slate-900/90 dark:hover:border-blue-500/40 dark:hover:bg-slate-900 cursor-default"
                    title={tool.desc ? `${tool.name} — ${tool.desc}` : tool.name}
                    aria-label={tool.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tool.icon}
                      alt={tool.name}
                      width={28}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className={`size-7 object-contain transition-all duration-300 grayscale opacity-60 contrast-75 dark:opacity-45 group-hover/tool:grayscale-0 group-hover/tool:opacity-100 group-hover/tool:scale-110 ${
                        tool.name === "GitHub" || tool.name === "CapCut" || tool.name === "Next.js"
                          ? "dark:invert"
                          : ""
                      }`}
                    />

                    <span
                      role="tooltip"
                      className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 scale-90 group-hover/tool:opacity-100 group-hover/tool:scale-100 transition-all duration-200 z-30 whitespace-nowrap rounded-md bg-slate-900/95 px-2.5 py-0.5 text-[11px] font-medium text-white shadow-md dark:bg-white dark:text-slate-900 dark:border dark:border-slate-200 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900/95 dark:after:border-t-white"
                    >
                      {tool.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="animate-marquee-reverse flex items-center gap-3.5 sm:gap-4 py-2" aria-hidden="true">
                {stackRow2.map((tool, idx) => (
                  <div
                    key={`row2-${tool.id}-${idx}`}
                    className="group/tool relative flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl border border-line/70 bg-white/95 p-2.5 transition-colors duration-200 hover:z-30 hover:border-brand/40 hover:bg-white dark:border-line/40 dark:bg-slate-900/90 dark:hover:border-blue-500/40 dark:hover:bg-slate-900 cursor-default"
                    title={tool.desc ? `${tool.name} — ${tool.desc}` : tool.name}
                    aria-label={tool.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tool.icon}
                      alt={tool.name}
                      width={28}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className={`size-7 object-contain transition-all duration-300 grayscale opacity-60 contrast-75 dark:opacity-45 group-hover/tool:grayscale-0 group-hover/tool:opacity-100 group-hover/tool:scale-110 ${
                        tool.name === "GitHub" || tool.name === "CapCut" || tool.name === "Next.js"
                          ? "dark:invert"
                          : ""
                      }`}
                    />

                    <span
                      role="tooltip"
                      className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 scale-90 group-hover/tool:opacity-100 group-hover/tool:scale-100 transition-all duration-200 z-30 whitespace-nowrap rounded-md bg-slate-900/95 px-2.5 py-0.5 text-[11px] font-medium text-white shadow-md dark:bg-white dark:text-slate-900 dark:border dark:border-slate-200 after:content-[''] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-slate-900/95 dark:after:border-b-white"
                    >
                      {tool.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Contact() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const config = useSiteConfig();

  const contact = getPublishedContact(config, locale);
  const pubProfile = getPublishedProfile(config, locale);
  const sectionMeta = getPublishedSectionMeta(config, "contact", locale);

  const contactTitle = sectionMeta.title || contact.title || t("contact.title");
  const contactDesc = sectionMeta.desc || contact.desc || t("contact.desc");

  return (
    <section id="kontak" className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-4 sm:px-5 py-14 sm:py-20">
      <div id="contact" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24} className="w-full min-w-0">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-white dark:border-line/60 dark:bg-[#111422]">
          <div className={`grid grid-cols-1 min-w-0 items-stretch ${contact.showProfileCard ? "lg:grid-cols-[0.95fr_1.15fr]" : "lg:grid-cols-1"}`}>
            {/* KIRI: Hologram Profile Card */}
            {contact.showProfileCard && (
              <div className="relative min-w-0 flex flex-col items-center justify-center border-b border-line lg:border-b-0 lg:border-r dark:border-line/40 bg-slate-50/70 dark:bg-[#0b0e1a] p-4 sm:p-8">
                <DynamicProfileCardStage />
              </div>
            )}

            {/* KANAN: Formulir Pesan Langsung (Turnstile & Anti-Spam) */}
            <div className="relative min-w-0 flex flex-col justify-center p-5 sm:p-8 lg:p-10 space-y-6">
              <div>
                {(sectionMeta.eyebrow || contact.badge) && (
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-brand dark:text-blue-400">
                    {sectionMeta.eyebrow || contact.badge}
                  </p>
                )}
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight">
                  {contactTitle}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-body">
                  {contactDesc}
                </p>
              </div>

              <ContactForm
                submitLabel={contact.emailCta}
                recipientEmail={contact.email}
              />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function Footer() {
  const { i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const { views, isEngaged, isVerified } = usePageViews();
  const config = useSiteConfig();
  const footer = getPublishedFooter(config, locale);

  return (
    <footer className="relative border-t border-line overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-10 dark:border-line">
      <div className="mx-auto max-w-5xl px-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-bold text-ink">{footer.brandText}</p>
            <p className="text-xs text-body mt-0.5">
              © {new Date().getFullYear()} {footer.copyrightName}. {footer.locationText}
            </p>
            {footer.tagline && (
              <p className="text-xs text-muted mt-1">{footer.tagline}</p>
            )}
            {footer.showEmail && footer.email && (
              <a
                href={`mailto:${footer.email}`}
                className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs font-medium text-brand hover:underline dark:text-blue-400"
              >
                <Mail className="size-3.5" />
                <span>{footer.email}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-4">
            {footer.showSocials && footer.socials.length > 0 && (
              <ul className="flex items-center gap-1 sm:gap-1.5">
                {footer.socials.map((s) => (
                  <li key={s.id || s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className={`group flex size-11 items-center justify-center rounded-xl text-body transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:text-slate-400 ${getSocialHoverClasses(s.label)}`}
                    >
                      <span className="transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none">
                        {s.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.iconUrl} alt={s.label} className="size-5 object-contain" />
                        ) : (
                          <SocialIcon label={s.label} className="size-5" />
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {isVerified && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-200 ${
                  isEngaged
                    ? "border-brand/40 bg-brand/5 text-ink dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-200"
                    : "border-line bg-white/90 text-ink dark:border-line dark:bg-slate-900/90 dark:text-slate-200"
                }`}
                title="Kunjungan aktif terverifikasi"
              >
                <AnimatedEye isEngaged={isEngaged} className="size-3.5" />
                <span suppressHydrationWarning className="font-mono text-xs font-bold">
                  {views.toLocaleString("id-ID")}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {footer.showWatermark && footer.watermarkText && (
        <Parallax speed={-0.06} align="bottom">
          <div className="relative mx-auto w-full max-w-6xl px-5 text-center select-none pointer-events-none mt-10 sm:mt-14 -mb-4 sm:-mb-6">
            <p
              aria-hidden="true"
              className="font-pixel text-[13vw] sm:text-[11vw] md:text-[10vw] lg:text-[112px] font-bold leading-none tracking-wider uppercase bg-gradient-to-b from-blue-600 via-blue-500/40 to-transparent dark:from-blue-400 dark:via-blue-500/35 dark:to-transparent bg-clip-text text-transparent"
            >
              {footer.watermarkText}
            </p>
          </div>
        </Parallax>
      )}
    </footer>
  );
}

function BackgroundGrid() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const { isLite, isBalanced, isFull, prefersReducedMotion } = useAdaptivePerformance();
  const isDark = mounted && resolvedTheme === "dark";
  const gridLineColor = isDark ? "#171c2a" : "#e6e7f2";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 will-change-transform [contain:strict]" aria-hidden="true">
      {prefersReducedMotion ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, ${gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />
      ) : (
        <ShapeGrid
          shape="square"
          direction="diagonal"
          lineColor={gridLineColor}
          hoverColor={isDark ? "#2563eb" : "#1b45c4"}
          hoverFillColor={isDark ? "#1d4ed8" : "#1b45c4"}
          fillOpacity={isDark ? 0.12 : 0.08}
          cellSize={isLite ? 52 : isBalanced ? 48 : 44}
          speed={isLite ? 0.06 : isBalanced ? 0.09 : 0.14}
          lineWidth={1}
          radius={isLite ? 1.0 : isBalanced ? 1.3 : 1.8}
          trail={0.45}
          glow={0}
          dpr={1}
          fade={1}
          clickCascade={isFull}
          intro={false}
        />
      )}
      <div className="absolute inset-0 bg-white/70 dark:bg-[#08090e]/75 pointer-events-none" />
    </div>
  );
}

export default function Home() {
  const siteConfig = useSiteConfig();
  const { i18n } = useTranslation();
  const orderedKeys = useMemo(() => getOrderedSectionKeys(siteConfig), [siteConfig]);
  const langLocale = (i18n.resolvedLanguage || i18n.language || "id").startsWith("en") ? "en" : "id";
  const seo = useMemo(() => getPublishedSeo(siteConfig, langLocale), [siteConfig, langLocale]);

  useEffect(() => {
    if (seo.metaTitle && typeof document !== "undefined") {
      document.title = seo.metaTitle;
    }
  }, [seo.metaTitle]);

  const renderSection = (key: SectionKey) => {
    switch (key) {
      case "hero":
        return isSectionVisible(siteConfig, "hero")
          ? <Hero key={key} />
          : <div key={key} id="hero" className="sr-only" aria-hidden="true" />;
      case "about":
        return isSectionVisible(siteConfig, "about")
          ? <About key={key} />
          : <div key={key} id="tentang" className="sr-only" aria-hidden="true" />;
      case "journey":
        return isSectionVisible(siteConfig, "journey")
          ? <AcademicJourneySection key={key} />
          : <div key={key} id="journey" className="sr-only" aria-hidden="true" />;
      case "achievements":
        return isSectionVisible(siteConfig, "achievements") ? <AchievementsSection key={key} /> : null;
      case "services":
        return isSectionVisible(siteConfig, "services")
          ? <ServicesSection key={key} />
          : <div key={key} id="services" className="sr-only" aria-hidden="true" />;
      case "cv":
        return isSectionVisible(siteConfig, "cv")
          ? <DynamicCvFolderSection key={key} />
          : <div key={key} id="cv" className="sr-only" aria-hidden="true" />;
      case "stack":
        return isSectionVisible(siteConfig, "stack")
          ? <Stack key={key} />
          : <div key={key} id="stack" className="sr-only" aria-hidden="true" />;
      case "projects":
        return isSectionVisible(siteConfig, "projects") && isSectionVisible(siteConfig, "proyek")
          ? <ProjectsSection key={key} />
          : <div key={key} id="proyek" className="sr-only" aria-hidden="true" />;
      case "blog":
        return isSectionVisible(siteConfig, "blog") ? <BlogPreviewSection key={key} /> : null;
      case "certificates":
        return isSectionVisible(siteConfig, "certificates")
          ? <CertificatesSection key={key} />
          : <div key={key} id="certificates" className="sr-only" aria-hidden="true" />;
      case "faq":
        return isSectionVisible(siteConfig, "faq")
          ? <FaqSection key={key} />
          : <div key={key} id="faq" className="sr-only" aria-hidden="true" />;
      case "contact":
        return isSectionVisible(siteConfig, "contact")
          ? <Contact key={key} />
          : <div key={key} id="kontak" className="sr-only" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <>
      <BackgroundGrid />
      <Header />
      <PortfolioPillNav />
      <ScrollToTop />
      <main className="relative pe-14 min-[480px]:pe-11 md:pe-0 transition-[padding] duration-200">
        <BackgroundStickers />
        {orderedKeys.map((key) => renderSection(key))}
      </main>
      <Footer />
    </>
  );
}
