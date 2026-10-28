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
import { ServicesSection } from "@/components/services-section";
import { CertificatesSection } from "@/components/certificates-section";
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
import { ArrowRight, ArrowUpRight, Mail } from "lucide-react";

function Header() {
  const { t } = useTranslation();
  const { views, isEngaged } = usePageViews();
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
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md transition-all duration-300 ${
              isEngaged
                ? "border-brand/40 bg-brand/5 text-ink dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-200"
                : "border-line bg-surface/90 text-body dark:border-line/60 dark:bg-slate-900/80"
            }`}
            title={
              isEngaged
                ? "Kunjungan aktif terverifikasi (Engaged View)"
                : "Validasi kunjungan aktif (15–30 dtk)"
            }
          >
            <AnimatedEye isEngaged={isEngaged} className="size-3.5" />
            <span suppressHydrationWarning className="font-mono text-[11px] font-bold">
              {views.toLocaleString("id-ID")}
            </span>
          </span>
          <LanguageToggle />
          <ThemeToggle />
          <a
            href={`mailto:${profile.contact.email}`}
            className="hidden rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:inline-flex dark:bg-white dark:text-slate-900 shadow-2xs"
          >
            {t("nav.contactBtn")}
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
        {/* Left Column: Editorial Information */}
        <div className="flex flex-col items-start gap-5 text-start">
          <ScrollReveal y={24} duration={0.75} className="space-y-3.5">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.05]">
              Zakaria Mujur Prasetyo
            </h1>
            <p className="text-base sm:text-lg font-semibold text-body">
              {t("hero.roles")}
            </p>
          </ScrollReveal>

          <Parallax speed={-0.08} align="top" className="space-y-6 w-full max-w-xl">
            <p className="text-sm sm:text-base leading-relaxed text-body">
              {t("hero.desc")}
            </p>

            {/* Action Buttons: Direct Contact & Verified Credentials */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={`mailto:${profile.contact.email}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-brand/20 transition-all duration-150 hover:bg-brand-ink active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Mail className="size-4" />
                <span>{t("hero.emailBtn", "Kirim Email")}</span>
              </a>
              <SmoothNavLink
                href="#cv"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink shadow-2xs transition-all duration-150 hover:border-brand/40 hover:bg-surface active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/60 dark:bg-[#111422] dark:hover:bg-[#151928]"
              >
                <span>{t("hero.cvBtn", "Folder Berkas Karir")}</span>
                <ArrowRight className="size-3.5" />
              </SmoothNavLink>
            </div>
          </Parallax>
        </div>

        {/* Right Column: Disciplined 3D Card Presentation Frame with Living Parallax */}
        <div className="relative flex flex-col items-center justify-center lg:items-end w-full">
          <Parallax speed={0.24} align="top" className="w-full max-w-[320px]">
            <ProfileCardStage />
          </Parallax>
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
          <Parallax speed={-0.08} className="space-y-6">
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-body">
              {profile.bio.map((par) => (
                <p key={par.slice(0, 24)}>{par}</p>
              ))}
            </div>
          </Parallax>

          {/* Grounded Metric Cards */}
          <Parallax speed={0.12}>
            <div className="mt-8">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {profile.stats.map((stat, idx) => {
                  const statKey = idx === 0 ? "projects" : idx === 1 ? "certificates" : idx === 2 ? "years" : "organizations";
                  return (
                    <div
                      key={stat.label}
                      className="group relative overflow-hidden rounded-2xl border border-line/80 bg-white p-4 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md dark:border-line/60 dark:bg-[#111422]"
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
          <Parallax speed={0.14} className="lg:pt-2">
            <ol className="space-y-6 border-s border-line/70 ps-5 dark:border-line/40">
              {profile.experience.map((item) => (
                <li key={item.org} className="relative group">
                  <span
                    className="absolute top-1.5 -start-[26px] size-2.5 rounded-full border-2 border-white bg-brand shadow-xs transition-transform group-hover:scale-125 dark:border-slate-900"
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted">
                      {item.period} · {item.place}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-ink">{item.role}</p>
                  <p className="text-xs font-semibold text-brand dark:text-blue-400">{item.org}</p>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-body">{item.desc}</p>
                </li>
              ))}
            </ol>
          </Parallax>
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
      category: t("stack.uiuxTitle"),
      desc: t("stack.uiuxDesc"),
      tools: ["Figma", "Adobe XD"],
      skills: ["Design System", "User Flows", "Interactive Prototype", "Autolayout"],
    },
    {
      category: t("stack.frontendTitle"),
      desc: t("stack.frontendDesc"),
      tools: ["Next.js", "React", "TypeScript", "TailwindCSS"],
      skills: ["App Router", "State Synchronization", "Fluid Styling", "GSAP & Lenis"],
    },
    {
      category: t("stack.visualTitle"),
      desc: t("stack.visualDesc"),
      tools: ["Illustrator", "Photoshop", "CapCut", "Filmora"],
      skills: ["Three.js WebGL", "Vector Branding", "Raster Assets", "Motion Teaser"],
    },
    {
      category: t("stack.systemsTitle"),
      desc: t("stack.systemsDesc"),
      tools: ["MySQL", "GitHub"],
      skills: ["Git Versioning", "Relational Schema", "Python Scripts", "IT Support"],
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
              className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-line/60 dark:bg-[#111422]"
            >
              <h3 className="font-display text-base font-bold text-ink">
                {item.category}
              </h3>
              <p className="mt-1 text-xs text-body leading-relaxed">
                {item.desc}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.tools.map((toolName) => {
                  const tool = profile.stack.find((s) => s.name === toolName);
                  if (!tool) return null;
                  return (
                    <span
                      key={tool.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs font-semibold text-ink dark:border-line/60 dark:bg-slate-900"
                    >
                      <Image
                        src={tool.icon}
                        alt={tool.name}
                        width={16}
                        height={16}
                        className="size-4 shrink-0 object-contain"
                      />
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
              className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-line/60 dark:bg-[#111422]"
            >
              <h3 className="font-display text-base font-bold text-ink">
                {item.category}
              </h3>
              <p className="mt-1 text-xs text-body leading-relaxed">
                {item.desc}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.tools.map((toolName) => {
                  const tool = profile.stack.find((s) => s.name === toolName);
                  if (!tool) return null;
                  return (
                    <span
                      key={tool.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs font-semibold text-ink dark:border-line/60 dark:bg-slate-900"
                    >
                      <Image
                        src={tool.icon}
                        alt={tool.name}
                        width={16}
                        height={16}
                        className="size-4 shrink-0 object-contain"
                      />
                      <span>{tool.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </Parallax>
      </div>

      {/* Seamless Ribbon Ticker with Tangible Parallax */}
      <Parallax speed={0.16} className="relative w-full overflow-hidden rounded-2xl border border-line/60 bg-surface/60 py-3 dark:border-line/40 dark:bg-[#111422]/60">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--bg-page)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--bg-page)] to-transparent" />

        <div className="animate-marquee flex items-center gap-3">
          {duplicatedStack.map((tool, idx) => (
            <div
              key={`${tool.name}-${idx}`}
              aria-hidden={idx >= profile.stack.length ? "true" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink shadow-2xs dark:border-line/60 dark:bg-[#151928] dark:text-slate-200"
            >
              <Image
                src={tool.icon}
                alt={tool.name}
                width={18}
                height={18}
                className="size-4 shrink-0 object-contain"
              />
              <span className="whitespace-nowrap font-medium">
                {tool.name}
              </span>
            </div>
          ))}
        </div>
      </Parallax>
    </section>
  );
}

function Contact() {
  const { t } = useTranslation();

  return (
    <section id="kontak" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="contact" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24} className="w-full">
        <Parallax speed={0.12} className="w-full">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-xs dark:border-line/60 dark:bg-[#111422]">
            <div className="grid items-stretch lg:grid-cols-[1fr_1fr]">
              {/* KIRI: Lanyard 3D Stage */}
              <div className="relative flex flex-col justify-center border-b border-line lg:border-b-0 lg:border-r dark:border-line/40 bg-gradient-to-b from-slate-50/70 via-white to-slate-100/50 dark:from-[#0b0e1a] dark:to-[#13182b] p-4 sm:p-6">
                <div className="relative my-auto flex items-center justify-center py-2 sm:py-4">
                  <LanyardStage className="h-[340px] sm:h-[440px] lg:h-[480px]" />
                </div>
              </div>

              {/* KANAN: Panel Informasi Kontak */}
              <div className="relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 space-y-6">
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
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href={profile.contact.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-emerald-700 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.53c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.17-.47-.29" />
                      </svg>
                      WhatsApp
                    </a>
                    <a
                      href={`mailto:${profile.contact.email}`}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-ink shadow-2xs transition-all duration-150 hover:border-brand/50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/60 dark:bg-slate-900 dark:text-white"
                    >
                      <svg className="size-4 fill-none stroke-current shrink-0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <span className="truncate max-w-[200px] sm:max-w-none">{profile.contact.email}</span>
                    </a>
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
                      <span className="mt-0.5 font-bold text-brand dark:text-blue-400">{t("contact.since")}</span>
                    </div>
                  </div>

                  {/* Socials */}
                  <div className="pt-1">
                    <span className="text-xs font-semibold text-ink">{t("contact.socialsTitle")}</span>
                    <ul className="mt-2 flex flex-wrap items-center gap-2">
                      {profile.contact.socials.map((social) => (
                        <li key={social.label}>
                          <a
                            href={social.href}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink shadow-2xs transition-all duration-150 hover:border-brand/40 hover:text-brand active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/50 dark:bg-[#181d30] dark:text-slate-200"
                          >
                            {social.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Parallax>
      </ScrollReveal>
    </section>
  );
}

function Footer() {
  const { views, isEngaged } = usePageViews();

  const footerSocials = [
    {
      label: "GitHub",
      href: "https://github.com/ZekkCode",
      hoverClasses:
        "hover:text-slate-900 hover:border-slate-800 hover:bg-slate-100 hover:shadow-md dark:hover:text-white dark:hover:border-slate-300 dark:hover:bg-slate-800/80",
      icon: (
        <svg className="size-4.5" viewBox="0 0 24 24" fill="currentColor">
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
        "hover:text-[#E4405F] hover:border-[#E4405F]/50 hover:bg-[#E4405F]/10 hover:shadow-[0_0_14px_rgba(228,64,95,0.25)] dark:hover:text-[#ff5c8a] dark:hover:border-[#ff5c8a]/50 dark:hover:bg-[#ff5c8a]/10",
      icon: (
        <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        "hover:text-[#00f2fe] hover:border-[#00f2fe]/50 hover:bg-[#00f2fe]/10 hover:shadow-[0_0_14px_rgba(0,242,254,0.25)] dark:hover:text-[#00f2fe] dark:hover:border-[#00f2fe]/50 dark:hover:bg-[#00f2fe]/10",
      icon: (
        <svg className="size-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
        </svg>
      ),
    },
    {
      label: "Behance",
      href: "https://www.behance.net/zakariamp",
      hoverClasses:
        "hover:text-[#0057ff] hover:border-[#0057ff]/50 hover:bg-[#0057ff]/10 hover:shadow-[0_0_14px_rgba(0,87,255,0.25)] dark:hover:text-[#3b82f6] dark:hover:border-[#3b82f6]/50 dark:hover:bg-[#3b82f6]/10",
      icon: (
        <svg className="size-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-4.726 3-3.666 0-5.5-2.583-5.5-5.875 0-3.328 1.944-5.125 5.25-5.125 3.32 0 4.975 2.115 4.975 4.875 0 .422-.057.822-.125 1.125h-6.852c.071 1.579 1.094 2.658 2.457 2.658 1.157 0 1.916-.625 2.292-1.658h2.229zm-4.75-5.167c-1.125 0-1.875.75-2.083 1.833h4.167c-.042-1.042-.875-1.833-2.084-1.833zm-10.976-1.833h-4v-4h4c1.104 0 2 .896 2 2s-.896 2-2 2zm-4 2h4.5c1.381 0 2.5 1.119 2.5 2.5s-1.119 2.5-2.5 2.5h-4.5v-7zm0-6h-4v13h8.5c2.485 0 4.5-2.015 4.5-4.5 0-1.578-.814-2.969-2.05-3.774 1.246-.777 2.05-2.148 2.05-3.726 0-2.485-2.015-4.5-4.5-4.5h-4.5z" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/zakariamp",
      hoverClasses:
        "hover:text-[#0A66C2] hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/10 hover:shadow-[0_0_14px_rgba(10,102,194,0.25)] dark:hover:text-[#0a66c2] dark:hover:border-[#0a66c2]/50 dark:hover:bg-[#0a66c2]/10",
      icon: (
        <svg className="size-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.66 1.66 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66.92 0 1.66-.74 1.66-1.66 0-.92-.74-1.66-1.66-1.66z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="relative border-t border-line overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-10 dark:border-line">
      <div className="mx-auto max-w-5xl px-5">
        {/* Footer Top Row: Brand Info + Contact via Gmail */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-bold text-ink">{profile.brand}</p>
            <p className="text-xs text-body mt-0.5">
              © {new Date().getFullYear()} {profile.name}. Mojokerto, Indonesia.
            </p>
          </div>

          {/* Direct Gmail Contact */}
          <div>
            <a
              href={`mailto:${profile.contact.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-2 text-xs font-semibold text-ink shadow-2xs transition-all duration-150 hover:border-brand/40 hover:bg-white hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:hover:bg-[#151928] dark:hover:text-blue-400"
            >
              <Mail className="size-3.5 text-brand dark:text-blue-400" />
              <span>{profile.contact.email}</span>
              <ArrowUpRight className="size-3 text-muted" />
            </a>
          </div>
        </div>

        {/* Footer Middle Row: Socials & Live Verified Views */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line/60 pt-6 dark:border-line/40">
          <ul className="flex items-center gap-2 sm:gap-2.5">
            {footerSocials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className={`group flex size-9 sm:size-10 items-center justify-center rounded-full border border-line bg-white text-body shadow-2xs backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 dark:border-line/60 dark:bg-[#111422] dark:text-slate-400 ${s.hoverClasses}`}
                >
                  <span className="transition-transform duration-200 group-hover:scale-110">
                    {s.icon}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      {/* Blue Pixelated Signature Watermark: zakaria mp (DIBAWAH FOOTER) */}
      <div className="relative mx-auto w-full max-w-6xl px-5 text-center select-none pointer-events-none mt-10 sm:mt-14 -mb-4 sm:-mb-6">
        <p
          aria-hidden="true"
          className="font-pixel text-[13vw] sm:text-[11vw] md:text-[10vw] lg:text-[112px] font-bold leading-none tracking-wider uppercase bg-gradient-to-b from-blue-600 via-blue-500/40 to-transparent dark:from-blue-400 dark:via-blue-500/35 dark:to-transparent bg-clip-text text-transparent"
        >
          zakaria mp
        </p>
      </div>
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
          lineColor={isDark ? "#202638" : "#dcdce8"}
          hoverColor={isDark ? "#3b82f6" : "#1b45c4"}
          hoverFillColor={isDark ? "#1d4ed8" : "#1b45c4"}
          fillOpacity={isDark ? 0.22 : 0.14}
          cellSize={40}
          speed={0.25}
          lineWidth={1}
          radius={2.0}
          trail={0.7}
          glow={isDark ? 0.35 : 0.22}
          fade={1}
          clickCascade
          intro
        />
        {/* Lapisan peredam gradien ambient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(238,242,255,0.18),rgba(255,255,255,0.4)_70%)] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(30,41,59,0.18),rgba(8,9,14,0.55)_70%)] pointer-events-none" />
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
