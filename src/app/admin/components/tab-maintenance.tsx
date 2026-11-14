"use client";

import { useState, useRef } from "react";
import type { SiteConfig } from "@/lib/site-config";
import type { ContentHealthReport } from "@/lib/content/types";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import { auditContentHealth } from "@/lib/content/content-health";
import {
  Download,
  Upload,
  History,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  RotateCcw,
  Database,
  Cloud,
} from "lucide-react";

interface TabMaintenanceProps {
  config: SiteConfig;
  cloudStatus: { r2: boolean; supabase: boolean } | null;
  healthReport: ContentHealthReport;
  onApplyConfig: (newConfig: SiteConfig) => void;
  onResetFactory: () => void;
  onOpenRevisionsModal: () => void;
  onOpenHealthModal: () => void;
  setStatus: (msg: string) => void;
}

export function TabMaintenance({
  config,
  cloudStatus,
  healthReport,
  onApplyConfig,
  onResetFactory,
  onOpenRevisionsModal,
  onOpenHealthModal,
  setStatus,
}: TabMaintenanceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importCandidate, setImportCandidate] = useState<SiteConfig | null>(null);
  const [candidateHealth, setCandidateHealth] = useState<ContentHealthReport | null>(null);
  const [candidateErrors, setCandidateErrors] = useState<string[]>([]);
  const [importTarget, setImportTarget] = useState<"draft" | "publish">("draft");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setCandidateErrors([]);
    setImportCandidate(null);
    setCandidateHealth(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        const configObj: unknown =
          parsed && typeof parsed === "object" && "config" in parsed
            ? (parsed as { config: unknown }).config
            : parsed;

        const validation = validateSiteConfigPayload(configObj);
        if (!validation.isValid) {
          setCandidateErrors(validation.errors);
          setStatus(`Format berkas cadangan tidak valid: ${validation.errors[0]}`);
          setImporting(false);
          return;
        }

        const valid = configObj as SiteConfig;
        const health = auditContentHealth(valid);

        setImportCandidate(valid);
        setCandidateHealth(health);
        setStatus("Berkas cadangan berhasil dibaca & siap diterapkan");
      } catch {
        setCandidateErrors(["Berkas bukan format JSON yang valid."]);
        setStatus("Gagal membaca berkas JSON");
      } finally {
        setImporting(false);
      }
    };

    reader.onerror = () => {
      setCandidateErrors(["Terjadi kesalahan saat membaca berkas dari disk."]);
      setImporting(false);
    };

    reader.readAsText(file);
  };

  const handleApplyImport = async () => {
    if (!importCandidate) return;

    setImporting(true);
    setStatus(
      importTarget === "publish"
        ? "Mempublikasikan cadangan ke cloud..."
        : "Menerapkan cadangan ke draf..."
    );

    try {
      const res = await fetch(`/api/admin/backup?target=${importTarget}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: importCandidate }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(`Gagal impor: ${data.error || "Kesalahan server"}`);
        return;
      }

      onApplyConfig(importCandidate);
      setImportCandidate(null);
      setCandidateHealth(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setStatus(
        importTarget === "publish"
          ? "Cadangan berhasil diimpor dan dipublikasikan ke seluruh situs!"
          : "Cadangan berhasil dimuat ke editor draf. Silakan periksa sebelum dipublikasikan."
      );
    } catch {
      setStatus("Gagal menghubungi server saat impor");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="rounded-2xl border border-line bg-surface/40 p-6 dark:border-line/40 dark:bg-slate-900/40">
        <h2 className="text-base font-bold text-ink">Pemeliharaan, Cadangan & Pemulihan</h2>
        <p className="mt-1 text-xs text-muted">
          Pusat ekspor cadangan format JSON, pemulihan versi, audit integritas data, dan diagnostik infrastruktur cloud.
        </p>
      </div>

      {/* 2. Grid: Backup / Restore & Version History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card A: Ekspor & Unduh Cadangan */}
        <div className="rounded-2xl border border-line bg-surface/30 p-6 space-y-4 dark:border-line/40 dark:bg-slate-900/30">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-brand/10 p-2 text-brand">
              <Download className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Ekspor Cadangan JSON</h3>
              <p className="text-xs text-muted">
                Unduh seluruh konfigurasi situs (proyek, karier, sertifikasi, CV, dan pengaturan).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-line/60 bg-white/70 p-4 text-xs space-y-2 dark:border-line/40 dark:bg-slate-900/60">
            <div className="flex items-center justify-between text-muted">
              <span>Versi Skema:</span>
              <span className="font-semibold text-ink">v{config.version || 1}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Total Entitas Proyek:</span>
              <span className="font-semibold text-ink">{(config.projects || []).length} proyek</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Total Sertifikat:</span>
              <span className="font-semibold text-ink">{(config.certificates || []).length} entri</span>
            </div>
          </div>

          <a
            href="/api/admin/backup"
            download
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand/90"
          >
            <Download className="size-4" />
            <span>Unduh Berkas Cadangan (.json)</span>
          </a>
        </div>

        {/* Card B: Impor & Pulihkan Cadangan */}
        <div className="rounded-2xl border border-line bg-surface/30 p-6 space-y-4 dark:border-line/40 dark:bg-slate-900/30">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Upload className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Impor Konfigurasi JSON</h3>
              <p className="text-xs text-muted">
                Unggah berkas cadangan JSON untuk memulihkan konten situs.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            id="backup-file-input"
          />

          {!importCandidate ? (
            <label
              htmlFor="backup-file-input"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface/40 p-6 text-center cursor-pointer transition hover:border-brand hover:bg-surface/80 dark:border-line/40 dark:bg-slate-900/40"
            >
              <FileJson className="size-8 text-muted" />
              <div className="text-xs font-semibold text-ink">
                Klik untuk memilih berkas JSON cadangan
              </div>
              <div className="text-[10px] text-muted">
                Format: .json (dieksport dari ZekkTech CMS)
              </div>
            </label>
          ) : (
            <div className="rounded-xl border border-line/60 bg-white/70 p-4 text-xs space-y-3 dark:border-line/40 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Berkas Terbaca</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  Valid
                </span>
              </div>

              {candidateHealth && (
                <div className="text-[11px] text-muted">
                  Skor Kesehatan Konten:{" "}
                  <strong className="text-ink">{candidateHealth.score}%</strong> (
                  {candidateHealth.errorsCount} error, {candidateHealth.warningsCount} peringatan)
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-line/40">
                <span className="text-[11px] font-semibold text-muted">Tujuan Penerapan:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="importTarget"
                      value="draft"
                      checked={importTarget === "draft"}
                      onChange={() => setImportTarget("draft")}
                      className="text-brand"
                    />
                    <span>Sebagai Draf (Aman)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="importTarget"
                      value="publish"
                      checked={importTarget === "publish"}
                      onChange={() => setImportTarget("publish")}
                      className="text-brand"
                    />
                    <span>Publikasikan Langsung</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleApplyImport}
                  disabled={importing}
                  className="flex-1 rounded-xl bg-emerald-600 py-2 text-center text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {importing ? "Memproses..." : "Terapkan Cadangan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportCandidate(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-muted hover:text-ink"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {candidateErrors.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Kesalahan Validasi Berkas:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {candidateErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 3. Section: Version History & Integrity Dialog Shortcuts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Snapshot Revisi */}
        <div className="rounded-2xl border border-line bg-surface/30 p-6 space-y-3 dark:border-line/40 dark:bg-slate-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <History className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Riwayat Versi & Rollback</h3>
                <p className="text-xs text-muted">
                  Buka rekaman versi publikasi sebelumnya untuk memulihkan konten jika terjadi kesalahan.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRevisionsModal}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white/80 py-2.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-surface dark:border-line/40 dark:bg-slate-900/80"
          >
            <History className="size-4 text-brand" />
            <span>Buka Dialog Riwayat Revisi</span>
          </button>
        </div>

        {/* Content Health Checker */}
        <div className="rounded-2xl border border-line bg-surface/30 p-6 space-y-3 dark:border-line/40 dark:bg-slate-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Pemeriksa Kesehatan Konten</h3>
                <p className="text-xs text-muted">
                  Audit otomatis untuk mendeteksi tautan rusak, gambar hilang, atau ketidaklengkapan teks.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenHealthModal}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white/80 py-2.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-surface dark:border-line/40 dark:bg-slate-900/80"
          >
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Buka Laporan Kesehatan Konten ({healthReport.score}%)</span>
          </button>
        </div>
      </div>

      {/* 4. Section: Cloud Status & Reset */}
      <div className="rounded-2xl border border-line bg-surface/30 p-6 space-y-4 dark:border-line/40 dark:bg-slate-900/30">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
          Diagnostik Cloud & Reset Konfigurasi
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Supabase Status */}
          <div className="flex items-center justify-between rounded-xl border border-line/60 bg-white/70 p-3.5 dark:border-line/40 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <Database className="size-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-xs">
                <div className="font-semibold text-ink">Supabase PostgreSQL</div>
                <div className="text-[10px] text-muted">Tabel site_config (JSONB)</div>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                cloudStatus?.supabase
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {cloudStatus?.supabase ? "Terhubung" : "Lokal Fallback"}
            </span>
          </div>

          {/* R2 Status */}
          <div className="flex items-center justify-between rounded-xl border border-line/60 bg-white/70 p-3.5 dark:border-line/40 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <Cloud className="size-4 text-blue-600 dark:text-blue-400" />
              <div className="text-xs">
                <div className="font-semibold text-ink">Cloudflare R2 Bucket</div>
                <div className="text-[10px] text-muted">Media storage & CDN</div>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                cloudStatus?.r2
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {cloudStatus?.r2 ? "Aktif" : "Data URI Mode"}
            </span>
          </div>
        </div>

        {/* Factory Reset */}
        <div className="pt-3 border-t border-line/40 flex items-center justify-between">
          <div className="text-xs">
            <div className="font-semibold text-rose-600 dark:text-rose-400">
              Reset ke Standar Pabrik
            </div>
            <div className="text-[10px] text-muted">
              Kembalikan konfigurasi editor ke bawaan awal profile.ts. Draf yang belum disimpan akan hilang.
            </div>
          </div>
          <button
            type="button"
            onClick={onResetFactory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-500/20 dark:text-rose-300"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset Bawaan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
