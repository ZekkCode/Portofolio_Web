"use client";

import { useMemo } from "react";
import type { SiteConfig } from "@/lib/site-store";
import { auditContentHealth } from "@/lib/content/content-health";
import { ShieldCheck, AlertCircle, AlertTriangle, Info, X, CheckCircle2 } from "lucide-react";

interface ModalHealthProps {
  isOpen: boolean;
  onClose: () => void;
  config: Partial<SiteConfig>;
}

export function ModalHealth({ isOpen, onClose, config }: ModalHealthProps) {
  const report = useMemo(() => auditContentHealth(config), [config]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-line bg-white shadow-2xl dark:border-line/60 dark:bg-[#0c0e17]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-5 dark:border-line/40">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-9 items-center justify-center rounded-xl ${
                report.canPublish
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600"
              }`}
            >
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">Audit Integritas & Kesehatan Konten</h2>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                    report.score >= 90
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : report.score >= 70
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-rose-500/10 text-rose-600"
                  }`}
                >
                  Skor: {report.score}/100
                </span>
              </div>
              <p className="text-xs text-muted">
                {report.canPublish
                  ? "Semua data valid. Konten aman untuk dipublikasikan."
                  : "Terdapat kesalahan kritis yang wajib diperbaiki sebelum publikasi."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted hover:bg-surface hover:text-ink dark:hover:bg-slate-800"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 border-b border-line/60 bg-surface/30 p-4 text-center dark:border-line/30 dark:bg-slate-900/30">
          <div className="rounded-xl bg-white/70 p-2 dark:bg-slate-900/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600">Kesalahan Kritis</span>
            <span className="font-mono text-base font-extrabold text-ink">{report.errorsCount}</span>
          </div>
          <div className="rounded-xl bg-white/70 p-2 dark:bg-slate-900/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">Peringatan</span>
            <span className="font-mono text-base font-extrabold text-ink">{report.warningsCount}</span>
          </div>
          <div className="rounded-xl bg-white/70 p-2 dark:bg-slate-900/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600">Saran Optimasi</span>
            <span className="font-mono text-base font-extrabold text-ink">{report.infosCount}</span>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {report.issues.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-ink">Konten 100% Sempurna</p>
              <p className="mt-1">Tidak ditemukan kesalahan skema, URL berbahaya, atau data rusak.</p>
            </div>
          ) : (
            report.issues.map((issue) => (
              <div
                key={issue.id}
                className={`rounded-2xl border p-4 text-xs transition ${
                  issue.severity === "error"
                    ? "border-rose-500/30 bg-rose-500/5 text-rose-900 dark:text-rose-300"
                    : issue.severity === "warning"
                    ? "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-300"
                    : "border-blue-500/30 bg-blue-500/5 text-blue-900 dark:text-blue-300"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {issue.severity === "error" && <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />}
                  {issue.severity === "warning" && <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />}
                  {issue.severity === "info" && <Info className="size-4 shrink-0 text-blue-600 mt-0.5" />}

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-black/5 px-1.5 py-0.5 font-bold uppercase tracking-wider text-[9px] dark:bg-white/10">
                        {issue.section}
                      </span>
                      <span className="font-semibold">{issue.message}</span>
                    </div>

                    {issue.suggestion && (
                      <p className="text-[11px] opacity-80">
                        <span className="font-semibold">Saran:</span> {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line p-4 text-xs dark:border-line/40">
          <span className="text-muted">
            {report.canPublish
              ? "✓ Siap dipublikasikan ke situs produksi."
              : "✕ Perbaiki seluruh kesalahan merah sebelum mempublikasikan."}
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
