"use client";

import { useTranslation } from "react-i18next";
import { Parallax } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";

export function ProjectsSection() {
  const { t } = useTranslation();
  const { projects } = useSiteConfig();

  return (
    <section id="proyek" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <SectionTitle
        title={t("projects.title")}
        desc={t("projects.desc")}
      />

      <Parallax speed={0.03}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, idx) => {
            const isFeatured = idx === 0;

            if (isFeatured) {
              return (
                <div
                  key={project.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white via-white to-slate-50/80 p-6 sm:p-8 shadow-xs transition duration-300 hover:border-brand/50 hover:shadow-lg sm:col-span-2 lg:col-span-3 dark:border-line/60 dark:from-[#111422] dark:via-[#111422] dark:to-[#161a2e]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand dark:text-blue-400">
                          Featured Project
                        </span>
                        <span aria-hidden="true" className="text-line">•</span>
                        <span className="text-xs text-body">Sistem Terintegrasi</span>
                      </div>
                      <h3 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                        {project.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-body">
                        {project.desc}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-start lg:items-end gap-3 pt-2 lg:pt-0">
                      {project.repo && (
                        <a
                          href={project.repo}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-black hover:-translate-y-0.5 dark:bg-white dark:text-slate-900"
                        >
                          <span>{t("projects.viewRepo")}</span>
                          <span aria-hidden="true">→</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line/60 pt-5 dark:border-line/40">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-line/80 bg-white/80 px-3 py-1 text-xs font-semibold text-body dark:border-line/50 dark:bg-slate-900/80 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Parallax
                key={project.id}
                speed={idx % 2 === 0 ? 0.03 : -0.02}
                className="flex"
              >
                <a
                  href={project.repo || "#proyek"}
                  target={project.repo ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group flex flex-1 flex-col justify-between rounded-2xl border border-line/80 bg-white/95 p-5 sm:p-6 shadow-2xs transition duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md dark:border-line/60 dark:bg-[#111422]/90"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-mono text-[11px]">0{idx + 1}</span>
                      <span className="text-[11px] font-medium text-body">
                        {project.tags[0] || "Code"}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold text-ink tracking-tight group-hover:text-brand transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-body line-clamp-3">
                      {project.desc}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-line/50 pt-4 dark:border-line/30 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium text-body"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand dark:text-blue-400 group-hover:underline">
                      {t("projects.viewRepo")} →
                    </span>
                  </div>
                </a>
              </Parallax>
            );
          })}
        </div>
      </Parallax>
    </section>
  );
}


