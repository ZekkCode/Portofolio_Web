"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ExternalLink, BookOpen, Calendar, Users, Layers } from "lucide-react";
import { useSiteConfig, type Project, type TechStackItem } from "@/lib/site-store";
import { getPublishedProjectCategories } from "@/lib/content/selectors";

interface RepoPreviewModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RepoPreviewModal({ project, isOpen, onClose }: RepoPreviewModalProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const isEn = locale === "en";
  const config = useSiteConfig();

  const [copied, setCopied] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [prevProject, setPrevProject] = useState(project);

  if (project !== prevProject) {
    setPrevProject(project);
    setSelectedIndex(0);
  }

  const galleryEntries = useMemo(() => {
    if (!project) return [] as Array<{ src: string; alt: string }>;
    const entries: Array<{ src: string; alt: string }> = [];
    const baseTitle = isEn && project.titleEn ? project.titleEn : project.title;
    if (project.image) {
      entries.push({ src: project.image, alt: project.imageAlt || baseTitle });
    }
    if (Array.isArray(project.galleryImages)) {
      project.galleryImages.forEach((img, idx) => {
        if (!img) return;
        entries.push({
          src: img,
          alt: project.galleryAlts?.[idx] || `${baseTitle} — ${idx + 2}`,
        });
      });
    }
    return entries;
  }, [project, isEn]);

  const activeEntry = galleryEntries[selectedIndex] || galleryEntries[0] || null;

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleCopyLink = () => {
    const link = project?.previewUrl || project?.caseStudyUrl || project?.repo;
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen || !project) return null;

  // Extract repository path / slug
  const repoSlug = project.repo
    ? project.repo.replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    : `project/${project.slug || project.title.toLowerCase().replace(/\s+/g, "-")}`;

  const title = isEn && project.titleEn ? project.titleEn : project.title;
  const summary = isEn && project.summaryEn ? project.summaryEn : project.summary;
  const desc = isEn && project.descEn ? project.descEn : project.desc;
  const problem = isEn && project.problemEn ? project.problemEn : project.problem;
  const approach = isEn && project.approachEn ? project.approachEn : (project.approach || project.highlight);
  const outcome = isEn && project.outcomeEn ? project.outcomeEn : project.outcome;
  const architecture = isEn && project.architectureEn ? project.architectureEn : project.architecture;

  const categories = getPublishedProjectCategories(config, locale);
  const categoryLabel =
    (project.category === "both"
      ? "IT & Design"
      : categories.find((c) => c.key === project.category)?.label) ||
    (project.category ? project.category.toUpperCase() : "");

  const techMap: Record<string, TechStackItem> = {};
  for (const item of config.techStack || []) {
    techMap[item.id] = item;
  }
  const linkedTech = (project.techIds || [])
    .map((id) => techMap[id])
    .filter((item): item is TechStackItem => Boolean(item));
  const linkedTechNames = new Set(linkedTech.map((tItem) => tItem.name.toLowerCase()));
  const extraTags = (project.tags || []).filter(
    (tag) => tag && !linkedTechNames.has(tag.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${t("repoModal.dialogLabel", "Pratinjau Proyek")} ${title}`}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-xl dark:border-line/60 dark:bg-[#0e111a]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-4 dark:border-line/40">
          <div className="flex items-center gap-2.5 min-w-0">
            {project.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.logo}
                alt={`Logo ${title}`}
                className="size-5 shrink-0 rounded object-contain"
              />
            ) : (
              <svg className="size-4.5 text-ink shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            )}
            <span className="font-mono text-xs font-semibold text-ink truncate max-w-[240px] sm:max-w-md">
              {repoSlug}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] size-11 items-center justify-center rounded-xl text-muted transition-all duration-150 hover:bg-brand/5 hover:text-brand active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-brand/10"
            aria-label={t("repoModal.closeAria", "Tutup modal")}
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Title & Metadata */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {categoryLabel && (
                <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand dark:bg-blue-500/10 dark:text-blue-300">
                  {categoryLabel}
                </span>
              )}
              {project.role && (
                <span className="text-xs font-semibold text-brand dark:text-blue-400">
                  {project.role}
                </span>
              )}
              {project.status && (
                <span className="rounded-full border border-line/70 px-2 py-0.5 text-[10px] font-medium text-muted dark:border-line/40">
                  {project.status}
                </span>
              )}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
              {title}
            </h2>
            {summary && (
              <p className="mt-1.5 text-sm font-medium text-ink/90">
                {summary}
              </p>
            )}
            {desc && (
              <p className="mt-2 text-sm leading-relaxed text-body">
                {desc}
              </p>
            )}

            {(project.period || project.collaborators) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                {project.period && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-brand shrink-0" />
                    <span>{project.period}</span>
                  </span>
                )}
                {project.collaborators && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5 text-brand shrink-0" />
                    <span>{project.collaborators}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Active Image */}
          {activeEntry && (
            <div className="overflow-hidden rounded-xl border border-line/70 dark:border-line/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeEntry.src}
                alt={activeEntry.alt}
                className="w-full object-cover max-h-[340px]"
              />
            </div>
          )}

          {/* Gallery Thumbnails */}
          {galleryEntries.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {galleryEntries.map((entry, idx) => (
                <button
                  key={`${entry.src}-${idx}`}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`size-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    selectedIndex === idx ? "border-brand" : "border-line/60 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.src} alt={entry.alt} className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Structured Case Study Highlights */}
          {(problem || approach || architecture || outcome) && (
            <div className="space-y-3 rounded-xl border border-line/60 bg-surface/60 p-4 text-xs dark:border-line/40 dark:bg-slate-900/40">
              {problem && (
                <div>
                  <strong className="block text-ink font-semibold mb-0.5">{t("repoModal.challenge", "Tantangan:")}</strong>
                  <p className="text-body leading-relaxed">{problem}</p>
                </div>
              )}

              {approach && (
                <div className={problem ? "border-t border-line/40 pt-2.5" : ""}>
                  <strong className="block text-ink font-semibold mb-0.5">{t("repoModal.solution", "Pendekatan & Solusi:")}</strong>
                  <p className="text-body leading-relaxed">{approach}</p>
                </div>
              )}

              {architecture && (
                <div className={problem || approach ? "border-t border-line/40 pt-2.5" : ""}>
                  <strong className="inline-flex items-center gap-1.5 text-ink font-semibold mb-0.5">
                    <Layers className="size-3.5 text-brand" />
                    <span>{isEn ? "Architecture & Decisions:" : "Arsitektur & Keputusan Teknis:"}</span>
                  </strong>
                  <p className="text-body leading-relaxed">{architecture}</p>
                </div>
              )}

              {outcome && (
                <div className={problem || approach || architecture ? "border-t border-line/40 pt-2.5" : ""}>
                  <strong className="block text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                    {t("repoModal.outcome", "Hasil & Dampak:")}
                  </strong>
                  <p className="text-body leading-relaxed">{outcome}</p>
                </div>
              )}
            </div>
          )}

          {/* Linked Tech Stack & Tags */}
          {(linkedTech.length > 0 || extraTags.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {linkedTech.map((tech) => (
                <span
                  key={tech.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-brand/25 bg-brand/5 px-2.5 py-0.5 text-xs font-medium text-ink dark:border-blue-400/25 dark:bg-blue-500/10"
                >
                  {tech.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tech.icon} alt="" className="size-3.5 object-contain" />
                  )}
                  <span>{tech.name}</span>
                </span>
              ))}
              {extraTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-line/60 bg-surface px-2.5 py-0.5 text-xs font-medium text-body dark:border-line/40 dark:bg-slate-900"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 bg-surface/50 px-5 py-3.5 dark:border-line/40 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!project.repo && !project.previewUrl && !project.caseStudyUrl}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-brand hover:bg-brand/5 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-brand/10"
          >
            {copied ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t("repoModal.copied", "Tautan disalin!")}</span>
            ) : (
              <span>{t("repoModal.copyUrl", "Salin Tautan")}</span>
            )}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {project.caseStudyUrl && (
              <a
                href={project.caseStudyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line/80 bg-white px-4 py-2 text-xs font-semibold text-ink transition-all duration-150 hover:border-brand/40 hover:text-brand hover:bg-brand/5 dark:border-line/60 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-brand/10"
              >
                <BookOpen className="size-3.5" />
                <span>{isEn ? "Case Study" : "Studi Kasus"}</span>
              </a>
            )}

            {project.previewUrl && (
              <a
                href={project.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-brand bg-brand px-4 py-2 text-xs font-semibold text-white transition-all duration-150 hover:bg-brand-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span>Live Demo</span>
                <ExternalLink className="size-3.5" />
              </a>
            )}

            {project.repo ? (
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line/80 bg-white px-4 py-2 text-xs font-semibold text-ink transition-all duration-150 hover:border-brand/40 hover:text-brand hover:bg-brand/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/60 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-brand/10"
              >
                <span>{t("projects.viewRepo", "Buka Repositori")}</span>
                <ArrowRight className="size-3.5" />
              </a>
            ) : !project.previewUrl && !project.caseStudyUrl ? (
              <span className="text-xs text-muted">{t("repoModal.internal", "Repositori internal / privat")}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RepoPreviewModal;
