"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/site-store";

interface RepoPreviewModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RepoPreviewModal({ project, isOpen, onClose }: RepoPreviewModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

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
    if (!project?.repo) return;
    navigator.clipboard.writeText(project.repo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen || !project) return null;

  // Extract repository path / slug
  const repoSlug = project.repo
    ? project.repo.replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    : `ZekkCode/${project.title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${t("repoModal.dialogLabel")} ${project.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
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
          <div className="flex items-center gap-2.5">
            <svg className="size-4.5 text-ink shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="font-mono text-xs font-semibold text-ink truncate max-w-[240px] sm:max-w-md">
              {repoSlug}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] size-11 items-center justify-center rounded-xl text-muted transition-all duration-150 hover:bg-brand/5 hover:text-brand active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-brand/10"
            aria-label={t("repoModal.closeAria")}
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
            {project.role && (
              <span className="inline-block text-xs font-semibold text-brand dark:text-blue-400 mb-1">
                {project.role}
              </span>
            )}
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
              {project.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              {project.desc}
            </p>
          </div>

          {/* Screenshot (Only if real image is provided) */}
          {project.image && (
            <div className="overflow-hidden rounded-xl border border-line/70 dark:border-line/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.image}
                alt={project.title}
                className="w-full object-cover max-h-[300px]"
              />
            </div>
          )}

          {/* Structured Case Study Highlights */}
          <div className="space-y-3 rounded-xl border border-line/60 bg-surface/60 p-4 text-xs dark:border-line/40 dark:bg-slate-900/40">
            {project.problem && (
              <div>
                <strong className="block text-ink font-semibold mb-0.5">{t("repoModal.challenge")}</strong>
                <p className="text-body leading-relaxed">{project.problem}</p>
              </div>
            )}

            {project.highlight && (
              <div className={project.problem ? "border-t border-line/40 pt-2.5" : ""}>
                <strong className="block text-ink font-semibold mb-0.5">{t("repoModal.solution")}</strong>
                <p className="text-body leading-relaxed">{project.highlight}</p>
              </div>
            )}

            {project.outcome && (
              <div className="border-t border-line/40 pt-2.5">
                <strong className="block text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                  {t("repoModal.outcome")}
                </strong>
                <p className="text-body leading-relaxed">{project.outcome}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.tags.map((tag) => (
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
            disabled={!project.repo}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-brand hover:bg-brand/5 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-brand/10"
          >
            {copied ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t("repoModal.copied")}</span>
            ) : (
              <span>{t("repoModal.copyUrl")}</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            {project.previewUrl && (
              <a
                href={project.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] h-11 items-center gap-1.5 rounded-xl border border-line/80 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-semibold text-ink transition-all duration-150 hover:border-brand/40 hover:bg-brand/5 hover:text-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:border-line/60 dark:text-slate-200 dark:hover:bg-brand/10"
              >
                <span>{t("repoModal.liveDemo")}</span>
                <ArrowUpRight className="size-3.5" />
              </a>
            )}

            {project.repo ? (
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] h-11 items-center gap-1.5 rounded-xl border border-brand-light/30 bg-brand px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <span>{t("repoModal.openGithub")}</span>
                <ArrowRight className="size-3.5" />
              </a>
            ) : (
              <span className="text-xs text-muted">{t("repoModal.internal")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RepoPreviewModal;
