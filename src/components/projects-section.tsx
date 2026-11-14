"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, type Project, type TechStackItem } from "@/lib/site-store";
import {
  getPublishedProjectCategories,
  getPublishedProjects,
  getPublishedSectionMeta,
  getPublishedProfile,
} from "@/lib/content/selectors";
import { usePrefetchOnIntent } from "@/hooks/use-prefetch-on-intent";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";

const RepoPreviewModal = dynamic(
  () => import("@/components/repo-preview-modal").then((m) => m.RepoPreviewModal),
  { ssr: false }
);

interface ProjectCardProps {
  project: Project;
  categoryLabel: string;
  techItems: TechStackItem[];
  onPreview: (project: Project) => void;
  isEn: boolean;
}

function ProjectTiltedCard({
  project,
  categoryLabel,
  techItems,
  onPreview,
  isEn,
}: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const { t } = useTranslation();
  const { prefetch: prefetchModal } = usePrefetchOnIntent(
    () => import("@/components/repo-preview-modal"),
    { key: "repo-preview-modal" }
  );

  const handlePointerEnter = () => {
    prefetchModal();
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const card = cardRef.current;
    if (!card) return;

    const rect = rectRef.current ?? card.getBoundingClientRect();
    rectRef.current = rect;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nx = x / rect.width - 0.5;
    const ny = y / rect.height - 0.5;

    const maxTilt = 4;
    const rotateX = -ny * maxTilt;
    const rotateY = nx * maxTilt;

    card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    card.style.transition = "transform 100ms ease-out";

    if (mediaRef.current) {
      mediaRef.current.style.transform = "translateZ(8px)";
      mediaRef.current.style.transition = "transform 100ms ease-out";
    }
  };

  const handlePointerLeave = () => {
    rectRef.current = null;
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    card.style.transition = "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1)";

    if (mediaRef.current) {
      mediaRef.current.style.transform = "translateZ(0px)";
      mediaRef.current.style.transition = "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    }
  };

  const focusText = isEn && project.problemEn ? project.problemEn : (project.highlight || project.problem);
  const summaryText = project.summary || project.desc;

  // Combine resolved TechStack names with free-text tags cleanly
  const displayTags = useMemo(() => {
    const names = new Set<string>();
    for (const item of techItems) {
      if (item.name) names.add(item.name);
    }
    for (const tag of project.tags || []) {
      if (tag) names.add(tag);
    }
    return Array.from(names);
  }, [techItems, project.tags]);

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onFocus={prefetchModal}
      className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white p-5 sm:p-6 transition-colors duration-200 hover:border-brand/40 dark:border-line/60 dark:bg-[#111422]"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div>
        {/* Top Metadata */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-line/50 dark:border-line/30">
          <div className="flex items-center gap-2 min-w-0">
            {categoryLabel && (
              <span className="whitespace-nowrap shrink-0 text-[11px] font-semibold tracking-wide text-brand dark:text-blue-400">
                {categoryLabel}
              </span>
            )}
            {project.featured && (
              <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                {isEn ? "Featured" : "Unggulan"}
              </span>
            )}
          </div>
          {(project.role || project.period || project.status) && (
            <span className="text-[11px] font-medium text-muted truncate text-right">
              {project.role || project.period || project.status}
            </span>
          )}
        </div>

        {/* Screenshot Thumbnail */}
        {project.image && (
          <div ref={mediaRef} className="mt-3.5">
            <button
              type="button"
              onClick={() => onPreview(project)}
              className="group/preview relative block w-full overflow-hidden rounded-xl border border-line/70 text-start transition hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={`${t("projects.previewBtn")}: ${project.title}`}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.imageAlt || project.title}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-300 group-hover/preview:scale-105"
                />
              </div>
            </button>
          </div>
        )}

        {/* Title & Description */}
        <div className="mt-3.5">
          <div className="flex items-center gap-2.5">
            {project.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.logo}
                alt={`Logo ${project.title}`}
                loading="lazy"
                decoding="async"
                className="size-7 shrink-0 rounded-lg border border-line/60 bg-white object-contain p-0.5 dark:border-line/40 dark:bg-slate-900"
              />
            )}
            <button
              type="button"
              onClick={() => onPreview(project)}
              className="text-left font-display text-lg font-bold tracking-tight text-ink hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              {project.title}
            </button>
          </div>
          {summaryText && (
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-body line-clamp-3">
              {summaryText}
            </p>
          )}
        </div>

        {/* Solution Focus Note */}
        {focusText && (
          <p className="mt-3.5 border-l-2 border-brand/35 pl-3 text-xs leading-relaxed text-body line-clamp-2 dark:border-blue-400/35">
            <strong className="font-semibold text-ink">{t("projects.focus", "Fokus:")} </strong>
            {focusText}
          </p>
        )}
      </div>

      {/* Footer with Tags and Action Buttons */}
      <div className="mt-5 border-t border-line/50 pt-3.5 dark:border-line/30">
        {displayTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 text-[11px] font-mono text-muted">
            {displayTags.map((tag, idx) => (
              <span key={tag} className="inline-flex items-center gap-2">
                {idx > 0 && <span className="text-muted/40" aria-hidden="true">·</span>}
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onPreview(project)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line/80 bg-transparent px-4 py-2 text-xs sm:text-sm font-semibold text-body transition-colors duration-150 hover:bg-brand/5 hover:border-brand/40 hover:text-brand active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/60 dark:text-slate-300 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
          >
            <span>{t("projects.previewBtn")}</span>
            <ArrowUpRight className="size-3.5" />
          </button>

          <div className="flex items-center gap-3">
            {project.caseStudyUrl && (
              <a
                href={project.caseStudyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-muted hover:text-brand transition-colors"
              >
                <BookOpen className="size-3.5" />
                <span>{isEn ? "Case Study" : "Studi Kasus"}</span>
              </a>
            )}
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand transition-colors duration-150 hover:text-brand-ink hover:underline active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>{t("projects.viewRepo")}</span>
                <ArrowRight className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectsSection() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const isEn = locale === "en";

  const config = useSiteConfig();
  const sectionMeta = getPublishedSectionMeta(config, "projects", locale);
  const categories = useMemo(
    () => getPublishedProjectCategories(config, locale),
    [config, locale]
  );
  const pubProfile = getPublishedProfile(config, locale);

  const [filter, setFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const allPublishedProjects = useMemo(
    () => getPublishedProjects(config, { locale }),
    [config, locale]
  );

  const filteredProjects = useMemo(
    () => getPublishedProjects(config, { category: filter, locale }),
    [config, filter, locale]
  );

  const categoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) {
      map[c.key] = c.label;
    }
    return map;
  }, [categories]);

  const techById = useMemo(() => {
    const map: Record<string, TechStackItem> = {};
    for (const item of config.techStack || []) {
      map[item.id] = item;
    }
    return map;
  }, [config.techStack]);

  // Support deep link to project modal via #project-<slug> or ?project=<slug>
  useEffect(() => {
    if (typeof window === "undefined" || allPublishedProjects.length === 0) return;
    const inspectUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const querySlug = params.get("project");
      const hash = window.location.hash.replace(/^#/, "");
      const hashSlug = hash.startsWith("project-") ? hash.slice("project-".length) : "";
      const targetSlug = querySlug || hashSlug;
      if (!targetSlug) return;
      const found = allPublishedProjects.find((p) => p.slug === targetSlug || p.id === targetSlug);
      if (found) setSelectedProject(found);
    };
    inspectUrl();
    window.addEventListener("hashchange", inspectUrl);
    return () => window.removeEventListener("hashchange", inspectUrl);
  }, [allPublishedProjects]);

  const activeFilterValid = categories.some((c) => c.key === filter);
  const effectiveFilter = activeFilterValid ? filter : "all";

  const githubUrl =
    pubProfile.socials.find((s) => s.platform.toLowerCase() === "github")?.href ||
    `https://github.com/${pubProfile.githubUsername || "ZekkCode"}`;

  return (
    <section id="proyek" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="projects" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div id="portofolio" className="absolute top-0 -mt-24" aria-hidden="true" />

      <ScrollReveal y={24}>
        <div className="relative z-[2]">
          <SectionTitle
            eyebrow={sectionMeta.eyebrow || undefined}
            title={sectionMeta.title || t("projects.title")}
            desc={sectionMeta.desc || t("projects.desc")}
          />
        </div>
      </ScrollReveal>

      {/* Dynamic Category Filter Tabs */}
      {allPublishedProjects.length > 0 && categories.length > 1 && (
        <div
          role="tablist"
          aria-label={sectionMeta.title || t("projects.title", "Proyek")}
          className="relative z-[2] mb-8 flex flex-wrap items-center justify-center gap-2"
        >
          {categories.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={effectiveFilter === tab.key}
              onClick={() => setFilter(tab.key)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none ${
                effectiveFilter === tab.key
                  ? "bg-brand text-white border border-brand/30"
                  : "border border-line/80 bg-transparent text-body hover:bg-brand/5 hover:border-brand/40 hover:text-brand dark:border-line/60 dark:text-slate-300 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <Parallax speed={0.06}>
          <div
            id="proyek-empty"
            className="relative z-[2] flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 bg-white/50 px-6 py-14 text-center dark:border-line/40 dark:bg-[#111422]/50"
          >
            <svg
              className="size-8 text-muted"
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
            <h3 className="mt-4 font-display text-lg font-bold text-ink">
              {t("projects.emptyTitle", "Belum Ada Proyek yang Ditampilkan")}
            </h3>
            <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-body">
              {t(
                "projects.emptyDesc",
                "Koleksi proyek sedang dikurasi atau belum dipublikasikan ke tampilan publik."
              )}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] h-11 items-center gap-2 rounded-xl border border-line/80 bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-brand/5 hover:border-brand/40 hover:text-brand active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/60 dark:text-slate-200 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
              >
                <span>{isEn ? "View Repositories on GitHub" : "Lihat Repositori di GitHub"}</span>
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
        </Parallax>
      ) : (
        <Parallax speed={0.055}>
          <div
            className={`relative z-[2] grid gap-5 ${
              filteredProjects.length === 1
                ? "max-w-xl mx-auto"
                : filteredProjects.length === 2 || filteredProjects.length === 4
                ? "sm:grid-cols-2"
                : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredProjects.map((project) => {
              const catLabel =
                (project.category === "both"
                  ? "IT & Design"
                  : categoryLabelMap[project.category || ""]) ||
                (project.category ? project.category.toUpperCase() : "");
              const linkedTech = (project.techIds || [])
                .map((id) => techById[id])
                .filter((item): item is TechStackItem => Boolean(item));
              return (
                <ProjectTiltedCard
                  key={project.id}
                  project={project}
                  categoryLabel={catLabel}
                  techItems={linkedTech}
                  onPreview={setSelectedProject}
                  isEn={isEn}
                />
              );
            })}
          </div>
        </Parallax>
      )}

      {/* Repository Full Preview Modal (lazy-loaded on demand) */}
      {selectedProject && (
        <RepoPreviewModal
          project={selectedProject}
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
}

export default ProjectsSection;
