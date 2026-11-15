"use client";

import { useMemo, useState } from "react";
import type { SiteConfig } from "@/lib/site-store";
import type { ContentHealthIssue, ContentHealthReport } from "@/lib/content/types";
import {
  auditContentHealth,
  getContentReadinessSummary,
} from "@/lib/content/content-health";
import {
  getHealthToneClasses,
  resolveIssueNavigationTarget,
} from "../admin-navigation";
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface ModalHealthProps {
  isOpen: boolean;
  onClose: () => void;
  config: Partial<SiteConfig>;
  report?: ContentHealthReport;
  onNavigateToIssue?: (issue: ContentHealthIssue) => void;
}

type SeverityFilter = "all" | "error" | "warning" | "info";

export function ModalHealth({
  isOpen,
  onClose,
  config,
  report: passedReport,
  onNavigateToIssue,
}: ModalHealthProps) {
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const computedReport = useMemo(
    () => passedReport ?? auditContentHealth(config),
    [passedReport, config]
  );

  if (!isOpen) return null;

  const report = computedReport;
  const readiness = getContentReadinessSummary(report);
  const toneClasses = getHealthToneClasses(readiness.tone);
  const filteredIssues =
    filter === "all"
      ? report.issues
      : report.issues.filter((i) => i.severity === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-line bg-white shadow-2xl dark:border-line/60 dark:bg-[#0c0e17]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-5 dark:border-line/40">
          <div className="flex items-start gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${toneClasses.iconBox}`}
            >
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-ink">Audit Integritas & Kesehatan Konten</h2>
                <span
                  data-testid="health-readiness-badge"
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${toneClasses.pill}`}
                >
                  {readiness.badgeLabel}
                </span>
                <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[10px] font-bold text-ink dark:bg-slate-800">
                  Skor: {report.score}/100
                </span>
              </div>
              <p data-testid="health-readiness-headline" className="mt-1 text-xs text-muted">
                {readiness.headline}
              </p>
              <p className="mt-0.5 text-[11px] text-muted/80">
                Skor adalah indikator kelengkapan konten, bukan penentu publish; publikasi hanya diblokir oleh temuan Blocker. Pemeriksaan URL memvalidasi skema dan format, bukan menjangkau tautan HTTP eksternal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal kesehatan"
            className="rounded-xl p-2 text-muted hover:bg-surface hover:text-ink dark:hover:bg-slate-800"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Status Metrics Bar (clickable severity filter) */}
        <div className="grid grid-cols-4 gap-2 border-b border-line/60 bg-surface/30 p-3.5 text-center dark:border-line/30 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl p-2 transition ${
              filter === "all"
                ? "bg-white ring-1 ring-brand shadow-xs dark:bg-slate-900"
                : "bg-white/70 hover:bg-white dark:bg-slate-900/60"
            }`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
              Semua Temuan
            </span>
            <span className="font-mono text-base font-extrabold text-ink">
              {report.issues.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("error")}
            className={`rounded-xl p-2 transition ${
              filter === "error"
                ? "bg-white ring-1 ring-rose-500 shadow-xs dark:bg-slate-900"
                : "bg-white/70 hover:bg-white dark:bg-slate-900/60"
            }`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Blocker Publish
            </span>
            <span className="font-mono text-base font-extrabold text-ink">
              {report.errorsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("warning")}
            className={`rounded-xl p-2 transition ${
              filter === "warning"
                ? "bg-white ring-1 ring-amber-500 shadow-xs dark:bg-slate-900"
                : "bg-white/70 hover:bg-white dark:bg-slate-900/60"
            }`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Peringatan
            </span>
            <span className="font-mono text-base font-extrabold text-ink">
              {report.warningsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("info")}
            className={`rounded-xl p-2 transition ${
              filter === "info"
                ? "bg-white ring-1 ring-blue-500 shadow-xs dark:bg-slate-900"
                : "bg-white/70 hover:bg-white dark:bg-slate-900/60"
            }`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Saran Opsional
            </span>
            <span className="font-mono text-base font-extrabold text-ink">
              {report.infosCount}
            </span>
          </button>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted">
              <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-ink">
                {report.issues.length === 0
                  ? "Tidak Ada Temuan"
                  : "Tidak ada temuan pada filter ini"}
              </p>
              <p className="mt-1">
                {report.issues.length === 0
                  ? "Seluruh pemeriksaan struktur skema, keamanan protokol URL, dan kelengkapan konten lolos."
                  : "Pilih kategori temuan lain di atas untuk melihat sisa catatan."}
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const navTarget = onNavigateToIssue
                ? resolveIssueNavigationTarget(issue)
                : null;
              const severityLabel =
                issue.severity === "error"
                  ? "Blocker Publish"
                  : issue.severity === "warning"
                  ? "Peringatan"
                  : "Saran Opsional";

              return (
                <div
                  key={issue.id}
                  data-health-issue-id={issue.id}
                  className={`rounded-2xl border p-4 text-xs transition ${
                    issue.severity === "error"
                      ? "border-rose-500/30 bg-rose-500/5 text-rose-900 dark:text-rose-300"
                      : issue.severity === "warning"
                      ? "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-300"
                      : "border-blue-500/30 bg-blue-500/5 text-blue-900 dark:text-blue-300"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {issue.severity === "error" && (
                      <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    {issue.severity === "warning" && (
                      <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                    )}
                    {issue.severity === "info" && (
                      <Info className="size-4 shrink-0 text-blue-600 mt-0.5" />
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-black/5 px-1.5 py-0.5 font-bold uppercase tracking-wider text-[9px] dark:bg-white/10">
                          {issue.section}
                        </span>
                        <span className="rounded bg-black/5 px-1.5 py-0.5 font-semibold text-[9px] dark:bg-white/10">
                          {severityLabel}
                        </span>
                        {issue.field && (
                          <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] opacity-80 dark:bg-white/10">
                            {issue.field}
                          </code>
                        )}
                      </div>

                      <p className="font-semibold leading-relaxed">{issue.message}</p>

                      {issue.suggestion && (
                        <p className="text-[11px] opacity-80">
                          <span className="font-semibold">Saran:</span> {issue.suggestion}
                        </p>
                      )}
                    </div>

                    {navTarget && onNavigateToIssue && (
                      <button
                        type="button"
                        onClick={() => onNavigateToIssue(issue)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-current/20 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold transition hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900"
                        title={`Buka ${issue.section} di editor`}
                      >
                        <span>Buka Editor</span>
                        <ArrowRight className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-4 text-xs dark:border-line/40">
          <span data-testid="health-readiness-footer" className="text-muted">
            {readiness.footerMessage}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand px-4 py-1.5 font-semibold text-white hover:bg-brand/90 transition"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
