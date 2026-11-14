"use client";

import { useEffect, useState } from "react";
import type { RevisionsIndexItem } from "@/lib/content/types";
import type { SiteConfig } from "@/lib/site-store";
import { History, RotateCcw, X, Clock, User, AlertTriangle, Layers } from "lucide-react";

interface ModalRevisionsProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (restoredConfig: SiteConfig) => void;
}

export function ModalRevisions({ isOpen, onClose, onRestore }: ModalRevisionsProps) {
  const [revisions, setRevisions] = useState<RevisionsIndexItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/admin/revisions")
      .then((res) => (res.ok ? res.json() : Promise.reject("Gagal memuat revisi")))
      .then((data) => {
        if (!cancelled) {
          setRevisions(data.revisions || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(typeof err === "string" ? err : "Koneksi terputus");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRollback = async (revItem: RevisionsIndexItem) => {
    if (
      !window.confirm(
        `Pulihkan konfigurasi situs ke Versi #${revItem.version} (${new Date(revItem.timestamp).toLocaleString("id-ID")})?\n\nTindakan ini akan membuat versi baru yang menyalin konfigurasi tersebut.`
      )
    ) {
      return;
    }

    setRestoringId(revItem.revisionId);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", revisionId: revItem.revisionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal memulihkan revisi");
        return;
      }

      onRestore(data.config);
      onClose();
    } catch {
      setErrorMsg("Gagal menghubungi server untuk rollback");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-line bg-white shadow-2xl dark:border-line/60 dark:bg-[#0c0e17]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-5 dark:border-line/40">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <History className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Riwayat Versi & Rollback</h2>
              <p className="text-xs text-muted">Daftar publikasi sebelumnya yang dapat dipulihkan kapan saja.</p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-muted">
              <span className="inline-block size-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin mb-2" />
              <p>Memuat rekaman versi...</p>
            </div>
          ) : revisions.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              <Clock className="size-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-ink">Belum Ada Riwayat Revisi Tersimpan</p>
              <p className="mt-1">Riwayat akan otomatis tercatat saat Anda mempublikasikan konten pertama kali.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revisions.map((rev, idx) => (
                <div
                  key={rev.revisionId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-line/70 bg-surface/40 p-4 transition hover:border-brand/40 dark:border-line/40 dark:bg-slate-900/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-brand px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                        v{rev.version}
                      </span>
                      {idx === 0 && (
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Versi Aktif Terpublikasi
                        </span>
                      )}
                      <span className="text-xs font-semibold text-ink">{rev.summary}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(rev.timestamp).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User className="size-3" />
                        {rev.editor}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="size-3" />
                        {rev.changesCount} entri
                      </span>
                    </div>
                  </div>

                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleRollback(rev)}
                      disabled={restoringId === rev.revisionId}
                      className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:border-brand hover:text-brand disabled:opacity-50 dark:border-line/40 dark:bg-slate-800 transition"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>{restoringId === rev.revisionId ? "Memulihkan..." : "Pulihkan ke Versi Ini"}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line p-4 text-xs text-muted dark:border-line/40">
          <span>Maksimal 25 snapshot revisi terakhir disimpan secara aman.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-1.5 font-semibold text-ink hover:bg-surface dark:hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
