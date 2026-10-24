"use client";

import { useTranslation } from "react-i18next";
import { Parallax } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";

export function ProjectsSection() {
  const { t } = useTranslation();
  const { projects } = useSiteConfig();

  const featured = projects[0];
  const list = projects.slice(1);

  return (
    <section id="proyek" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <SectionTitle
        title={t("projects.title")}
        desc={t("projects.desc")}
      />

      {/* Featured Flagship Case Study */}
      {featured && (
        <Parallax speed={0.02} className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-line/80 bg-white p-6 sm:p-9 shadow-xs dark:border-line/60 dark:bg-[#111422]">
            {/* Top Eyebrow */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4 dark:border-line/40">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand dark:text-blue-400">
                  01 / STUDI KASUS UNGGULAN
                </span>
                <span aria-hidden="true" className="text-line">•</span>
                <span className="text-xs font-semibold text-body">
                  {featured.role || "Frontend & UI/UX Developer"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-muted">Sistem Terintegrasi</span>
              </div>
            </div>

            {/* Split Content Body */}
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                    {featured.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-brand dark:text-blue-400">
                    Sistem Informasi & Peringatan Rantai Pasok Pangan Pokok
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-body">
                  {featured.desc}
                </p>

                {/* Structured Case Study Highlights */}
                <div className="space-y-3 rounded-2xl border border-line/60 bg-slate-50/70 p-4 text-xs dark:border-line/40 dark:bg-[#181d30]/60">
                  <div>
                    <span className="font-bold text-ink">Tantangan: </span>
                    <span className="text-body">
                      {featured.problem || "Disparitas pasokan logistik pangan dan ketiadaan sistem peringatan dini otomatis."}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-ink">Solusi Rekayasa: </span>
                    <span className="text-body">
                      {featured.highlight || "Dashboard analitik distribusi logistik interaktif dengan visualisasi ambang batas kritis pangan."}
                    </span>
                  </div>
                  {featured.outcome && (
                    <div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Dampak: </span>
                      <span className="text-body">{featured.outcome}</span>
                    </div>
                  )}
                </div>

                {/* Tags and CTA */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {featured.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-body dark:border-line/60 dark:bg-[#111422] dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {featured.repo && (
                    <a
                      href={featured.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-black dark:bg-white dark:text-slate-900"
                    >
                      <span>Lihat Repositori</span>
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Architectural Interface Preview Card */}
              <div className="relative overflow-hidden rounded-2xl border border-line/70 bg-gradient-to-b from-slate-900 to-[#0d111c] p-5 text-slate-200 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-red-500/80" />
                    <span className="size-2 rounded-full bg-amber-500/80" />
                    <span className="size-2 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-mono text-[11px] text-slate-400">sigap-pangan.terminal</span>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                    ONLINE
                  </span>
                </div>

                <div className="space-y-3 pt-4 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Komoditas Utama</span>
                    <span className="text-white font-semibold">Beras, Minyak, Gula</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Monitoring Logistik</span>
                    <span className="text-emerald-400">Status Aman (87%)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Early Warning System</span>
                    <span className="text-amber-300">Ambang Kritis Aktif</span>
                  </div>
                  <div className="pt-2 text-[11px] text-slate-400">
                    <p className="text-slate-500">$ stack --inspect</p>
                    <p className="text-sky-300 mt-1">Next.js 16 · TypeScript · Tailwind CSS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Parallax>
      )}

      {/* Grid of Other 6 Projects (Curated Engineering Works) */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((project, idx) => {
          const indexNum = String(idx + 2).padStart(2, "0");

          return (
            <Parallax
              key={project.id}
              speed={idx % 2 === 0 ? 0.02 : -0.015}
              className="flex"
            >
              <div className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-md dark:border-line/60 dark:bg-[#111422]">
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between border-b border-line/60 pb-3 dark:border-line/40">
                    <span className="font-mono text-xs font-bold text-brand dark:text-blue-400">
                      {indexNum}
                    </span>
                    <span className="text-[11px] font-semibold text-muted">
                      {project.role || project.tags[0] || "Engineering"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-3.5">
                    <h3 className="font-display text-lg font-bold tracking-tight text-ink group-hover:text-brand transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-body line-clamp-3">
                      {project.desc}
                    </p>
                  </div>

                  {/* Problem & Highlight Mini-Insight */}
                  {(project.problem || project.highlight) && (
                    <div className="mt-3.5 rounded-xl border border-line/50 bg-slate-50/70 p-3 text-[11px] dark:border-line/30 dark:bg-[#181d30]/50">
                      <p className="text-body line-clamp-2">
                        <strong className="text-ink">Fokus: </strong>
                        {project.highlight || project.problem}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer with Tags and Repo Link */}
                <div className="mt-5 border-t border-line/50 pt-3.5 dark:border-line/30">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-end">
                    {project.repo ? (
                      <a
                        href={project.repo}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink transition-colors hover:text-brand dark:text-white dark:hover:text-blue-400"
                      >
                        <span>{t("projects.viewRepo")}</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted">Internal</span>
                    )}
                  </div>
                </div>
              </div>
            </Parallax>
          );
        })}
      </div>
    </section>
  );
}

export default ProjectsSection;
