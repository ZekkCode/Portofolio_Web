"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ContentHealthReport,
  ContentReadinessSummary,
  RevisionCompatibilityResult,
  RevisionInspectSummary,
  RevisionsIndexItem,
} from "@/lib/content/types";
import type { SiteConfig } from "@/lib/site-store";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCode2,
  History,
  Layers,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

export type RevisionRestoreTarget = "draft" | "publish";

interface ModalRevisionsProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (
    restoredConfig: SiteConfig,
    target: RevisionRestoreTarget,
    meta?: { revisionId: string; updatedAt?: string; version?: number }
  ) => void;
}

interface InspectResponseState {
  revision: RevisionsIndexItem;
  loading: boolean;
  error: string | null;
  compatibility?: RevisionCompatibilityResult;
  health?: ContentHealthReport;
  readiness?: ContentReadinessSummary;
  inspectSummary?: RevisionInspectSummary;
  snapshot?: SiteConfig;
}

export function ModalRevisions({ isOpen, onClose, onRestore }: ModalRevisionsProps) {
  const [revisions, setRevisions] = useState<RevisionsIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [currentSchemaVersion, setCurrentSchemaVersion] = useState<number>(2);

  const [inspectState, setInspectState] = useState<InspectResponseState | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<RevisionRestoreTarget>("draft");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/revisions", { cache: "no-store" });
      let data: {
        error?: string;
        status?: string;
        provider?: string;
        currentSchemaVersion?: number;
        revisions?: RevisionsIndexItem[];
      } | null = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || data?.status === "error") {
        setRevisions([]);
        setErrorMsg(
          data?.error ||
            `Gagal mengambil riwayat revisi dari server (HTTP ${res.status}).`
        );
        return;
      }

      setProvider(data?.provider || null);
      if (typeof data?.currentSchemaVersion === "number") {
        setCurrentSchemaVersion(data.currentSchemaVersion);
      }
      setRevisions(Array.isArray(data?.revisions) ? data.revisions : []);
    } catch {
      setRevisions([]);
      setErrorMsg("Gagal menghubungi server saat memuat riwayat revisi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setInspectState(null);
    setRestoreTarget("draft");
    setRestoringId(null);
    void fetchHistory();
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  const handleOpenInspect = async (revItem: RevisionsIndexItem) => {
    setErrorMsg(null);
    setRestoreTarget("draft");
    setInspectState({
      revision: revItem,
      loading: true,
      error: null,
    });

    try {
      const res = await fetch(
        `/api/admin/revisions?id=${encodeURIComponent(revItem.revisionId)}&inspect=1`,
        { cache: "no-store" }
      );
      let data: {
        error?: string;
        compatibility?: RevisionCompatibilityResult;
        health?: ContentHealthReport;
        readiness?: ContentReadinessSummary;
        inspectSummary?: RevisionInspectSummary;
        snapshot?: SiteConfig;
      } | null = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.snapshot) {
        setInspectState({
          revision: revItem,
          loading: false,
          error: data?.error || `Gagal memuat snapshot revisi (HTTP ${res.status}).`,
          compatibility: data?.compatibility,
        });
        return;
      }

      setInspectState({
        revision: revItem,
        loading: false,
        error: null,
        compatibility: data.compatibility,
        health: data.health,
        readiness: data.readiness,
        inspectSummary: data.inspectSummary,
        snapshot: data.snapshot,
      });
    } catch {
      setInspectState({
        revision: revItem,
        loading: false,
        error: "Gagal terhubung ke server untuk memeriksa kompatibilitas revisi.",
      });
    }
  };

  const handleConfirmRestore = async () => {
    if (!inspectState) return;
    const revItem = inspectState.revision;

    setRestoringId(revItem.revisionId);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rollback",
          revisionId: revItem.revisionId,
          target: restoreTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal memulihkan revisi");
        return;
      }

      onRestore(data.config, restoreTarget, {
        revisionId: data.revisionId || revItem.revisionId,
        updatedAt: data.updatedAt,
        version: data.version,
      });
      onClose();
    } catch {
      setErrorMsg("Gagal menghubungi server untuk proses pemulihan.");
    } finally {
      setRestoringId(null);
    }
  };

  const compatibilityOk = Boolean(inspectState?.compatibility?.compatible);
  const canPublishTarget =
    compatibilityOk && (inspectState?.health ? inspectState.health.canPublish : true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-revisions-title"
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl border border-line bg-white shadow-2xl dark:border-line/60 dark:bg-[#0c0e17]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-5 dark:border-line/40">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <History className="size-5" />
            </div>
            <div>
              <h2 id="modal-revisions-title" className="text-base font-bold text-ink">
                Riwayat Versi & Pemulihan
              </h2>
              <p className="text-xs text-muted">
                Snapshot publikasi tersimpan (skema v{currentSchemaVersion}
                {provider ? ` • ${provider}` : ""}).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!inspectState && (
              <button
                type="button"
                onClick={() => void fetchHistory()}
                disabled={loading}
                title="Muat ulang daftar revisi"
                className="rounded-xl p-2 text-muted hover:bg-surface hover:text-ink disabled:opacity-40 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog riwayat revisi"
              className="rounded-xl p-2 text-muted hover:bg-surface hover:text-ink dark:hover:bg-slate-800"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div
              data-revisions-state="error"
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Gagal Memproses Riwayat Revisi</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
              {!inspectState && (
                <button
                  type="button"
                  onClick={() => void fetchHistory()}
                  className="shrink-0 self-start sm:self-center rounded-xl border border-rose-500/30 bg-white/80 px-3 py-1.5 font-semibold text-rose-700 hover:bg-white dark:bg-slate-900/80 dark:text-rose-300"
                >
                  Coba Lagi
                </button>
              )}
            </div>
          )}

          {inspectState ? (
            <div data-revisions-panel="inspect" className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setInspectState(null);
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Kembali ke Daftar Revisi</span>
                </button>
                <span className="font-mono text-[11px] text-muted">
                  ID: {inspectState.revision.revisionId}
                </span>
              </div>

              <div className="rounded-2xl border border-line/70 bg-surface/50 p-4 space-y-2 dark:border-line/40 dark:bg-slate-900/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-brand px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                    v{inspectState.revision.version}
                  </span>
                  <span className="text-xs font-semibold text-ink">
                    {inspectState.revision.summary}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(inspectState.revision.timestamp).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3" />
                    {inspectState.revision.editor}
                  </span>
                </div>
              </div>

              {inspectState.loading ? (
                <div className="py-10 text-center text-xs text-muted">
                  <span className="inline-block size-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin mb-2" />
                  <p>Memeriksa kompatibilitas skema & isi snapshot...</p>
                </div>
              ) : inspectState.error ? (
                <div
                  data-revisions-state="inspect-error"
                  className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-300 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Snapshot Tidak Dapat Dipulihkan</p>
                      <p className="mt-0.5">{inspectState.error}</p>
                    </div>
                  </div>
                  {inspectState.compatibility?.errors &&
                    inspectState.compatibility.errors.length > 0 && (
                      <ul className="list-disc pl-6 space-y-0.5 text-[11px]">
                        {inspectState.compatibility.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                </div>
              ) : (
                <>
                  {/* Kompatibilitas & Kesehatan Snapshot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl border border-line/70 p-3.5 space-y-1.5 dark:border-line/40">
                      <div className="flex items-center gap-1.5 font-semibold text-ink">
                        <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Kompatibilitas Skema</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Kompatibel dengan skema aktif (v
                        {inspectState.compatibility?.targetSchemaVersion ?? currentSchemaVersion})
                      </p>
                      {inspectState.compatibility?.legacyMigrated && (
                        <p className="text-[11px] text-muted">
                          Format lama (
                          {inspectState.compatibility.rawSchemaVersion !== null
                            ? `v${inspectState.compatibility.rawSchemaVersion}`
                            : "tanpa schemaVersion"}
                          ) dimigrasi ke v{inspectState.compatibility.targetSchemaVersion}.
                        </p>
                      )}
                    </div>

                    {inspectState.health && (
                      <div className="rounded-2xl border border-line/70 p-3.5 space-y-1.5 dark:border-line/40">
                        <div className="flex items-center justify-between font-semibold text-ink">
                          <span>Kesiapan Konten</span>
                          <span className="font-mono text-[11px] text-brand">
                            {inspectState.health.score}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">
                          {inspectState.readiness?.headline ||
                            (inspectState.health.canPublish
                              ? "Siap dipublikasikan"
                              : "Memiliki blocker publikasi")}
                        </p>
                        {!inspectState.health.canPublish && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400">
                            Publikasi langsung ditahan karena blocker konten; muat ke Draf untuk
                            memperbaikinya lebih dulu.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ringkasan Snapshot & Diff vs Produksi Aktif */}
                  {inspectState.inspectSummary && (
                    <div className="rounded-2xl border border-line/70 p-4 space-y-2.5 text-xs dark:border-line/40">
                      <p className="font-semibold text-ink">Ringkasan Isi Snapshot</p>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-lg bg-surface px-2.5 py-1 text-ink dark:bg-slate-800">
                          {inspectState.inspectSummary.projectsCount} proyek (
                          {inspectState.inspectSummary.publishedProjectsCount} terbit)
                        </span>
                        <span className="rounded-lg bg-surface px-2.5 py-1 text-ink dark:bg-slate-800">
                          {inspectState.inspectSummary.certificatesCount} sertifikasi
                        </span>
                        <span className="rounded-lg bg-surface px-2.5 py-1 text-ink dark:bg-slate-800">
                          {inspectState.inspectSummary.experienceCount} pengalaman
                        </span>
                        <span className="rounded-lg bg-surface px-2.5 py-1 text-ink dark:bg-slate-800">
                          {inspectState.inspectSummary.educationCount} pendidikan
                        </span>
                        <span className="rounded-lg bg-surface px-2.5 py-1 text-ink dark:bg-slate-800">
                          {inspectState.inspectSummary.manualBlogCount} artikel manual
                        </span>
                      </div>

                      <div className="pt-1 border-t border-line/50 text-[11px]">
                        {inspectState.inspectSummary.matchesActiveConfig ? (
                          <p className="text-muted">
                            Isi snapshot ini sama dengan konfigurasi produksi yang sedang aktif.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            <p className="font-medium text-ink">
                              Bagian yang berbeda dari produksi aktif:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {inspectState.inspectSummary.changedSectionsFromActive.map((sec) => (
                                <span
                                  key={sec}
                                  className="rounded-md bg-brand/10 px-2 py-0.5 font-medium text-brand"
                                >
                                  {sec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pemilihan Target Pemulihan */}
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-ink">Target Pemulihan</p>

                    <label
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${
                        restoreTarget === "draft"
                          ? "border-brand bg-brand/5"
                          : "border-line/70 hover:border-brand/40 dark:border-line/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="restore-target"
                        value="draft"
                        checked={restoreTarget === "draft"}
                        onChange={() => setRestoreTarget("draft")}
                        className="mt-0.5 accent-brand"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-semibold text-ink">
                          <span>Muat ke Draf Editor & Server</span>
                          <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Aman (Default)
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">
                          Tidak langsung menimpa situs produksi. Anda dapat memeriksa hasilnya di
                          editor dan pratinjau draf sebelum mempublikasikan.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 transition ${
                        !canPublishTarget
                          ? "opacity-50 cursor-not-allowed border-line/50"
                          : restoreTarget === "publish"
                            ? "border-brand bg-brand/5 cursor-pointer"
                            : "border-line/70 hover:border-brand/40 cursor-pointer dark:border-line/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="restore-target"
                        value="publish"
                        disabled={!canPublishTarget}
                        checked={restoreTarget === "publish"}
                        onChange={() => setRestoreTarget("publish")}
                        className="mt-0.5 accent-brand"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-semibold text-ink">
                          <span>Pulihkan & Publikasikan ke Produksi</span>
                          <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            Ubah Situs Live
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">
                          Langsung mengganti konfigurasi produksi aktif dengan snapshot revisi ini
                          dan mencatat entri revisi baru di riwayat.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectState(null);
                        setErrorMsg(null);
                      }}
                      className="rounded-xl border border-line px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface dark:border-line/40 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      data-action="confirm-restore"
                      disabled={
                        !compatibilityOk ||
                        (restoreTarget === "publish" && !canPublishTarget) ||
                        restoringId === inspectState.revision.revisionId
                      }
                      onClick={() => void handleConfirmRestore()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>
                        {restoringId === inspectState.revision.revisionId
                          ? "Memproses..."
                          : restoreTarget === "publish"
                            ? "Pulihkan & Publikasikan"
                            : "Muat Revisi ke Draf"}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : loading ? (
            <div data-revisions-state="loading" className="py-12 text-center text-xs text-muted">
              <span className="inline-block size-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin mb-2" />
              <p>Memuat rekaman versi...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-8 text-center text-xs text-muted">
              <p>Riwayat revisi tidak dapat ditampilkan karena pembacaan dari penyimpanan gagal.</p>
            </div>
          ) : revisions.length === 0 ? (
            <div data-revisions-state="empty" className="py-12 text-center text-xs text-muted">
              <Clock className="size-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-ink">Belum Ada Riwayat Revisi Tersimpan</p>
              <p className="mt-1">
                Riwayat akan otomatis tercatat saat Anda mempublikasikan konten ke server.
              </p>
            </div>
          ) : (
            <div data-revisions-state="loaded" className="space-y-3">
              {revisions.map((rev, idx) => (
                <div
                  key={rev.revisionId}
                  data-revision-id={rev.revisionId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-line/70 bg-surface/40 p-4 transition hover:border-brand/40 dark:border-line/40 dark:bg-slate-900/40"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-brand px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                        v{rev.version}
                      </span>
                      {idx === 0 && (
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Publikasi Terakhir
                        </span>
                      )}
                      <span className="text-xs font-semibold text-ink truncate">
                        {rev.summary}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
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
                      <span className="inline-flex items-center gap-1 font-mono">
                        <FileCode2 className="size-3" />
                        {typeof rev.schemaVersion === "number"
                          ? `skema v${rev.schemaVersion}`
                          : "skema lama"}
                      </span>
                      <span className="font-mono text-[10px] opacity-75">
                        {rev.revisionId}
                      </span>
                    </div>

                    {Array.isArray(rev.changedSections) && rev.changedSections.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {rev.changedSections.map((sec) => (
                          <span
                            key={sec}
                            className="rounded-md border border-line/70 bg-white/70 px-1.5 py-0.5 text-[10px] text-ink dark:border-line/40 dark:bg-slate-800/70"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    data-action="inspect-revision"
                    onClick={() => void handleOpenInspect(rev)}
                    className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:border-brand hover:text-brand dark:border-line/40 dark:bg-slate-800 transition"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>{idx === 0 ? "Tinjau Snapshot" : "Tinjau & Pulihkan"}</span>
                  </button>
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
