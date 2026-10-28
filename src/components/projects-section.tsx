"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, type Project } from "@/lib/site-store";
import { RepoPreviewModal } from "@/components/repo-preview-modal";

export function ProjectsSection() {
  const { t } = useTranslation();
  const { projects } = useSiteConfig();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const featured = projects[0];
  const list = projects.slice(1);

  return (
    <section id="proyek" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <ScrollReveal y={24}>
        <SectionTitle
          title={t("projects.title")}
          desc={t("projects.desc")}
        />
      </ScrollReveal>

      {projects.length === 0 ? (
        <Parallax speed={0.015}>
          <div
            id="proyek-empty"
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line/80 bg-white/50 px-6 py-14 text-center shadow-2xs dark:border-line/40 dark:bg-[#111422]/50"
          >
            <div className="flex size-14 items-center justify-center rounded-2xl border border-line/60 bg-surface text-muted shadow-2xs dark:border-line/40 dark:bg-[#151928]">
              <svg
                className="size-6 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink">
              {t("projects.emptyTitle")}
            </h3>
            <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-body">
              {t("projects.emptyDesc")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-xs font-semibold text-ink shadow-2xs transition hover:border-brand/40 hover:bg-surface active:scale-[0.97] dark:border-line/60 dark:bg-[#111422] dark:hover:bg-[#151928]"
              >
                <span>{t("projects.adminBtn")}</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </Parallax>
      ) : (
        <>
          {/* Featured Flagship Case Study */}
          {featured && (
            <Parallax speed={0.10} className="mb-10">
              <div className="relative overflow-hidden rounded-3xl border border-line/80 bg-white p-6 sm:p-8 shadow-xs dark:border-line/60 dark:bg-[#111422]">
                {/* Top Metadata Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4 dark:border-line/40">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-0.5 text-xs font-bold text-brand dark:bg-blue-500/10 dark:text-blue-400">
                      {t("projects.featuredBadge")}
                    </span>
                    {featured.role && (
                      <>
                        <span aria-hidden="true" className="text-line">•</span>
                        <span className="text-xs font-medium text-body">
                          {featured.role}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Content Body: Split if screenshot is available, otherwise centered/spacious */}
                <div className={`mt-6 grid gap-8 ${featured.image ? "lg:grid-cols-[1.1fr_0.9fr] lg:items-center" : "max-w-3xl"}`}>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                        {featured.title}
                      </h3>
                      {featured.role && (
                        <p className="mt-1 text-xs font-semibold text-brand dark:text-blue-400">
                          {featured.role}
                        </p>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed text-body">
                      {featured.desc}
                    </p>

                    {/* Structured Case Study Details */}
                    {(featured.problem || featured.highlight || featured.outcome) && (
                      <div className="space-y-2.5 rounded-2xl border border-line/60 bg-slate-50/70 p-4 text-xs dark:border-line/40 dark:bg-[#181d30]/60">
                        {featured.problem && (
                          <div>
                            <span className="font-bold text-ink">{t("projects.challenge")} </span>
                            <span className="text-body">{featured.problem}</span>
                          </div>
                        )}
                        {featured.highlight && (
                          <div>
                            <span className="font-bold text-ink">{t("projects.solution")} </span>
                            <span className="text-body">{featured.highlight}</span>
                          </div>
                        )}
                        {featured.outcome && (
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{t("projects.outcome")} </span>
                            <span className="text-body">{featured.outcome}</span>
                          </div>
                        )}
                      </div>
                    )}

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

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProject(featured)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-2xs transition-all duration-150 hover:border-brand/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/60 dark:bg-[#111422]"
                        >
                          <span>{t("projects.previewBtn")}</span>
                          <span aria-hidden="true">↗</span>
                        </button>
                        {featured.repo && (
                          <a
                            href={featured.repo}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-black active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:bg-white dark:text-slate-900"
                          >
                            <span>{t("projects.viewRepo")}</span>
                            <span aria-hidden="true">→</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Screenshot Container (Only rendered if image URL is present) */}
                  {featured.image && (
                    <button
                      type="button"
                      onClick={() => setSelectedProject(featured)}
                      className="group relative block w-full text-start overflow-hidden rounded-2xl border border-line/80 shadow-xs transition hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/60"
                      aria-label={`${t("projects.previewBtn")}: ${featured.title}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featured.image}
                        alt={featured.title}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </button>
                  )}
                </div>
              </div>
            </Parallax>
          )}

          {/* Grid of Other Projects */}
          {list.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((project, idx) => {
                const indexNum = String(idx + 2).padStart(2, "0");

                return (
                  <Parallax
                    key={project.id}
                    speed={idx % 2 === 0 ? 0.16 : -0.12}
                    className="flex"
                  >
                    <div className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-md dark:border-line/60 dark:bg-[#111422]">
                      <div>
                        {/* Top Metadata */}
                        <div className="flex items-center justify-between border-b border-line/60 pb-3 dark:border-line/40">
                          <span className="font-mono text-xs font-bold text-brand dark:text-blue-400">
                            #{indexNum}
                          </span>
                          {project.role && (
                            <span className="text-[11px] font-medium text-muted">
                              {project.role}
                            </span>
                          )}
                        </div>

                        {/* Screenshot Thumbnail (Only rendered if image URL is present) */}
                        {project.image && (
                          <button
                            type="button"
                            onClick={() => setSelectedProject(project)}
                            className="mt-3.5 group/preview relative block w-full overflow-hidden rounded-xl border border-line/70 text-start transition hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            aria-label={`${t("projects.previewBtn")}: ${project.title}`}
                          >
                            <div className="relative h-36 w-full overflow-hidden bg-surface">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={project.image}
                                alt={project.title}
                                className="size-full object-cover transition-transform duration-300 group-hover/preview:scale-105"
                              />
                            </div>
                          </button>
                        )}

                        {/* Title & Description */}
                        <div className="mt-3.5">
                          <h3 className="font-display text-lg font-bold tracking-tight text-ink group-hover:text-brand transition-colors">
                            {project.title}
                          </h3>
                          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-body line-clamp-3">
                            {project.desc}
                          </p>
                        </div>

                        {/* Problem & Highlight Insight */}
                        {(project.problem || project.highlight) && (
                          <div className="mt-3.5 rounded-xl border border-line/50 bg-slate-50/70 p-3 text-[11px] dark:border-line/30 dark:bg-[#181d30]/50">
                            <p className="text-body line-clamp-2">
                              <strong className="text-ink">{t("projects.focus")} </strong>
                              {project.highlight || project.problem}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer with Tags and Action Buttons */}
                      <div className="mt-5 border-t border-line/50 pt-3.5 dark:border-line/30">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProject(project)}
                            className="inline-flex min-h-[38px] items-center gap-1 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-body hover:border-brand/40 hover:text-ink active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/40 dark:bg-slate-800"
                          >
                            <span>{t("projects.previewBtn")}</span>
                            <span aria-hidden="true">↗</span>
                          </button>

                          {project.repo ? (
                            <a
                              href={project.repo}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-[38px] items-center gap-1.5 text-xs font-bold text-ink transition-all duration-150 hover:text-brand active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:text-white dark:hover:text-blue-400"
                            >
                              <span>{t("projects.viewRepo")}</span>
                              <span aria-hidden="true">→</span>
                            </a>
                          ) : (
                            <span className="text-xs text-muted">{t("repoModal.internal")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Parallax>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Repository Full Preview Modal */}
      <RepoPreviewModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}

export default ProjectsSection;
