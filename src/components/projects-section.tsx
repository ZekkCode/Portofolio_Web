"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, type Project } from "@/lib/site-store";
import { RepoPreviewModal } from "@/components/repo-preview-modal";
import { ArrowRight, ArrowUpRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  indexNum: string;
  onPreview: (project: Project) => void;
}

function ProjectTiltedCard({ project, indexNum, onPreview }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only apply subtle tilt on precise pointing devices (mouse), never touch/mobile
    if (e.pointerType !== "mouse") return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized coordinates from center: -0.5 to 0.5
    const nx = x / rect.width - 0.5;
    const ny = y / rect.height - 0.5;

    // 3 to 4 degrees maximum tilt
    const maxTilt = 4;
    const rotateX = -ny * maxTilt;
    const rotateY = nx * maxTilt;

    card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    card.style.transition = "transform 100ms ease-out";

    // Screenshot thumbnail has slightly distinct depth
    if (mediaRef.current) {
      mediaRef.current.style.transform = "translateZ(8px)";
      mediaRef.current.style.transition = "transform 100ms ease-out";
    }
  };

  const handlePointerLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    // Gentle spring return to neutral
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    card.style.transition = "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1)";

    if (mediaRef.current) {
      mediaRef.current.style.transform = "translateZ(0px)";
      mediaRef.current.style.transition = "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    }
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs transition-shadow duration-300 hover:border-brand/50 hover:shadow-md dark:border-line/60 dark:bg-[#111422] will-change-transform"
      style={{ transformStyle: "preserve-3d" }}
    >
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

        {/* Screenshot Thumbnail (Slight depth, distinct target) */}
        {project.image && (
          <div ref={mediaRef} className="mt-3.5 will-change-transform">
            <button
              type="button"
              onClick={() => onPreview(project)}
              className="group/preview relative block w-full overflow-hidden rounded-xl border border-line/70 text-start transition hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
          </div>
        )}

        {/* Title & Description */}
        <div className="mt-3.5">
          <button
            type="button"
            onClick={() => onPreview(project)}
            className="text-left font-display text-lg font-bold tracking-tight text-ink hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            {project.title}
          </button>
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
            onClick={() => onPreview(project)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line/80 bg-transparent px-4 py-2 text-xs sm:text-sm font-semibold text-body transition-all duration-150 hover:bg-brand/5 hover:border-brand/40 hover:text-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/60 dark:text-slate-300 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
          >
            <span>{t("projects.previewBtn")}</span>
            <ArrowUpRight className="size-3.5" />
          </button>

          {project.repo ? (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand transition-colors duration-150 hover:text-brand-ink hover:underline active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>{t("projects.viewRepo")}</span>
              <ArrowRight className="size-3.5" />
            </a>
          ) : (
            <span className="text-xs text-muted">{t("repoModal.internal")}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectsSection() {
  const { t } = useTranslation();
  const { projects } = useSiteConfig();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section id="proyek" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="projects" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div id="portofolio" className="absolute top-0 -mt-24" aria-hidden="true" />
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
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 bg-white/50 px-6 py-14 text-center shadow-2xs dark:border-line/40 dark:bg-[#111422]/50"
          >
            <div className="flex size-14 items-center justify-center rounded-xl border border-line/60 bg-surface text-muted shadow-2xs dark:border-line/40 dark:bg-[#151928]">
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
                href="https://github.com/ZekkCode"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] h-11 items-center gap-2 rounded-xl border border-line/80 bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-150 hover:bg-brand/5 hover:border-brand/40 hover:text-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/60 dark:text-slate-200 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
              >
                <span>Lihat Repositori di GitHub</span>
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
        </Parallax>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, idx) => {
            const indexNum = String(idx + 1).padStart(2, "0");

            return (
              <ProjectTiltedCard
                key={project.id}
                project={project}
                indexNum={indexNum}
                onPreview={setSelectedProject}
              />
            );
          })}
        </div>
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
