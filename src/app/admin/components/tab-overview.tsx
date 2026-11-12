"use client";

import Link from "next/link";
import type { SiteConfig } from "@/lib/site-config";
import type { ContentHealthReport } from "@/lib/content/types";
import {
  FolderGit2,
  Award,
  GraduationCap,
  Briefcase,
  Wrench,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  History,
  Eye,
  Download,
  PlusCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
} from "lucide-react";
import type { AdminTabKey } from "../admin-client";

interface TabOverviewProps {
  config: SiteConfig;
  healthReport: ContentHealthReport;
  onNavigateTab: (tab: AdminTabKey) => void;
  onOpenHealthModal: () => void;
  onOpenRevisionsModal: () => void;
}

export function TabOverview({
  config,
  healthReport,
  onNavigateTab,
  onOpenHealthModal,
  onOpenRevisionsModal,
}: TabOverviewProps) {
  const projects = config.projects || [];
  const publishedProjects = projects.filter((p) => p.published !== false);
  const draftProjects = projects.filter((p) => p.published === false);

  const certs = config.certificates || [];
  const verifiedCerts = certs.filter((c) => Boolean(c.credentialUrl || c.credentialPdf));

  const education = config.education || [];
  const experience = config.experience || [];
  const achievements = config.achievements || [];
  const services = config.services || [];
  const techStack = config.techStack || [];
  const totalTools = techStack.length;
  const categoriesCount = new Set(techStack.map((s) => s.category)).size;
  const faq = config.faq || [];

  return (
    <div className="space-y-6">
      {/* 1. Top Hero Summary & Health Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface/80 via-surface/40 to-brand/5 p-6 backdrop-blur-sm dark:border-line/40 dark:from-slate-900/80 dark:to-brand/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                ZekkTech CMS v3 • Status Operasional
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
              Pusat Kendali Portofolio
            </h2>
            <p className="text-xs text-muted">
              Kelola seluruh konten, linimasa karier, proyek, dan aset media ZekkTech secara terpusat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenHealthModal}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-sm ${
                healthReport.canPublish
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300"
              }`}
            >
              <ShieldCheck className="size-4" />
              <span>Integritas Konten: {healthReport.score}%</span>
              {healthReport.errorsCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">
                  {healthReport.errorsCount} Error
                </span>
              )}
            </button>

            <Link
              href="/admin/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/90 px-3.5 py-2 text-xs font-semibold text-body shadow-sm transition hover:bg-surface hover:text-ink dark:border-line/40 dark:bg-slate-900/90"
            >
              <Eye className="size-3.5 text-brand" />
              <span>Pratinjau Draf</span>
              <ExternalLink className="size-3 text-muted" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Proyek */}
        <button
          type="button"
          onClick={() => onNavigateTab("works")}
          className="group rounded-2xl border border-line bg-surface/40 p-4 text-left transition hover:border-brand hover:bg-surface/80 dark:border-line/30 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between text-muted group-hover:text-brand">
            <FolderGit2 className="size-4" />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {publishedProjects.length} Terbit
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-ink">{projects.length}</div>
          <div className="text-[11px] font-medium text-muted">Total Proyek</div>
        </button>

        {/* Sertifikasi */}
        <button
          type="button"
          onClick={() => onNavigateTab("credentials")}
          className="group rounded-2xl border border-line bg-surface/40 p-4 text-left transition hover:border-brand hover:bg-surface/80 dark:border-line/30 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between text-muted group-hover:text-brand">
            <Award className="size-4" />
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              {verifiedCerts.length} Terverifikasi
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-ink">{certs.length}</div>
          <div className="text-[11px] font-medium text-muted">Sertifikat</div>
        </button>

        {/* Pendidikan */}
        <button
          type="button"
          onClick={() => onNavigateTab("journey")}
          className="group rounded-2xl border border-line bg-surface/40 p-4 text-left transition hover:border-brand hover:bg-surface/80 dark:border-line/30 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between text-muted group-hover:text-brand">
            <GraduationCap className="size-4" />
            <span className="text-[10px] font-semibold text-muted">Akademik</span>
          </div>
          <div className="mt-3 text-2xl font-black text-ink">{education.length}</div>
          <div className="text-[11px] font-medium text-muted">Institusi</div>
        </button>

        {/* Pengalaman Karier */}
        <button
          type="button"
          onClick={() => onNavigateTab("journey")}
          className="group rounded-2xl border border-line bg-surface/40 p-4 text-left transition hover:border-brand hover:bg-surface/80 dark:border-line/30 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between text-muted group-hover:text-brand">
            <Briefcase className="size-4" />
            <span className="text-[10px] font-semibold text-muted">Karier</span>
          </div>
          <div className="mt-3 text-2xl font-black text-ink">{experience.length}</div>
          <div className="text-[11px] font-medium text-muted">Pengalaman</div>
        </button>

        {/* Layanan */}
        <button
          type="button"
          onClick={() => onNavigateTab("expertise")}
          className="group rounded-2xl border border-line bg-surface/40 p-4 text-left transition hover:border-brand hover:bg-surface/80 dark:border-line/30 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between text-muted group-hover:text-brand">
            <Layers className="size-4" />
            <span className="text-[10px] font-semibold text-muted">Pilar</span>
          </div>
          <div className="mt-3 text-2xl font-black text-ink">{services.length}</div>
          <div className="text-[11px] font-medium text-muted">Layanan Desain/IT</div>
        </button>

        {/* Tech Stack */}
        <button
          type="button"
          onClick={() => onNavigateTab("expertise")}
          className="group rounded-2xl border border-line bg-surface/40 p-4 text-left transition hover:border-brand hover:bg-surface/80 dark:border-line/30 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between text-muted group-hover:text-brand">
            <Wrench className="size-4" />
            <span className="text-[10px] font-semibold text-muted">{categoriesCount} Kategori</span>
          </div>
          <div className="mt-3 text-2xl font-black text-ink">{totalTools}</div>
          <div className="text-[11px] font-medium text-muted">Total Alat/Bahasa</div>
        </button>
      </div>

      {/* 3. Quick Actions & Maintenance Shortcuts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Kolom 1: Pintasan Konten */}
        <div className="rounded-2xl border border-line bg-surface/30 p-5 dark:border-line/30 dark:bg-slate-900/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Aksi Cepat Konten</h3>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => onNavigateTab("works")}
              className="flex w-full items-center justify-between rounded-xl border border-line/60 bg-white/70 px-3.5 py-2.5 text-xs font-semibold text-ink transition hover:border-brand hover:bg-surface dark:border-line/40 dark:bg-slate-900/60"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="size-4 text-brand" />
                <span>Tambah Proyek Baru</span>
              </span>
              <span className="text-[10px] text-muted">Works</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("credentials")}
              className="flex w-full items-center justify-between rounded-xl border border-line/60 bg-white/70 px-3.5 py-2.5 text-xs font-semibold text-ink transition hover:border-brand hover:bg-surface dark:border-line/40 dark:bg-slate-900/60"
            >
              <span className="flex items-center gap-2">
                <Award className="size-4 text-brand" />
                <span>Kelola Sertifikasi & Berkas CV</span>
              </span>
              <span className="text-[10px] text-muted">Certs</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("journey")}
              className="flex w-full items-center justify-between rounded-xl border border-line/60 bg-white/70 px-3.5 py-2.5 text-xs font-semibold text-ink transition hover:border-brand hover:bg-surface dark:border-line/40 dark:bg-slate-900/60"
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="size-4 text-brand" />
                <span>Perbarui Linimasa Akademik / Karier</span>
              </span>
              <span className="text-[10px] text-muted">Journey</span>
            </button>
          </div>
        </div>

        {/* Kolom 2: Integritas & Audit */}
        <div className="rounded-2xl border border-line bg-surface/30 p-5 dark:border-line/30 dark:bg-slate-900/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Audit & Kesehatan Data</h3>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center justify-between rounded-xl border border-line/60 bg-white/70 p-3 dark:border-line/40 dark:bg-slate-900/60">
              <div className="text-xs">
                <div className="font-semibold text-ink">Skor Kesehatan</div>
                <div className="text-[11px] text-muted">
                  {healthReport.errorsCount} error • {healthReport.warningsCount} peringatan
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenHealthModal}
                className="rounded-lg bg-surface px-2.5 py-1 text-xs font-bold text-ink hover:text-brand dark:bg-slate-800"
              >
                Lihat Detail
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line/60 bg-white/70 p-3 dark:border-line/40 dark:bg-slate-900/60">
              <div className="text-xs">
                <div className="font-semibold text-ink">Snapshot Revisi</div>
                <div className="text-[11px] text-muted">Pelacakan rollback otomatis</div>
              </div>
              <button
                type="button"
                onClick={onOpenRevisionsModal}
                className="flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-xs font-bold text-ink hover:text-brand dark:bg-slate-800"
              >
                <History className="size-3" />
                <span>Riwayat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kolom 3: Backup & Pemeliharaan */}
        <div className="rounded-2xl border border-line bg-surface/30 p-5 dark:border-line/30 dark:bg-slate-900/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Cadangan & Ekspor</h3>
          <div className="mt-3 space-y-2">
            <a
              href="/api/admin/backup"
              download
              className="flex w-full items-center justify-between rounded-xl border border-line/60 bg-white/70 px-3.5 py-2.5 text-xs font-semibold text-ink transition hover:border-brand hover:bg-surface dark:border-line/40 dark:bg-slate-900/60"
            >
              <span className="flex items-center gap-2">
                <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Unduh Cadangan JSON</span>
              </span>
              <span className="text-[10px] text-muted">Export</span>
            </a>

            <button
              type="button"
              onClick={() => onNavigateTab("maintenance")}
              className="flex w-full items-center justify-between rounded-xl border border-line/60 bg-white/70 px-3.5 py-2.5 text-xs font-semibold text-ink transition hover:border-brand hover:bg-surface dark:border-line/40 dark:bg-slate-900/60"
            >
              <span className="flex items-center gap-2">
                <Wrench className="size-4 text-brand" />
                <span>Pusat Pemeliharaan & Impor</span>
              </span>
              <span className="text-[10px] text-muted">Maintenance</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Section Completion Checklist */}
      <div className="rounded-2xl border border-line bg-surface/20 p-5 dark:border-line/30 dark:bg-slate-900/20">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
          Pemeriksaan Kesiapan Seksi Portofolio
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 text-xs">
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">Hero & Profil</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">Tentang & Statistik</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">Linimasa Akademik</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">Linimasa Karier</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">Lanyard 3D & Hologram</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">Folder Berkas CV</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">4 Pilar Layanan</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">Sertifikasi & Kredensial</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">Tech Stack & Tools</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium">FAQ & Kontak Form</span>
          </div>
        </div>
      </div>
    </div>
  );
}
