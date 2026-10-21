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
          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.06]">
              {profile.name}
            </h1>
            <p className="text-lg sm:text-xl font-semibold text-brand">
              {profile.rolesFull}
            </p>
          </div>

          <p className="max-w-lg text-base leading-relaxed text-body">
            Membangun antarmuka produk digital yang berkarakter, interaktif, dan mudah digunakan.
            Menggabungkan desain visual terarah dengan rekayasa Next.js, TypeScript, dan visual WebGL.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <SmoothNavLink
              href="#cv"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-ink"
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
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <ProfileCardStage />
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
          <div className="space-y-4 text-base leading-relaxed text-body">
            {profile.bio.map((par) => (
              <p key={par.slice(0, 24)}>{par}</p>
            ))}
          </div>

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
        <ul className="flex flex-wrap gap-2.5">
          {profile.stack.map((tool) => (
            <li
              key={tool}
              className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-brand/40 backdrop-blur-xs"
            >
              {tool}
            </li>
          ))}
        </ul>
      </Parallax>
    </section>
  );
}


function Contact() {
  return (
    <section id="kontak" className="w-full scroll-mt-20 pt-6 pb-24 sm:pb-36 overflow-x-clip">
      <div className="mb-10 w-full">
        <LanyardStage />
      </div>

      <div className="mx-auto w-full max-w-5xl px-5">
        <Parallax speed={0.04}>
          <div className="relative overflow-hidden rounded-3xl bg-brand-ink px-6 py-12 text-center sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)",
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Mulai proyek bersama
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                Terbuka untuk kolaborasi frontend, desain antarmuka, dan konsultasi teknis.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`mailto:${profile.contact.email}`}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-slate-100"
                >
                  {profile.contact.email}
                </a>
                <a
                  href={profile.contact.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  WhatsApp
                </a>
              </div>

              <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-white/80">
                {profile.contact.socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-white"
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

