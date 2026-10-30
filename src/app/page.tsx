"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import TechText from "@/components/tech-text";
import { CvFolderSection } from "@/components/cv-folder-section";
import { LanyardStage } from "@/components/lanyard-stage";
import { Parallax, ScrollReveal, SmoothNavLink } from "@/components/parallax";
import { PortfolioPillNav } from "@/components/portfolio-pill-nav";
import { ProfileCardStage } from "@/components/profile-card-stage";
import { ProjectsSection } from "@/components/projects-section";
import { ServicesSection } from "@/components/services-section";
import { CertificatesSection } from "@/components/certificates-section";
import { ExperienceTimeline } from "@/components/experience-timeline";
import { FaqSection } from "@/components/faq-section";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SectionTitle } from "@/components/section-title";
import ShapeGrid from "@/components/shape-grid";
import { LanguageToggle, ThemeToggle } from "@/components/theme-language-toggle";
import { AnimatedEye } from "@/components/animated-eye";
import { usePageViews } from "@/lib/use-page-views";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import { profile } from "@/lib/profile";
import { useSiteConfig } from "@/lib/site-store";
import { ArrowRight, FileText, Mail } from "lucide-react";

function Header() {
  const { t } = useTranslation();
  const { views, isEngaged, isVerified } = usePageViews();
  const { headerLogoUrl } = useSiteConfig();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)] dark:border-line dark:bg-[#08090e]/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-5">
        <SmoothNavLink href="#atas" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          {headerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headerLogoUrl}
              alt={profile.brand}
              className="size-7.5 rounded-full object-cover border border-brand/30 shadow-2xs"
            />
          ) : (
            <div className="flex size-7.5 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-ink text-xs font-black tracking-wider text-white shadow-2xs">
              {profile.brand ? profile.brand.charAt(0) : "Z"}
            </div>
          )}
          <span className="font-display text-base font-bold tracking-tight text-ink">
            {profile.brand}
          </span>
        </SmoothNavLink>

        <div className="flex items-center gap-2 sm:gap-2.5 pe-14 md:pe-0">
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
            href={`mailto:${profile.contact.email}`}
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
  const { t } = useTranslation();

  return (
    <section
      id="atas"
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 pt-8 pb-12 sm:pt-14 sm:pb-16"
    >
      <div id="hero" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        {/* Left Column: Editorial Information - Stable, readable layout without parallax displacement */}
        <div className="relative z-10 flex flex-col items-start gap-5 text-start">
          <ScrollReveal y={24} duration={0.75} className="space-y-3.5 w-full">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.08]">
              Zakaria Mujur
              <br />
              Prasetyo
            </h1>
            <p className="text-base sm:text-lg font-semibold text-body">
              {t("hero.roles")}
            </p>
          </ScrollReveal>

          <div className="space-y-6 w-full max-w-xl">
            <p className="text-sm sm:text-base leading-relaxed text-body">
              {t("hero.desc")}
            </p>

            {/* Action Buttons: Direct Contact & Verified Credentials */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3 pt-1">
              <a
                href={`mailto:${profile.contact.email}`}
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
        <div className="relative flex flex-col items-center justify-center lg:items-end w-full">
          <div className="relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[460px] h-[480px] sm:h-[540px] lg:h-[600px]">
            <LanyardStage className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const { t } = useTranslation();

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

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="space-y-6">
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-body">
              {profile.bio.map((par) => (
                <p key={par.slice(0, 24)}>{par}</p>
              ))}
            </div>
          </div>

          {/* Grounded Metric Cards */}
          <Parallax speed={0.06}>
            <div className="mt-8">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {profile.stats.map((stat, idx) => {
                  const statKey = idx === 0 ? "projects" : idx === 1 ? "certificates" : idx === 2 ? "years" : "organizations";
                  return (
                    <div
                      key={stat.label}
                      className="group relative overflow-hidden rounded-xl border border-line/80 bg-white p-4 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md dark:border-line/60 dark:bg-[#111422]"
                    >
                      <dt className="sr-only">{stat.label}</dt>
                      <dd className="font-display text-2xl font-extrabold text-ink group-hover:text-brand transition-colors leading-none">
                        {stat.value}
                      </dd>
                      <dd className="mt-2 text-xs font-medium text-body">
                        {t(`about.stats.${statKey}`)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </Parallax>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-brand dark:text-blue-400">
            {t("about.expTitle")}
          </h3>
          <ScrollReveal y={16}>
            <ExperienceTimeline />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function Stack() {
  const { t } = useTranslation();
  const duplicatedStack = [...profile.stack, ...profile.stack];

  const disciplines = [
    {
      category: t("stack.uiuxTitle", "UI/UX & Desain Produk"),
      tools: ["Figma", "Adobe XD"],
    },
    {
      category: t("stack.frontendTitle", "Frontend Web Development"),
      tools: ["Next.js", "React", "TypeScript", "TailwindCSS"],
    },
    {
      category: t("stack.visualTitle", "Desain Grafis & Multimedia"),
      tools: ["Illustrator", "Photoshop", "CapCut", "Filmora"],
    },
    {
      category: t("stack.systemsTitle", "Sistem IT & Database"),
      tools: ["MySQL", "GitHub"],
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

      {/* Discipline-Grouped Taxonomy Grid with Staggered Parallax Columns */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8 items-start">
        <Parallax speed={-0.08} className="space-y-4">
          {[disciplines[0], disciplines[2]].map((item) => (
            <div
              key={item.category}
              className="rounded-xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-line/60 dark:bg-[#111422]"
            >
              <h3 className="font-display text-base font-bold text-ink">
                {item.category}
              </h3>

              <div className="mt-3.5 flex flex-wrap gap-2">
                {item.tools.map((toolName) => {
                  const tool = profile.stack.find((s) => s.name === toolName);
                  if (!tool) return null;
                  return (
                    <span
                      key={tool.name}
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
                  );
                })}
              </div>
            </div>
          ))}
        </Parallax>

        <Parallax speed={0.10} className="space-y-4 sm:pt-4">
          {[disciplines[1], disciplines[3]].map((item) => (
            <div
              key={item.category}
              className="rounded-xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-line/60 dark:bg-[#111422]"
            >
              <h3 className="font-display text-base font-bold text-ink">
                {item.category}
              </h3>

              <div className="mt-3.5 flex flex-wrap gap-2">
                {item.tools.map((toolName) => {
                  const tool = profile.stack.find((s) => s.name === toolName);
                  if (!tool) return null;
                  return (
                    <span
                      key={tool.name}
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
                  );
                })}
              </div>
            </div>
          ))}
        </Parallax>
      </div>

      {/* Seamless Ribbon Ticker */}
      <div className="relative w-full overflow-hidden py-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg-page)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg-page)] to-transparent" />

        <div className="animate-marquee flex items-center gap-8 py-1">
          {duplicatedStack.map((tool, idx) => (
            <div
              key={`${tool.name}-${idx}`}
              aria-hidden={idx >= profile.stack.length ? "true" : undefined}
              className="flex shrink-0 items-center gap-2.5 text-sm font-medium text-ink dark:text-slate-200"
            >
              <div className="flex size-6 shrink-0 items-center justify-center">
                <Image
                  src={tool.icon}
                  alt={tool.name}
                  width={20}
                  height={20}
                  className={`max-h-5 max-w-5 object-contain ${
                    tool.name === "GitHub" || tool.name === "CapCut" || tool.name === "Next.js"
                      ? "dark:invert"
                      : ""
                  }`}
                />
              </div>
              <span className="whitespace-nowrap font-medium text-ink dark:text-slate-200">
                {tool.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const socialChannels = [
  {
    label: "GitHub",
    href: "https://github.com/ZekkCode",
    hoverClasses:
      "hover:text-[#181717] dark:hover:text-white hover:bg-slate-900/10 dark:hover:bg-white/10 hover:border-slate-900/30 dark:hover:border-white/30",
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/zekksparow",
    hoverClasses:
      "hover:text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/30",
    icon: (
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@zekksparow",
    hoverClasses:
      "hover:text-[#000000] dark:hover:text-[#25F4EE] hover:bg-black/5 dark:hover:bg-[#25F4EE]/10 hover:border-black/20 dark:hover:border-[#25F4EE]/30",
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
      </svg>
    ),
  },
  {
    label: "Behance",
    href: "https://www.behance.net/zakariamp",
    hoverClasses:
      "hover:text-[#0057FF] hover:bg-[#0057FF]/10 hover:border-[#0057FF]/30",
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-4.726 3-3.666 0-5.5-2.583-5.5-5.875 0-3.328 1.944-5.125 5.25-5.125 3.32 0 4.975 2.115 4.975 4.875 0 .422-.057.822-.125 1.125h-6.852c.071 1.579 1.094 2.658 2.457 2.658 1.157 0 1.916-.625 2.292-1.658h2.229zm-4.75-5.167c-1.125 0-1.875.75-2.083 1.833h4.167c-.042-1.042-.875-1.833-2.084-1.833zm-10.976-1.833h-4v-4h4c1.104 0 2 .896 2 2s-.896 2-2 2zm-4 2h4.5c1.381 0 2.5 1.119 2.5 2.5s-1.119 2.5-2.5 2.5h-4.5v-7zm0-6h-4v13h8.5c2.485 0 4.5-2.015 4.5-4.5 0-1.578-.814-2.969-2.05-3.774 1.246-.777 2.05-2.148 2.05-3.726 0-2.485-2.015-4.5-4.5-4.5h-4.5z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/zakariamp",
    hoverClasses:
      "hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/30",
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.66 1.66 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66.92 0 1.66-.74 1.66-1.66 0-.92-.74-1.66-1.66-1.66z" />
      </svg>
    ),
  },
  {
    label: "Trakteer",
    href: "https://trakteer.id/zakariamp",
    hoverClasses:
      "hover:text-[#BE1E2D] dark:hover:text-[#f87171] hover:bg-[#BE1E2D]/10 hover:border-[#BE1E2D]/30",
    icon: (
      <svg className="size-5" viewBox="0 0 18 18" fill="currentColor">
        <path fillRule="evenodd" d="M11.8314 5.58468H6.33722C6.00563 5.58468 5.73682 5.85349 5.73682 6.18509C5.73682 6.51668 6.00563 6.78549 6.33722 6.78549H11.8314C12.163 6.78549 12.4318 6.51668 12.4318 6.18509C12.4318 5.85349 12.163 5.58468 11.8314 5.58468Z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M12.4753 7.06901H5.60844V7.73163C5.32979 7.86596 5.08538 8.06512 4.89681 8.31435C4.64005 8.6537 4.50076 9.06742 4.5 9.49295L4.5 14.5408C4.5 15.0604 4.70641 15.5588 5.07383 15.9262C5.44124 16.2936 5.93956 16.5 6.45917 16.5H11.7409C12.2605 16.5 12.7588 16.2936 13.1263 15.9262C13.4937 15.5588 13.7001 15.0605 13.7001 14.5408V9.50772C13.7021 9.05391 13.5466 8.61345 13.26 8.26156C13.0502 8.00397 12.7797 7.80555 12.4753 7.68247V7.06901ZM7.21501 12.4238L9.09013 14.2989L10.9652 12.4238C12.3951 10.9957 10.5182 9.12059 9.09013 10.5486C7.64546 9.09842 5.77034 10.9791 7.21501 12.4238Z" />
        <path fillRule="evenodd" d="M8.36022 4.37275C8.36046 3.97012 8.51129 3.58214 8.78306 3.28507C9.05483 2.988 9.42789 2.80333 9.82891 2.76736C9.75907 2.46714 9.60596 2.19272 9.38718 1.97559C9.1684 1.75847 8.89282 1.60745 8.59209 1.53989C8.29135 1.47233 7.97765 1.49095 7.68702 1.59363C7.39639 1.69631 7.14062 1.87887 6.94907 2.12036C6.75752 2.36185 6.63797 2.65247 6.60414 2.95884C6.57031 3.26521 6.62358 3.57491 6.75782 3.85237C6.89207 4.12984 7.10185 4.36381 7.36307 4.52742C7.62429 4.69104 7.92637 4.77766 8.2346 4.77733C8.29631 4.77769 8.35798 4.7746 8.41934 4.7681C8.38315 4.63932 8.36328 4.50649 8.36022 4.37275V4.37275Z" />
        <path fillRule="evenodd" d="M11.3531 5.22811C11.4875 5.01366 11.5619 4.76714 11.5688 4.51418C11.5756 4.26121 11.5146 4.01103 11.392 3.78963C11.2694 3.56824 11.0898 3.3837 10.8718 3.25521C10.6538 3.12671 10.4054 3.05894 10.1523 3.05894C9.89926 3.05894 9.65082 3.12671 9.43282 3.25521C9.21481 3.3837 9.0352 3.56824 8.91264 3.78963C8.79008 4.01103 8.72903 4.26121 8.73587 4.51418C8.7427 4.76714 8.81717 5.01366 8.9515 5.22811H11.3531Z" />
      </svg>
    ),
  },
];

function Contact() {
  const { t } = useTranslation();

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

            {/* KANAN: Panel Informasi Kontak (Stabil, Mudah Diklik) */}
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

                  {/* Action Buttons: Direct Gmail & Career Folder */}
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3 pt-2">
                    <a
                      href={`mailto:${profile.contact.email}`}
                      className="inline-flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                      <Mail className="size-4" />
                      <span>{profile.contact.email}</span>
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
                      <span className="mt-0.5 font-bold text-ink">{profile.location}</span>
                    </div>
                    <div className="rounded-xl border border-line/60 bg-slate-50/70 p-3 dark:border-line/40 dark:bg-[#181d30]/60">
                      <span className="block text-[11px] font-semibold text-body">{t("contact.status")}</span>
                      <span className="mt-0.5 font-bold text-brand dark:text-blue-400">{t("contact.availability", "Terbuka untuk kolaborasi")}</span>
                    </div>
                  </div>

                  {/* Socials */}
                  <div className="pt-1">
                    <span className="text-xs font-semibold text-ink">{t("contact.socialsTitle")}</span>
                    <ul className="mt-2 flex flex-wrap items-center gap-2">
                      {socialChannels.map((social) => (
                        <li key={social.label}>
                          <a
                            href={social.href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={social.label}
                            title={social.label}
                            className={`group flex size-11 items-center justify-center rounded-xl border border-line/70 bg-white/70 text-body shadow-2xs backdrop-blur-xs transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/40 dark:bg-slate-900/60 dark:text-slate-300 ${social.hoverClasses}`}
                          >
                            <span className="transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none">
                              {social.icon}
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

  // footerSocials consolidated into socialChannels

  return (
    <footer className="relative border-t border-line overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-10 dark:border-line">
      <div className="mx-auto max-w-5xl px-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-bold text-ink">{profile.brand}</p>
            <p className="text-xs text-body mt-0.5">
              © {new Date().getFullYear()} {profile.name}. Mojokerto, Indonesia.
            </p>
          </div>

          {/* Socials: Clean icons with 44px hit target and no permanent circle borders */}
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-1 sm:gap-1.5">
              {socialChannels.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className={`group flex size-11 items-center justify-center rounded-xl text-body transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:text-slate-400 ${s.hoverClasses}`}
                  >
                    <span className="transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none">
                      {s.icon}
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

      {/* Blue Pixelated Signature Watermark: zakaria mp (DIBAWAH FOOTER - parallax halus, tautan di atas tetap diam) */}
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
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <ShapeGrid
          shape="square"
          direction="diagonal"
          lineColor={isDark ? "#171c2a" : "#e6e7f2"}
          hoverColor={isDark ? "#2563eb" : "#1b45c4"}
          hoverFillColor={isDark ? "#1d4ed8" : "#1b45c4"}
          fillOpacity={isDark ? 0.12 : 0.08}
          cellSize={44}
          speed={0.2}
          lineWidth={1}
          radius={2.0}
          trail={0.6}
          glow={isDark ? 0.16 : 0.10}
          fade={1}
          clickCascade
          intro
        />
        {/* Lapisan peredam ambient untuk kenyamanan membaca teks */}
        <div className="absolute inset-0 bg-white/70 dark:bg-[#08090e]/75 pointer-events-none transition-colors duration-300" />
      </div>
      <Header />
      <PortfolioPillNav />
      <ScrollToTop />
      <main>
        <Hero />
        <About />
        <ServicesSection />
        <CvFolderSection />
        <Stack />
        <ProjectsSection />
        <CertificatesSection />
        <FaqSection />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
