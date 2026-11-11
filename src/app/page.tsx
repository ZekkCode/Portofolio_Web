"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { CvFolderSection } from "@/components/cv-folder-section";
import { LanyardStage } from "@/components/lanyard-stage";
import { Parallax, ScrollReveal, SmoothNavLink } from "@/components/parallax";
import { PortfolioPillNav } from "@/components/portfolio-pill-nav";
import { ProfileCardStage } from "@/components/profile-card-stage";
import { ProjectsSection } from "@/components/projects-section";
import { BlogPreviewSection } from "@/components/blog-preview-section";
import { AcademicJourneySection } from "@/components/academic-journey-section";
import { AchievementsSection } from "@/components/achievements-section";
import { ServicesSection } from "@/components/services-section";
import { CertificatesSection } from "@/components/certificates-section";
import { ExperienceTimeline } from "@/components/experience-timeline";
import { FaqSection } from "@/components/faq-section";
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
import { profile } from "@/lib/profile";
import { useSiteConfig, defaultTechStack } from "@/lib/site-store";
import { ArrowRight, FileText, Mail } from "lucide-react";

function Header() {
  const { t } = useTranslation();
  const { views, isEngaged, isVerified } = usePageViews();
  const { headerLogoUrl, generalProfile } = useSiteConfig();

  const brand = generalProfile?.brand || profile.brand;
  const email = generalProfile?.email || profile.contact.email;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)] dark:border-line dark:bg-[#08090e]/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-5">
        <SmoothNavLink href="#atas" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          {headerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headerLogoUrl}
              alt={brand}
              className="size-7.5 rounded-full object-cover border border-brand/30 shadow-2xs"
            />
          ) : (
            <div className="flex size-7.5 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-ink text-xs font-black tracking-wider text-white shadow-2xs">
              {brand ? brand.charAt(0) : "Z"}
            </div>
          )}
          <span className="font-display text-base font-bold tracking-tight text-ink">
            {brand}
          </span>
        </SmoothNavLink>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {isVerified && (
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md transition-all duration-300 ${
                isEngaged
                  ? "border-brand/40 bg-brand/5 text-ink dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-200"
                  : "border-line bg-surface/90 text-body dark:border-line/60 dark:bg-slate-900/80"
              }`}
              title="Total tayangan halaman (Page Views)"
            >
              <AnimatedEye isEngaged={isEngaged} className="size-3.5" />
              <span suppressHydrationWarning className="font-mono text-[11px] font-bold">
                {views.toLocaleString("id-ID")}
              </span>
            </span>
          )}
          <LanguageToggle />
          <ThemeToggle />
          <a
            href={`mailto:${email}`}
            className="hidden md:inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
  const currentLang = i18n.language || "id";
  const isEn = currentLang === "en";
  const { generalProfile } = useSiteConfig();

  const name = generalProfile?.name || profile.name;
  const roles = isEn ? (generalProfile?.rolesEn || t("hero.roles")) : (generalProfile?.roles || t("hero.roles"));
  const heroDesc = isEn ? (generalProfile?.heroDescEn || t("hero.desc")) : (generalProfile?.heroDesc || t("hero.desc"));
  const email = generalProfile?.email || profile.contact.email;

  const nameParts = name.split(" ");
  const firstLine = nameParts.slice(0, 2).join(" ");
  const secondLine = nameParts.slice(2).join(" ");

  return (
    <section
      id="atas"
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 pt-4 sm:pt-14 pb-12 sm:pb-16"
    >
      <div id="hero" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        {/* Left Column: Editorial Information */}
        <div className="relative z-10 flex flex-col items-start gap-5 text-start order-2 lg:order-1 pt-1 sm:pt-0">
          <ScrollReveal y={24} duration={0.75} className="space-y-3.5 w-full">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.08]">
              {firstLine}
              {secondLine && (
                <>
                  <br />
                  {secondLine}
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg font-semibold text-body">
              {roles}
            </p>
          </ScrollReveal>

          <div className="space-y-6 w-full max-w-xl">
            <p className="text-sm sm:text-base leading-relaxed text-body">
              {heroDesc}
            </p>

            {/* Action Buttons */}
            <div className="relative z-40 flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3 pt-1">
              <a
                href={`mailto:${email}`}
                className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <Mail className="size-4" />
                <span>{t("hero.emailBtn", "Kirim Email")}</span>
              </a>
              <SmoothNavLink
                href="#cv"
                className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl border border-line/80 bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-150 hover:bg-brand/5 hover:border-brand/40 hover:text-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/60 dark:text-slate-200 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
              >
                <span>{t("hero.cvBtn", "Berkas Karier")}</span>
                <ArrowRight className="size-3.5" />
              </SmoothNavLink>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Lanyard ID Card */}
        <div className="relative flex flex-col items-center justify-center lg:items-end w-full order-1 lg:order-2 z-20">
          <div className="relative w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[460px] h-[380px] sm:h-[510px] lg:h-[680px] -mt-8 sm:-mt-[76px] lg:-mt-[84px]">
            <LanyardStage className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const isEn = currentLang === "en";
  const { generalProfile, stats, projects, certificates, experience } = useSiteConfig();

  const bioParagraphs = isEn
    ? generalProfile?.bioEn?.length
      ? generalProfile.bioEn
      : generalProfile?.bio || profile.bio
    : generalProfile?.bio?.length
    ? generalProfile.bio
    : profile.bio;

  // Phase 4: Dynamic & verified stats calculation
  const publishedProjectsCount = (projects || []).filter((p) => p.published !== false).length;
  const verifiedCertsCount = (certificates || []).filter((c) => c.published !== false).length;
  const orgCount = (experience || []).filter((e) => e.published !== false).length;

  const projectsDisplay =
    stats?.mode === "manual" && typeof stats?.projectsCount === "number" && stats.projectsCount >= 0
      ? String(stats.projectsCount)
      : String(publishedProjectsCount);

  const certsDisplay =
    stats?.mode === "manual" && typeof stats?.certificatesCount === "number" && stats.certificatesCount >= 0
      ? String(stats.certificatesCount)
      : String(verifiedCertsCount);

  const yearsDisplay = stats?.experienceYears || "6+";

  const orgsDisplay =
    stats?.mode === "manual" && typeof stats?.organizationsCount === "number" && stats.organizationsCount >= 0
      ? String(stats.organizationsCount)
      : String(orgCount || 3);

  const statItems = [
    { value: projectsDisplay, key: "projects" },
    { value: certsDisplay, key: "certificates" },
    { value: yearsDisplay, key: "years" },
    { value: orgsDisplay, key: "organizations" },
  ];

  return (
    <section id="tentang" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="about" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div id="about-me" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={t("about.title")}
          desc={t("about.desc")}
        />
      </ScrollReveal>

      <div className="space-y-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 items-start">
          <div className="space-y-4 text-sm sm:text-base leading-relaxed text-body">
            {bioParagraphs.map((par) => (
              <p key={par.slice(0, 24)}>{par}</p>
            ))}
          </div>

          {/* Grounded Metric Cards */}
          <Parallax speed={0.06}>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {statItems.map((stat) => (
                <div
                  key={stat.key}
                  className="group relative overflow-hidden rounded-xl border border-line/80 bg-white p-4 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md dark:border-line/60 dark:bg-[#111422]"
                >
                  <dt className="sr-only">{t(`about.stats.${stat.key}`)}</dt>
                  <dd className="font-display text-2xl font-extrabold text-ink group-hover:text-brand transition-colors leading-none">
                    {stat.value}
                  </dd>
                  <dd className="mt-2 text-xs font-medium text-body">
                    {t(`about.stats.${stat.key}`)}
                  </dd>
                </div>
              ))}
            </dl>
          </Parallax>
        </div>

        {/* Full-width Horizontal Career Experience Timeline */}
        <div className="pt-8 border-t border-line/60 dark:border-line/40">
          <ExperienceTimeline />
        </div>
      </div>
    </section>
  );
}

function Stack() {
  const { t } = useTranslation();
  const { techStack } = useSiteConfig();

  const activeStack = techStack && techStack.length > 0
    ? techStack.filter((s) => s.visible !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : defaultTechStack;

  const stackRow1 = Array.from({ length: 4 }, () => activeStack).flat();
  const offsetCount = Math.floor(activeStack.length / 2) || 1;
  const offsetTools = [
    ...activeStack.slice(offsetCount),
    ...activeStack.slice(0, offsetCount),
  ];
  const stackRow2 = Array.from({ length: 4 }, () => offsetTools).flat();

  const disciplines = [
    {
      category: t("stack.uiuxTitle", "UI/UX & Desain Produk"),
      tools: activeStack.filter((s) => s.category === "uiux"),
    },
    {
      category: t("stack.frontendTitle", "Frontend Web Development"),
      tools: activeStack.filter((s) => s.category === "frontend"),
    },
    {
      category: t("stack.visualTitle", "Desain Grafis & Multimedia"),
      tools: activeStack.filter((s) => s.category === "visual"),
    },
    {
      category: t("stack.systemsTitle", "Sistem IT & Database"),
      tools: activeStack.filter((s) => s.category === "systems"),
    },
  ];

  return (
    <section id="stack" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="tech-stack" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={t("stack.title")}
          desc={t("stack.desc")}
        />
      </ScrollReveal>

      {/* Grid Kategori Tech Stack */}
      <ScrollReveal y={20}>
        <div className="grid gap-4 sm:grid-cols-2 mb-8 auto-rows-fr items-stretch">
          {disciplines.map((item) => (
            <div
              key={item.category}
              className="flex flex-col justify-between rounded-xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-line/60 dark:bg-[#111422]"
            >
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  {item.category}
                </h3>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  {item.tools.map((tool) => (
                    <span
                      key={tool.id || tool.name}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 bg-surface/70 px-2.5 py-1 text-xs font-medium text-ink dark:border-line/40 dark:bg-slate-900/60"
                    >
                      <div className="flex size-4 shrink-0 items-center justify-center">
                        <Image
                          src={tool.icon}
                          alt={tool.name}
                          width={16}
                          height={16}
                          className={`max-h-3.5 max-w-3.5 object-contain ${
                            tool.name === "GitHub" || tool.name === "CapCut" || tool.name === "Next.js"
                              ? "dark:invert"
                              : ""
                          }`}
                        />
                      </div>
                      <span>{tool.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Seamless Dual-Direction Ribbon Ticker */}
      <div className="relative w-full overflow-hidden py-6 sm:py-8 space-y-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 sm:w-24 bg-gradient-to-r from-[var(--bg-page)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 sm:w-24 bg-gradient-to-l from-[var(--bg-page)] to-transparent" />

        {/* Baris 1: Bergerak ke Kiri */}
        <div className="animate-marquee flex items-center gap-3.5 sm:gap-4 py-2">
          {stackRow1.map((tool, idx) => (
            <div
              key={`row1-${tool.name}-${idx}`}
              aria-hidden={idx >= activeStack.length ? "true" : undefined}
              className="group/tool relative flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl border border-line/70 bg-white/95 p-2.5 shadow-2xs transition-colors duration-200 hover:z-30 hover:border-brand/40 hover:bg-white hover:shadow-md dark:border-line/40 dark:bg-slate-900/90 dark:hover:border-blue-500/40 dark:hover:bg-slate-900 cursor-default"
              title={tool.name}
              aria-label={tool.name}
            >
              <Image
                src={tool.icon}
                alt={tool.name}
                width={28}
                height={28}
                className={`max-h-7 max-w-7 object-contain transition-all duration-300 grayscale opacity-60 contrast-75 dark:opacity-45 group-hover/tool:grayscale-0 group-hover/tool:opacity-100 group-hover/tool:scale-110 ${
                  tool.name === "GitHub" || tool.name === "CapCut" || tool.name === "Next.js"
                    ? "dark:invert"
                    : ""
                }`}
              />

              <span
                role="tooltip"
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 scale-90 group-hover/tool:opacity-100 group-hover/tool:scale-100 transition-all duration-200 z-30 whitespace-nowrap rounded-md bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-medium text-white shadow-md backdrop-blur-xs dark:bg-white dark:text-slate-900 dark:border dark:border-slate-200 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900/90 dark:after:border-t-white"
              >
                {tool.name}
              </span>
            </div>
          ))}
        </div>

        {/* Baris 2: Bergerak ke Kanan */}
        <div className="animate-marquee-reverse flex items-center gap-3.5 sm:gap-4 py-2" aria-hidden="true">
          {stackRow2.map((tool, idx) => (
            <div
              key={`row2-${tool.name}-${idx}`}
              className="group/tool relative flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl border border-line/70 bg-white/95 p-2.5 shadow-2xs transition-colors duration-200 hover:z-30 hover:border-brand/40 hover:bg-white hover:shadow-md dark:border-line/40 dark:bg-slate-900/90 dark:hover:border-blue-500/40 dark:hover:bg-slate-900 cursor-default"
              title={tool.name}
              aria-label={tool.name}
            >
              <Image
                src={tool.icon}
                alt={tool.name}
                width={28}
                height={28}
                className={`max-h-7 max-w-7 object-contain transition-all duration-300 grayscale opacity-60 contrast-75 dark:opacity-45 group-hover/tool:grayscale-0 group-hover/tool:opacity-100 group-hover/tool:scale-110 ${
                  tool.name === "GitHub" || tool.name === "CapCut" || tool.name === "Next.js"
                    ? "dark:invert"
                    : ""
                }`}
              />

              <span
                role="tooltip"
                className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 scale-90 group-hover/tool:opacity-100 group-hover/tool:scale-100 transition-all duration-200 z-30 whitespace-nowrap rounded-md bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-medium text-white shadow-md backdrop-blur-xs dark:bg-white dark:text-slate-900 dark:border dark:border-slate-200 after:content-[''] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-slate-900/90 dark:after:border-b-white"
              >
                {tool.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const isEn = currentLang === "en";
  const { generalProfile } = useSiteConfig();

  const email = generalProfile?.email || profile.contact.email;
  const location = isEn
    ? generalProfile?.locationEn || profile.location
    : generalProfile?.location || profile.location;
  const availability = isEn
    ? generalProfile?.availabilityEn || t("contact.availability", "Open for collaboration")
    : generalProfile?.availability || t("contact.availability", "Terbuka untuk kolaborasi");

  const socials = (generalProfile?.socials || []).filter((s) => s.visible !== false);

  return (
    <section id="kontak" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="contact" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24} className="w-full">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-xs dark:border-line/60 dark:bg-[#111422]">
          <div className="grid items-stretch lg:grid-cols-[1fr_1fr]">
            {/* KIRI: Hologram Profile Card */}
            <div className="relative flex flex-col items-center justify-center border-b border-line lg:border-b-0 lg:border-r dark:border-line/40 bg-gradient-to-b from-slate-50/70 via-white to-slate-100/50 dark:from-[#0b0e1a] dark:to-[#13182b] p-4 sm:p-8">
              <ProfileCardStage />
            </div>

            {/* KANAN: Panel Informasi Kontak */}
            <div className="relative flex flex-col justify-between p-4 sm:p-8 lg:p-10 space-y-6">
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight">
                    {t("contact.title")}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-body">
                    {t("contact.desc")}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3 pt-2">
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <Mail className="size-4" />
                    <span>{email}</span>
                  </a>
                  <SmoothNavLink
                    href="#cv"
                    className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl border border-line/80 bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-150 hover:bg-brand/5 hover:border-brand/40 hover:text-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/60 dark:text-slate-200 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
                  >
                    <FileText className="size-3.5 text-brand dark:text-blue-400" />
                    <span>{t("hero.cvBtn", "Berkas Karier")}</span>
                    <ArrowRight className="size-3.5" />
                  </SmoothNavLink>
                </div>
              </div>

              {/* Info Kontak & Lokasi */}
              <div className="space-y-4 border-t border-line/60 pt-5 dark:border-line/40">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-line/60 bg-slate-50/70 p-3 dark:border-line/40 dark:bg-[#181d30]/60">
                    <span className="block text-[11px] font-semibold text-body">{t("contact.location")}</span>
                    <span className="mt-0.5 font-bold text-ink">{location}</span>
                  </div>
                  <div className="rounded-xl border border-line/60 bg-slate-50/70 p-3 dark:border-line/40 dark:bg-[#181d30]/60">
                    <span className="block text-[11px] font-semibold text-body">{t("contact.status")}</span>
                    <span className="mt-0.5 font-bold text-brand dark:text-blue-400">{availability}</span>
                  </div>
                </div>

                {/* Socials */}
                <div className="pt-1">
                  <span className="text-xs font-semibold text-ink">{t("contact.socialsTitle")}</span>
                  <ul className="mt-2 flex flex-wrap items-center gap-2">
                    {socials.map((social) => (
                      <li key={social.id || social.label}>
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={social.label}
                          title={social.label}
                          className="group flex size-11 items-center justify-center rounded-xl border border-line/70 bg-white/70 text-body shadow-2xs backdrop-blur-xs transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/40 dark:bg-slate-900/60 dark:text-slate-300 hover:text-brand hover:border-brand/40"
                        >
                          <span className="font-mono text-xs font-bold uppercase transition-transform duration-200 group-hover:scale-110">
                            {social.label.slice(0, 2)}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function Footer() {
  const { views, isEngaged, isVerified } = usePageViews();
  const { generalProfile } = useSiteConfig();

  const brand = generalProfile?.brand || profile.brand;
  const name = generalProfile?.name || profile.name;
  const socials = (generalProfile?.socials || []).filter((s) => s.visible !== false);

  return (
    <footer className="relative border-t border-line overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-10 dark:border-line">
      <div className="mx-auto max-w-5xl px-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-bold text-ink">{brand}</p>
            <p className="text-xs text-body mt-0.5">
              © {new Date().getFullYear()} {name}. Mojokerto, Indonesia.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-1 sm:gap-1.5">
              {socials.map((s) => (
                <li key={s.id || s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="group flex size-11 items-center justify-center rounded-xl text-body transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:text-slate-400 hover:text-brand"
                  >
                    <span className="font-mono text-xs font-bold uppercase transition-transform duration-200 group-hover:scale-110">
                      {s.label.slice(0, 2)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {isVerified && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-2xs backdrop-blur-xs transition-all duration-300 ${
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

      <Parallax speed={-0.06} align="center">
        <div className="relative mx-auto w-full max-w-6xl px-5 text-center select-none pointer-events-none mt-10 sm:mt-14 -mb-4 sm:-mb-6">
          <p
            aria-hidden="true"
            className="font-pixel text-[13vw] sm:text-[11vw] md:text-[10vw] lg:text-[112px] font-bold leading-none tracking-wider uppercase bg-gradient-to-b from-blue-600 via-blue-500/40 to-transparent dark:from-blue-400 dark:via-blue-500/35 dark:to-transparent bg-clip-text text-transparent"
          >
            zakaria mp
          </p>
        </div>
      </Parallax>
    </footer>
  );
}

export default function Home() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const { isLite, isBalanced, isFull } = useAdaptivePerformance();
  const isDark = mounted && resolvedTheme === "dark";
  const gridLineColor = isDark ? "#171c2a" : "#e6e7f2";

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        {isLite ? (
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
            cellSize={isBalanced ? 48 : 44}
            speed={isBalanced ? 0.06 : 0.14}
            lineWidth={1}
            radius={isBalanced ? 1.2 : 1.8}
            trail={0.45}
            glow={0}
            dpr={1}
            fade={1}
            clickCascade={isFull}
            intro={false}
          />
        )}
        <div className="absolute inset-0 bg-white/70 dark:bg-[#08090e]/75 pointer-events-none transition-colors duration-300" />
      </div>
      <Header />
      <PortfolioPillNav />
      <ScrollToTop />
      <main className="relative pe-11 md:pe-0 transition-[padding] duration-200">
        <BackgroundStickers />
        <Hero />
        <About />
        <AcademicJourneySection />
        <AchievementsSection />
        <ServicesSection />
        <CvFolderSection />
        <Stack />
        <ProjectsSection />
        <BlogPreviewSection />
        <CertificatesSection />
        <FaqSection />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
