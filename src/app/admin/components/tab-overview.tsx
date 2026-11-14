"use client";

import Link from "next/link";
import type { SiteConfig } from "@/lib/site-config";
import type { ContentHealthReport } from "@/lib/content/types";
import { computeAutoStatsBreakdown, isSectionVisible } from "@/lib/content/selectors";
import {
  FolderGit2,
  Award,
  GraduationCap,
  Briefcase,
  Wrench,
  ShieldCheck,
  History,
  Eye,
  Download,
  PlusCircle,
  CheckCircle2,
  EyeOff,
  ExternalLink,
  Layers,
  ArrowRight,
  BarChart3,
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
  const publishedProjects = projects.filter((p) => p.published !== false && p.visible !== false);

  const certs = config.certificates || [];
  const publishedCerts = certs.filter((c) => c.published !== false && c.visible !== false);

  const education = config.education || [];
  const experience = config.experience || [];
  const services = config.services || [];
  const techStack = config.techStack || [];
  const totalTools = techStack.length;
  const categoriesCount = new Set(techStack.map((s) => s.category)).size;

  const autoStats = computeAutoStatsBreakdown(config);
  const statsMode = config.stats?.mode || "auto";

  const sectionReadiness = [
    { key: "hero" as const, label: "Hero & Lanyard 3D" },
    { key: "about" as const, label: "Tentang & Statistik" },
    { key: "services" as const, label: "4 Pilar Layanan" },
    { key: "cv" as const, label: "Folder Berkas CV" },
    { key: "journey" as const, label: "Akademik & Karier" },
    { key: "achievements" as const, label: "Prestasi & Rekognisi" },
    { key: "certificates" as const, label: "Sertifikasi Terverifikasi" },
    { key: "stack" as const, label: "Tech Stack & Marquee" },
    { key: "projects" as const, label: "Proyek & Studi Kasus" },
    { key: "blog" as const, label: "Blog & Writing" },
    { key: "faq" as const, label: "FAQ Accordion" },
    { key: "contact" as const, label: "Kontak & Hologram Card" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top Hero Summary & Health Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface/80 via-surface/40 to-brand/5 p-6 dark:border-line/40 dark:from-slate-900/80 dark:to-brand/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-muted">
              Ringkasan & Status Konfigurasi (Skema v{config.version || 2})
            </span>
            <h2 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
              Pusat Kendali Portofolio
            </h2>
            <p className="text-xs text-muted">
              Kelola seluruh konten, linimasa karier, proyek, blog, SEO, navigasi, dan aset media secara terpusat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenHealthModal}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/90 px-3.5 py-2 text-xs font-semibold text-body transition-colors hover:bg-surface hover:text-ink dark:border-line/40 dark:bg-slate-900/90"
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
        <button
          type="button"
          onClick={() => onNavigateTab("works")}
          className="group rounded-2xl border border-line bg-surface/40 p-4 text-left transition hover:border-brand hover:bg-surface/80 dark:border-line/30 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between text-muted group-hover:text-brand">
            <FolderGit2 className="size-4" />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {publishedProjects.length} Publik
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-ink">{projects.length}</div>
          <div className="text-[11px] font-medium text-muted">Total Proyek</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("credentials")}
          className="group rounded-2xl border border-line bg-surface/40 p-4 text-left transition hover:border-brand hover:bg-surface/80 dark:border-line/30 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between text-muted group-hover:text-brand">
            <Award className="size-4" />
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              {publishedCerts.length} Publik
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-ink">{certs.length}</div>
          <div className="text-[11px] font-medium text-muted">Sertifikat</div>
        </button>

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

        <button
          type="button"
          onClick={() => onNavigateTab("journey")}
          className="group rounded-2xl border border-line bg-surface/40 p-4 text-left transition hover:border-brand hover:bg-surface/80 dark:border-line/30 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between text-muted group-hover:text-brand">
            <Briefcase className="size-4" />
            <span className="text-[10px] font-semibold text-muted">
              {autoStats.organizationsCount} Organisasi Unik
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-ink">{experience.length}</div>
          <div className="text-[11px] font-medium text-muted">Peran Karier</div>
        </button>

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
          <div className="text-[11px] font-medium text-muted">Layanan</div>
        </button>

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
          <div className="text-[11px] font-medium text-muted">Alat / Bahasa</div>
        </button>
      </div>

      {/* Auto-Computed Stats Breakdown Card */}
      <div className="rounded-2xl border border-line bg-white/80 p-5 dark:border-line/40 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-brand" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Kalkulasi Statistik Halaman Tentang ({statsMode === "auto" ? "Mode Otomatis" : "Mode Override Manual"})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("general")}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Ubah Mode di Profil -&gt;
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line/60 bg-surface/50 p-3 dark:border-line/30 dark:bg-slate-950/60">
            <div className="text-[11px] text-muted">Proyek Terhitung</div>
            <div className="mt-1 font-mono text-xl font-bold text-ink">
              {statsMode === "manual" ? config.stats.projectsCount : autoStats.projectsCount}
            </div>
          </div>
          <div className="rounded-xl border border-line/60 bg-surface/50 p-3 dark:border-line/30 dark:bg-slate-950/60">
            <div className="text-[11px] text-muted">Sertifikat Terhitung</div>
            <div className="mt-1 font-mono text-xl font-bold text-ink">
              {statsMode === "manual" ? config.stats.certificatesCount : autoStats.certificatesCount}
            </div>
          </div>
          <div className="rounded-xl border border-line/60 bg-surface/50 p-3 dark:border-line/30 dark:bg-slate-950/60">
            <div className="text-[11px] text-muted">
              Pengalaman ({autoStats.experienceMonths} bln net)
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-ink">
              {statsMode === "manual" ? config.stats.experienceYears : autoStats.experienceYears}
            </div>
          </div>
          <div className="rounded-xl border border-line/60 bg-surface/50 p-3 dark:border-line/30 dark:bg-slate-950/60">
            <div className="text-[11px] text-muted">Organisasi Unik</div>
            <div className="mt-1 font-mono text-xl font-bold text-ink">
              {statsMode === "manual" ? config.stats.organizationsCount : autoStats.organizationsCount}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions & Maintenance Shortcuts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <ArrowRight className="size-3.5 text-muted" />
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
              <ArrowRight className="size-3.5 text-muted" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("content")}
              className="flex w-full items-center justify-between rounded-xl border border-line/60 bg-white/70 px-3.5 py-2.5 text-xs font-semibold text-ink transition hover:border-brand hover:bg-surface dark:border-line/40 dark:bg-slate-900/60"
            >
              <span className="flex items-center gap-2">
                <Layers className="size-4 text-brand" />
                <span>Kelola Blog, Navigasi & Seksi</span>
              </span>
              <ArrowRight className="size-3.5 text-muted" />
            </button>
          </div>
        </div>

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
              <ArrowRight className="size-3.5 text-muted" />
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
              <ArrowRight className="size-3.5 text-muted" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Live Section Visibility Checklist */}
      <div className="rounded-2xl border border-line bg-surface/20 p-5 dark:border-line/30 dark:bg-slate-900/20">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Status Visibilitas Seksi Halaman Utama
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab("content")}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Atur Seksi &amp; Urutan -&gt;
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 text-xs">
          {sectionReadiness.map((sec) => {
            const active = isSectionVisible(config, sec.key);
            return (
              <div
                key={sec.key}
                className="flex items-center gap-2 rounded-xl border border-line/40 bg-surface/60 p-2.5 dark:bg-slate-900/40"
              >
                {active ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : (
                  <EyeOff className="size-4 text-muted shrink-0" />
                )}
                <span className={`font-medium ${active ? "text-ink" : "text-muted line-through"}`}>
                  {sec.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TabOverview;
