"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import "@/lib/i18n";
import { CvFolderSection } from "@/components/cv-folder-section";
import { LanyardStage } from "@/components/lanyard-stage";
import { Parallax, ParallaxFloatingBadge, SmoothNavLink } from "@/components/parallax";
import { PortfolioPillNav } from "@/components/portfolio-pill-nav";
import { ProfileCardStage } from "@/components/profile-card-stage";
import { ProjectsSection } from "@/components/projects-section";
import { SectionTitle } from "@/components/section-title";
import { LanguageToggle, ThemeToggle } from "@/components/theme-language-toggle";
import ShapeGrid from "@/components/shape-grid";
import { usePageViews } from "@/lib/use-page-views";
import { profile } from "@/lib/profile";

function Header() {
  const { t } = useTranslation();
  const { views } = usePageViews();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/80 backdrop-blur-md dark:border-line/40 dark:bg-[#08090e]/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-5">
        <SmoothNavLink href="#atas" className="flex items-center gap-2 sm:gap-2.5">
          <img
            src={profile.avatar}
            alt={profile.brand}
            width={28}
            height={28}
            className="size-7 rounded-full object-cover border border-brand/20 shadow-2xs"
          />
          <span className="font-display text-base font-extrabold tracking-tight text-ink">
            {profile.brand}
          </span>
        </SmoothNavLink>

        <div className="flex items-center gap-2 sm:gap-2.5 pr-14 md:pr-0">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-body backdrop-blur-md dark:border-line/40 dark:bg-slate-900/80"
            title="Total Kunjungan / Page Views"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{views.toLocaleString()} views</span>
          </span>
          <LanguageToggle />
          <ThemeToggle />
          <a
            href={profile.contact.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 md:inline-flex dark:bg-white dark:text-ink"
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
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 pt-12 pb-20 sm:pt-20 sm:pb-28"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="flex flex-col items-start gap-6 text-left">
          <Parallax speed={-0.04} align="top" className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative size-14 sm:size-16 shrink-0 overflow-hidden rounded-full border-2 border-brand/25 bg-slate-100 shadow-md ring-4 ring-brand/10">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  width={64}
                  height={64}
                  className="size-full object-cover object-top"
                  loading="eager"
                  decoding="async"
                />
                <span
                  className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-xs dark:border-slate-900"
                  title="Online"
                />
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink leading-[1.08]">
                  {profile.name}
                </h1>
                <p className="text-base sm:text-lg font-semibold text-brand">
                  {t("hero.roles")}
                </p>
              </div>
            </div>
          </Parallax>

          <Parallax speed={0.03} align="top" className="space-y-6 w-full max-w-xl">
            <div className="rounded-2xl border border-line/80 bg-white/95 p-5 sm:p-6 shadow-xs backdrop-blur-md dark:border-line/60 dark:bg-[#111422]/90 space-y-4">
              <p className="text-base sm:text-lg leading-relaxed text-body">
                {t("hero.desc")}
              </p>

              <div className="border-t border-line/70 pt-3 text-xs sm:text-sm text-body flex flex-wrap items-center gap-x-3 gap-y-1.5 dark:border-line/40">
                <span className="font-semibold text-ink">{profile.site.replace("https://", "")}</span>
                <span aria-hidden="true" className="text-line">•</span>
                <span>{profile.location}</span>
                <span aria-hidden="true" className="text-line">•</span>
                <span className="font-medium text-brand">{t("hero.since")}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <SmoothNavLink
                href="#cv"
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-ink shadow-sm"
              >
                {t("hero.cvBtn")}
              </SmoothNavLink>
              <SmoothNavLink
                href="#proyek"
                className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/40 dark:border-line/50 dark:bg-[#111422] dark:text-slate-100"
              >
                {t("hero.projectsBtn")}
              </SmoothNavLink>
            </div>
          </Parallax>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          <ParallaxFloatingBadge
            label="Available for Work"
            speed={0.14}
            align="top"
            className="absolute -top-3.5 right-4 z-20 hidden sm:block"
          />
          <ParallaxFloatingBadge
            label="Next.js &amp; WebGL"
            speed={-0.12}
            align="top"
            className="absolute -bottom-4 left-4 z-20 hidden sm:block"
          />
          <Parallax speed={-0.07} align="top">
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
    <section id="tentang" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <SectionTitle
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        desc={t("about.desc")}
      />

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Parallax speed={-0.02}>
            <div className="rounded-2xl border border-line/80 bg-white/95 p-6 shadow-xs backdrop-blur-md dark:border-line/60 dark:bg-[#111422]/90 space-y-4">
              <div className="flex items-center gap-2 border-b border-line/60 pb-3 dark:border-line/40">
                <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  {t("about.philosophy")}
                </h3>
              </div>
              <div className="space-y-3.5 text-sm sm:text-base leading-relaxed text-body">
                {profile.bio.map((par) => (
                  <p key={par.slice(0, 24)}>{par}</p>
                ))}
              </div>
            </div>
          </Parallax>

          <Parallax speed={0.03}>
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {profile.stats.map((stat, idx) => {
                const statKey = idx === 0 ? "projects" : idx === 1 ? "certificates" : idx === 2 ? "years" : "organizations";
                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-line/80 bg-white/90 px-4 py-3 shadow-2xs backdrop-blur-xs dark:border-line/50 dark:bg-[#111422]/90"
                  >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="font-display text-2xl font-bold text-ink leading-none">{stat.value}</dd>
                    <dd className="mt-1.5 text-xs font-semibold text-body">
                      {t(`about.stats.${statKey}`)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Parallax>
        </div>

        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-bold text-brand dark:border-brand/30 dark:bg-brand/10">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
            {t("about.expTitle")}
          </div>
          <Parallax speed={0.05}>
            <ol className="space-y-4 border-l-2 border-brand/20 pl-4 sm:pl-5">
              {profile.experience.map((item) => (
                <li
                  key={item.org}
                  className="relative rounded-2xl border border-line/80 bg-white/95 p-4 sm:p-5 shadow-xs backdrop-blur-md transition hover:border-brand/40 dark:border-line/60 dark:bg-[#111422]/90"
                >
                  <span
                    className="absolute top-5 -left-[23px] sm:-left-[27px] size-2.5 rounded-full border-2 border-white bg-brand shadow-xs dark:border-slate-900"
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-brand">{item.period}</span>
                    <span className="font-medium text-body">{item.place}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-ink">{item.role}</p>
                  <p className="text-xs font-medium text-body/90">{item.org}</p>
                  <div className="mt-2.5 rounded-xl border border-line/50 bg-slate-50/80 p-3 text-xs sm:text-sm leading-relaxed text-body dark:border-line/40 dark:bg-[#181d30]/75">
                    {item.desc}
                  </div>
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

  return (
    <section id="stack" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <SectionTitle
        eyebrow={t("stack.eyebrow")}
        title={t("stack.title")}
        desc={t("stack.desc")}
      />
      <Parallax speed={0.03}>
        <div className="rounded-3xl border border-line/80 bg-white/95 p-6 sm:p-8 shadow-xs backdrop-blur-md dark:border-line/60 dark:bg-[#111422]/90">
          <ul className="flex flex-wrap gap-3">
            {profile.stack.map((tool) => (
              <li
                key={tool.name}
                className="inline-flex items-center gap-2.5 rounded-full border border-line/80 bg-white py-1.5 pr-4 pl-3 text-sm font-medium shadow-2xs transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-md dark:border-line/50 dark:bg-[#191e32]"
              >
                <img
                  src={tool.icon}
                  alt={tool.name}
                  width={20}
                  height={20}
                  className="size-5 shrink-0 object-contain"
                  loading="lazy"
                  decoding="async"
                />
                <span className="text-ink">{tool.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </Parallax>
    </section>
  );
}


function Contact() {
  const { t } = useTranslation();

  return (
    <section id="kontak" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 pt-8 pb-24 sm:pb-36 overflow-x-clip">
      <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
        {/* KIRI: Lanyard 3D Stage dengan Tali Panjang */}
        <Parallax speed={-0.03} className="w-full">
          <div className="relative flex items-center justify-center overflow-hidden rounded-3xl border border-line/60 bg-gradient-to-b from-slate-50/80 via-white to-slate-100/60 p-2 shadow-xs dark:from-[#111422] dark:via-[#191e32] dark:to-[#111422] dark:border-line/50">
            <LanyardStage className="h-[420px] sm:h-[540px] lg:h-[640px]" />
          </div>
        </Parallax>

        {/* KANAN: Kotak Div Contact Me */}
        <Parallax speed={0.04} className="w-full">
          <div className="relative overflow-hidden rounded-3xl bg-brand-ink p-8 text-left text-white shadow-xl shadow-brand-ink/15 sm:p-12 dark:bg-[#0e1326] dark:border dark:border-brand/30">
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)",
              }}
              aria-hidden="true"
            />
            <div className="relative z-10 flex flex-col gap-6">
              <div className="inline-flex w-max items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-xs">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span>{t("contact.badge")}</span>
              </div>

              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                  {t("contact.title")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
                  {t("contact.desc")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={profile.contact.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-ink transition-transform hover:-translate-y-0.5 hover:bg-slate-100 shadow-md"
                >
                  <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.53c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.17-.47-.29" />
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={`mailto:${profile.contact.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <svg className="size-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  {profile.contact.email}
                </a>
              </div>

              {/* Info Kontak & Lokasi */}
              <div className="border-t border-white/15 pt-5 text-xs text-white/70">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-semibold text-white/90">{t("contact.location")} </span>
                    <span>{profile.location}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white/90">{t("contact.status")} </span>
                    <span>{t("contact.since")}</span>
                  </div>
                </div>
              </div>

              {/* Socials */}
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/80">
                {profile.contact.socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-white underline-offset-4 hover:underline"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Parallax>
      </div>
    </section>
  );
}

function Footer() {
  const { views } = usePageViews();

  return (
    <footer className="border-t border-line/70 pb-28 md:pb-36 dark:border-line/40">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-body sm:flex-row">
        <p>© {new Date().getFullYear()} {profile.name}</p>
        <div className="flex items-center gap-2 text-xs text-body">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-white/60 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-xs dark:border-line/40 dark:bg-slate-900/60">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>{views.toLocaleString()} views</span>
          </span>
          <span aria-hidden="true" className="text-line">•</span>
          <span>Next.js + Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          fillOpacity={isDark ? 0.22 : 0.12}
          cellSize={40}
          speed={0.25}
          lineWidth={1}
          radius={1.5}
          trail={0.6}
          glow={isDark ? 0.45 : 0.3}
          fade={1}
          clickCascade
          intro
        />
        {/* Lapisan peredam gradien agar teks penjelasan selalu kontras & nyaman dibaca */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(238,242,255,0.45),rgba(255,255,255,0.65)_70%)] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(30,41,59,0.35),rgba(8,9,14,0.75)_70%)] pointer-events-none" />
      </div>
      <Header />
      <PortfolioPillNav />
      <main>
        <Hero />
        <About />
        <CvFolderSection />
        <Stack />
        <ProjectsSection />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

