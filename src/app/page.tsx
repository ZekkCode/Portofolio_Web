import { CvFolderSection } from "@/components/cv-folder-section";
import { LanyardStage } from "@/components/lanyard-stage";
import { Parallax, ParallaxFloatingBadge, SmoothNavLink } from "@/components/parallax";
import { PortfolioPillNav } from "@/components/portfolio-pill-nav";
import { ProfileCardStage } from "@/components/profile-card-stage";
import { ProjectsSection } from "@/components/projects-section";
import { SectionTitle } from "@/components/section-title";
import ShapeGrid from "@/components/shape-grid";
import { profile } from "@/lib/profile";

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <SmoothNavLink href="#atas" className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-brand" aria-hidden="true" />
          <span className="font-display text-base font-extrabold tracking-tight text-ink">
            {profile.brand}
          </span>
        </SmoothNavLink>

        <a
          href={profile.contact.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 md:inline-flex"
        >
          Hubungi Saya
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="atas"
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 pt-12 pb-20 sm:pt-20 sm:pb-28"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="flex flex-col items-start gap-6 text-left">
          <Parallax speed={-0.04} align="top" className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.06]">
              {profile.name}
            </h1>
            <p className="text-lg sm:text-xl font-semibold text-brand">
              {profile.rolesFull}
            </p>
          </Parallax>

          <Parallax speed={0.03} align="top" className="space-y-6">
            <p className="max-w-lg text-base leading-relaxed text-body">
              Membangun antarmuka produk digital yang berkarakter, interaktif, dan mudah digunakan.
              Menggabungkan desain visual terarah dengan rekayasa Next.js, TypeScript, dan visual WebGL.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <SmoothNavLink
                href="#cv"
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-ink shadow-sm"
              >
                Buka Berkas CV
              </SmoothNavLink>
              <SmoothNavLink
                href="#proyek"
                className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
              >
                Lihat Proyek
              </SmoothNavLink>
            </div>

            <div className="pt-2 text-sm text-body flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-ink">{profile.site.replace("https://", "")}</span>
              <span aria-hidden="true" className="text-line">•</span>
              <span>{profile.location}</span>
              <span aria-hidden="true" className="text-line">•</span>
              <span>Freelance sejak {profile.since}</span>
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
  return (
    <section id="tentang" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <SectionTitle
        title="Desain Antarmuka & Rekayasa Web"
        desc={`${profile.rolesFull}. Merancang antarmuka bersih dan membangun sistem web yang andal.`}
      />

      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Parallax speed={-0.02}>
            <div className="space-y-4 text-base leading-relaxed text-body">
              {profile.bio.map((par) => (
                <p key={par.slice(0, 24)}>{par}</p>
              ))}
            </div>
          </Parallax>

          <Parallax speed={0.03}>
            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {profile.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-white/80 px-4 py-3 shadow-2xs backdrop-blur-xs"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-display text-2xl leading-none">{stat.value}</dd>
                  <dd className="mt-1.5 text-sm font-medium text-body">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Parallax>
        </div>

        <div>
          <h3 className="mb-5 text-sm font-bold text-brand">
            Pengalaman Kerja & Organisasi
          </h3>
          <Parallax speed={0.05}>
            <ol className="space-y-6 border-l border-line pl-5">
              {profile.experience.map((item) => (
                <li key={item.org} className="relative">
                  <span
                    className="absolute top-1.5 -left-[26px] size-2.5 rounded-full border-2 border-white bg-brand shadow-xs"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold text-body">
                    {item.period}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.role}</p>
                  <p className="text-sm text-body">
                    {item.org} · {item.place}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">{item.desc}</p>
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
  return (
    <section id="stack" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <SectionTitle eyebrow="Tech Stack" title="Peralatan harian" />
      <Parallax speed={0.03}>
        <ul className="flex flex-wrap gap-3">
          {profile.stack.map((tool) => (
            <li
              key={tool.name}
              className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white/85 py-1.5 pr-4 pl-2 text-sm font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-md backdrop-blur-xs"
            >
              <img
                src={tool.icon}
                alt={tool.name}
                width={24}
                height={24}
                className="size-6 rounded-full object-contain"
                loading="lazy"
                decoding="async"
              />
              <span className="text-ink">{tool.name}</span>
            </li>
          ))}
        </ul>
      </Parallax>
    </section>
  );
}


function Contact() {
  return (
    <section id="kontak" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 pt-8 pb-24 sm:pb-36 overflow-x-clip">
      <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
        {/* KIRI: Lanyard 3D Stage dengan Tali Panjang */}
        <Parallax speed={-0.03} className="w-full">
          <div className="relative flex items-center justify-center overflow-hidden rounded-3xl border border-line/60 bg-gradient-to-b from-slate-50/80 via-white to-slate-100/60 p-2 shadow-xs">
            <LanyardStage className="h-[520px] sm:h-[580px] lg:h-[640px]" />
          </div>
        </Parallax>

        {/* KANAN: Kotak Div Contact Me */}
        <Parallax speed={0.04} className="w-full">
          <div className="relative overflow-hidden rounded-3xl bg-brand-ink p-8 text-left text-white shadow-xl shadow-brand-ink/15 sm:p-12">
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
                <span>Terbuka untuk freelance &amp; kolaborasi</span>
              </div>

              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                  Hubungi Saya
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
                  Tertarik mendiskusikan desain antarmuka, rekayasa frontend web, maupun pengembangan sistem? Mari terhubung langsung.
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
                    <span className="font-semibold text-white/90">Lokasi: </span>
                    <span>{profile.location}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white/90">Status: </span>
                    <span>Freelance sejak {profile.since}</span>
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
  return (
    <footer className="border-t border-line/70 pb-28 md:pb-36">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-5 py-8 text-sm text-body sm:flex-row">
        <p>© {new Date().getFullYear()} {profile.name}</p>
        <p>Next.js + Tailwind CSS</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <ShapeGrid
          shape="square"
          direction="diagonal"
          lineColor="#dcdce8"
          hoverColor="#1b45c4"
          hoverFillColor="#1b45c4"
          fillOpacity={0.15}
          cellSize={40}
          speed={0.3}
          lineWidth={1}
          radius={1.5}
          trail={0.6}
          glow={0.35}
          fade={1}
          clickCascade
          intro
        />
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

