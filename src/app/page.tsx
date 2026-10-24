"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { CvFolderSection } from "@/components/cv-folder-section";
import { LanyardStage } from "@/components/lanyard-stage";
import { Parallax, SmoothNavLink } from "@/components/parallax";
import { PortfolioPillNav } from "@/components/portfolio-pill-nav";
import { ProfileCardStage } from "@/components/profile-card-stage";
import { ProjectsSection } from "@/components/projects-section";
import { SectionTitle } from "@/components/section-title";
import { LanguageToggle, ThemeToggle } from "@/components/theme-language-toggle";
import { usePageViews } from "@/lib/use-page-views";
import { profile } from "@/lib/profile";

function Header() {
  const { t } = useTranslation();
  const { views } = usePageViews();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md dark:border-line dark:bg-[#08090e]/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-5">
        <SmoothNavLink href="#atas" className="flex items-center gap-2.5">
          <Image
            src={profile.avatar}
            alt={profile.brand}
            width={30}
            height={30}
            className="size-7.5 rounded-full object-cover border border-brand/30 shadow-2xs"
          />
          <span className="font-display text-base font-bold tracking-tight text-ink">
            {profile.brand}
          </span>
        </SmoothNavLink>

        <div className="flex items-center gap-2 sm:gap-2.5 pr-14 md:pr-0">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1 text-[11px] font-semibold text-body backdrop-blur-md dark:border-line/60 dark:bg-slate-900/80"
            title="Total Kunjungan / Page Views"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span suppressHydrationWarning>{views.toLocaleString("id-ID")} views</span>
          </span>
          <LanguageToggle />
          <ThemeToggle />
          <a
            href={profile.contact.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-black md:inline-flex dark:bg-white dark:text-slate-900 shadow-2xs"
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
      className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 pt-8 pb-12 sm:pt-14 sm:pb-16"
    >
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        {/* Left Column: Editorial Information */}
        <div className="flex flex-col items-start gap-5 text-left">
          <Parallax speed={-0.02} align="top" className="space-y-3.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-semibold text-body dark:border-line/60 dark:bg-[#111422]/80">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mojokerto, Indonesia · Terbuka untuk Kolaborasi</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink leading-[1.08]">
              Zakaria Mujur{" "}
              <span className="text-brand dark:text-blue-400">
                Prasetyo
              </span>
            </h1>
            <p className="text-base sm:text-lg font-bold text-ink">
              {t("hero.roles")}
            </p>
          </Parallax>

          <Parallax speed={0.015} align="top" className="space-y-5 w-full max-w-xl">
            <p className="text-sm sm:text-base leading-relaxed text-body">
              {t("hero.desc")}
            </p>

            {/* Editorial Metadata Grid (Substance over decorative pills) */}
            <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-line/70 bg-surface/70 p-3.5 text-xs dark:border-line/50 dark:bg-[#111422]/70">
              <div>
                <span className="block text-[11px] font-semibold text-muted">Lokasi Basis</span>
                <span className="font-bold text-ink">{profile.location}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-muted">Praktik Lapangan</span>
                <span className="font-bold text-brand dark:text-blue-400">Sejak 2020 (6+ Tahun)</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-muted">Domain Keahlian</span>
                <span className="font-bold text-ink">UI/UX & Frontend Web</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-muted">Pendidikan</span>
                <span className="font-bold text-ink">Informatika UTM (2024)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <SmoothNavLink
                href="#proyek"
                className="rounded-full bg-brand px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-ink hover:shadow-md"
              >
                {t("hero.projectsBtn")} →
              </SmoothNavLink>
              <SmoothNavLink
                href="#cv"
                className="rounded-full border border-line bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink shadow-2xs transition hover:border-brand/40 dark:border-line dark:bg-[#111422] dark:text-slate-100"
              >
                {t("hero.cvBtn")}
              </SmoothNavLink>
              <a
                href={profile.contact.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-body hover:text-ink transition-colors px-2 py-1"
              >
                WhatsApp
              </a>
              <a
                href="https://github.com/ZekkCode"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-body hover:text-ink transition-colors px-2 py-1"
              >
                GitHub
              </a>
            </div>
          </Parallax>
        </div>

        {/* Right Column: Disciplined 3D Card Presentation Frame */}
        <div className="relative flex flex-col items-center justify-center lg:items-end">
          <div className="w-full max-w-[320px]">
            <ProfileCardStage />
            <p className="mt-2 text-center text-[11px] font-medium text-muted">
              Kartu Profil 3D · Sentuh atau gerakkan kursor untuk interaksi
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const { t } = useTranslation();

  return (
    <section id="tentang" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <SectionTitle
        title={t("about.title")}
        desc={t("about.desc")}
      />

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Parallax speed={-0.015}>
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-body">
              {profile.bio.map((par) => (
                <p key={par.slice(0, 24)}>{par}</p>
              ))}
            </div>
          </Parallax>

          {/* Grounded Metric Cards */}
          <Parallax speed={0.015}>
            <div className="mt-8">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
                Rekam Jejak & Pengalaman Terverifikasi
              </h4>
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
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand dark:text-blue-400">
            {t("about.expTitle")}
          </h3>
          <Parallax speed={0.03}>
            <ol className="space-y-6 border-l border-line/70 pl-5 dark:border-line/40">
              {profile.experience.map((item) => (
                <li key={item.org} className="relative group">
                  <span
                    className="absolute top-1.5 -left-[26px] size-2.5 rounded-full border-2 border-white bg-brand shadow-xs transition-transform group-hover:scale-125 dark:border-slate-900"
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
      category: "UI/UX & Desain Produk",
      desc: "Perancangan sistem antarmuka, wireframing, dan prototipe interaktif.",
      tools: ["Figma", "Adobe XD"],
      skills: ["Design System", "User Flows", "Interactive Prototype", "Autolayout"],
    },
    {
      category: "Rekayasa Web Frontend",
      desc: "Implementasi antarmuka performa tinggi, aksesibilitas, dan tipe data ketat.",
      tools: ["Next.js", "React", "TypeScript", "TailwindCSS"],
      skills: ["App Router", "State Synchronization", "Fluid Styling", "GSAP & Lenis"],
    },
    {
      category: "Interaksi 3D & Visual Kreatif",
      desc: "Eksplorasi canvas Three.js, aset grafis vektor, dan visual pendukung.",
      tools: ["Illustrator", "Photoshop", "CapCut", "Filmora"],
      skills: ["Three.js WebGL", "Vector Branding", "Raster Assets", "Motion Teaser"],
    },
    {
      category: "Arsitektur Sistem & Perangkat",
      desc: "Manajemen repositori, query basis data relasional, dan integrasi API.",
      tools: ["MySQL", "GitHub"],
      skills: ["Git Versioning", "Relational Schema", "Python Scripts", "IT Support"],
    },
  ];

  return (
    <section id="stack" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <SectionTitle
        title={t("stack.title")}
        desc={t("stack.desc")}
      />

      {/* Discipline-Grouped Taxonomy Grid */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        {disciplines.map((item) => (
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

            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line/50 pt-3 dark:border-line/30">
              {item.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-400"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Seamless Ribbon Ticker */}
      <Parallax speed={0.02} className="relative w-full overflow-hidden rounded-2xl border border-line/60 bg-surface/60 py-3 dark:border-line/40 dark:bg-[#111422]/60">
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
    <section id="kontak" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <Parallax speed={0.02} className="w-full">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-xs dark:border-line/60 dark:bg-[#111422]">
          <div className="grid items-stretch lg:grid-cols-[1fr_1fr]">
            {/* KIRI: Lanyard 3D Stage */}
            <div className="relative flex flex-col justify-between border-b border-line lg:border-b-0 lg:border-r dark:border-line/40 bg-gradient-to-b from-slate-50/70 via-white to-slate-100/50 dark:from-[#0b0e1a] dark:to-[#13182b] p-4 sm:p-6">
              <div className="flex items-center justify-between border-b border-line/50 pb-3 dark:border-line/30">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-brand" />
                  <span className="text-xs font-semibold text-ink">{t("contact.cardTitle")}</span>
                </div>
                <span className="text-[11px] font-medium text-body">{t("contact.cardSubtitle")}</span>
              </div>

              <div className="relative my-auto flex items-center justify-center py-4">
                <LanyardStage className="h-[400px] sm:h-[460px] lg:h-[480px]" />
              </div>

              <div className="border-t border-line/50 pt-3 text-center text-xs text-body dark:border-line/30">
                <span>{t("contact.cardHint")}</span>
              </div>
            </div>

            {/* KANAN: Panel Informasi Kontak */}
            <div className="relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 space-y-6">
              <div className="space-y-4">
                <div className="inline-flex w-max items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand dark:border-brand/30 dark:bg-brand/10 dark:text-blue-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>{t("contact.badge")}</span>
                </div>

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
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.53c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.17-.47-.29" />
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-ink shadow-2xs transition hover:border-brand/50 dark:border-line/60 dark:bg-slate-900 dark:text-white"
                  >
                    <svg className="size-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    {profile.contact.email}
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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-body">{t("contact.socialsTitle")}</span>
                  <ul className="mt-2 flex flex-wrap items-center gap-2">
                    {profile.contact.socials.map((social) => (
                      <li key={social.label}>
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink shadow-2xs transition hover:border-brand/40 hover:text-brand dark:border-line/50 dark:bg-[#181d30] dark:text-slate-200"
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
    </section>
  );
}

function Footer() {
  const { t } = useTranslation();
  const { views } = usePageViews();

  return (
    <footer className="border-t border-line pb-28 md:pb-36 dark:border-line">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-body sm:flex-row">
        <div>
          <p className="font-display text-base font-bold text-ink">{profile.brand}</p>
          <p className="text-xs text-body mt-0.5">© {new Date().getFullYear()} {profile.name}. Mojokerto, Indonesia.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-body">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-2xs backdrop-blur-xs dark:border-line dark:bg-slate-900/90 dark:text-slate-200">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span suppressHydrationWarning>{views.toLocaleString("id-ID")} {t("contact.views")}</span>
          </span>
          <span aria-hidden="true" className="text-line">•</span>
          <span>Next.js 16 + Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
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
