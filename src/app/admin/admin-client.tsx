"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  normalizeConfig,
  resetConfig,
  saveCloudDraft,
  publishCloudConfig,
  useSiteConfig,
  writeConfig,
  type SiteConfig,
} from "@/lib/site-store";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import { auditContentHealth } from "@/lib/content/content-health";
import CvPreviewModal, { type RoleKey } from "@/components/cv-preview-modal";
import {
  ArrowLeft,
  LogOut,
  Save,
  RotateCcw,
  CloudDownload,
  AlertTriangle,
  CheckCircle2,
  User,
  GraduationCap,
  FolderGit2,
  Wrench,
  Award,
  HelpCircle,
  ImageIcon,
  Sparkles,
  History,
  ShieldCheck,
  Eye,
  FileText,
  LayoutDashboard,
} from "lucide-react";

import { TabOverview } from "./components/tab-overview";
import { TabGeneral } from "./components/tab-general";
import { TabJourney } from "./components/tab-journey";
import { TabWorks } from "./components/tab-works";
import { TabExpertise } from "./components/tab-expertise";
import { TabCredentials } from "./components/tab-credentials";
import { TabContent } from "./components/tab-content";
import { TabMedia } from "./components/tab-media";
import { TabAppearance } from "./components/tab-appearance";
import { TabMaintenance } from "./components/tab-maintenance";
import { ModalRevisions } from "./components/modal-revisions";
import { ModalHealth } from "./components/modal-health";

export type AdminTabKey =
  | "overview"
  | "general"
  | "journey"
  | "works"
  | "expertise"
  | "credentials"
  | "content"
  | "media"
  | "appearance"
  | "maintenance";

const inputClass =
  "w-full rounded-xl border border-line bg-surface/60 px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand dark:border-line/60 dark:bg-slate-900/60 dark:focus:bg-[#0c0e17] transition";

/**
 * Konversi berkas gambar (PNG, JPG, JPEG) ke format WebP di sisi client via Canvas API.
 */
async function convertImageToWebP(file: File, quality = 0.88): Promise<File> {
  if (file.type === "image/webp") return file;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas gambar"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Gagal memproses gambar untuk konversi WebP"));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const webpName = file.name.replace(/\.[^.]+$/, "") + ".webp";
              const webpFile = new File([blob], webpName, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(webpFile);
            },
            "image/webp",
            quality
          );
        } catch {
          resolve(file);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminClient({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const storedConfig = useSiteConfig();
  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTabKey>("appearance");
  const [cloudStatus, setCloudStatus] = useState<{ r2: boolean; supabase: boolean } | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [previewCvRole, setPreviewCvRole] = useState<RoleKey | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  const config = draft ?? storedConfig;
  const hasUnsavedChanges = draft !== null;

  // Real-time Health Audit
  const healthReport = useMemo(() => auditContentHealth(config), [config]);

  // Prevent silent data loss: Warning on beforeunload when unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    fetch("/api/upload")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCloudStatus(data))
      .catch(() => setCloudStatus({ r2: false, supabase: false }));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  const uploadAndSet = async (
    file: File,
    folder: string,
    callback: (url: string) => void,
    fieldKey: string
  ) => {
    setUploadingImage(fieldKey);
    setStatus(`Mengompresi dan mengunggah berkas ${file.name}...`);

    try {
      let fileToUpload = file;
      if (file.type.startsWith("image/") && file.type !== "image/svg+xml" && file.type !== "image/gif") {
        try {
          fileToUpload = await convertImageToWebP(file);
        } catch (convErr) {
          console.warn("Konversi WebP client dilewati:", convErr);
        }
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah berkas");
      }

      callback(data.url);
      setStatus(
        data.source === "r2"
          ? "Berkas berhasil diunggah permanen ke Cloudflare R2"
          : "Berkas disimpan lokal (Base64 data URI)"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kesalahan unggah";
      setStatus(`Gagal unggah: ${msg}`);
      alert(`Gagal mengunggah berkas: ${msg}`);
    } finally {
      setUploadingImage(null);
    }
  };

  // 1. Simpan Draf (Tidak mempengaruhi situs publik)
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setStatus("Menyimpan draf ke server...");
    try {
      const res = await saveCloudDraft(config);
      if (res.success) {
        setStatus("Draf berhasil disimpan (belum dipublikasikan)");
      } else {
        setStatus(`Gagal simpan draf: ${res.message || "Kesalahan cloud"}`);
      }
    } catch {
      setStatus("Gagal menghubungi server draf");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 2. Publikasikan ke Seluruh Situs (Primary Action, juga digunakan oleh test script 'Simpan')
  const handlePublish = async () => {
    // Audit integritas data
    if (!healthReport.canPublish) {
      setShowHealthModal(true);
      setValidationErrors(
        healthReport.issues.filter((i) => i.severity === "error").map((i) => `[${i.section}] ${i.message}`)
      );
      setStatus("Publikasi dicegah: Perbaiki kesalahan integritas konten terlebih dahulu.");
      return;
    }

    const validation = validateSiteConfigPayload(config);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setStatus(`Gagal validasi: ${validation.errors[0]}`);
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    setStatus("Mempublikasikan konten ke cloud...");

    try {
      // Local fallback write
      writeConfig(config);

      // Cloud publish with automatic revision snapshot
      if (cloudStatus?.supabase) {
        const res = await publishCloudConfig(config);
        if (res.success) {
          setStatus("Berhasil dipublikasikan ke seluruh situs publik!");
          setDraft(null);
        } else {
          setStatus(`Tersimpan lokal (${res.message || "Gagal sinkron cloud"})`);
        }
      } else {
        setStatus("Tersimpan sebagai draf lokal (Supabase belum terkonfigurasi)");
      }
    } catch {
      setStatus("Gagal menghubungi server");
    } finally {
      setIsSaving(false);
    }
  };

  const pullFromCloud = async () => {
    setSyncingCloud(true);
    setStatus("Mengambil data terbaru dari Supabase Cloud...");
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      const data = await res.json();
      if (data.configured && data.config) {
        const normalized = normalizeConfig(data.config);
        setDraft(normalized);
        writeConfig(normalized);
        setStatus("Konfigurasi Supabase berhasil disinkronkan ke editor");
      } else {
        setStatus(data.message || "Belum ada konfigurasi tersimpan di cloud");
      }
    } catch {
      setStatus("Gagal terhubung ke API cloud");
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleReset = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Kembalikan seluruh konfigurasi ke nilai bawaan kode? Tindakan ini tidak dapat dibatalkan.")
    ) {
      return;
    }
    resetConfig();
    setDraft(null);
    setStatus("Konfigurasi dikembalikan ke default");
  };

  // Tab definition following Phase 34 Information Architecture
  // 'works' keeps label "Proyek" for test script compatibility (scripts/check.mjs)
  const tabs: { key: AdminTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "general", label: "Profil & Kontak", icon: User },
    { key: "journey", label: "Linimasa Karier", icon: GraduationCap },
    { key: "works", label: "Proyek", icon: FolderGit2 },
    { key: "expertise", label: "Skill & Layanan", icon: Wrench },
    { key: "credentials", label: "Sertifikasi & CV", icon: Award },
    { key: "content", label: "FAQ & Teks", icon: HelpCircle },
    { key: "media", label: "Pustaka Media", icon: ImageIcon },
    { key: "appearance", label: "Tampilan & SEO", icon: Sparkles },
    { key: "maintenance", label: "Cadangan & Riwayat", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink transition-colors selection:bg-brand/10 selection:text-brand">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-line/60 bg-white/90 backdrop-blur-md dark:border-line/40 dark:bg-[#0c0e17]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/60 px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface hover:text-ink dark:border-line/40 dark:bg-slate-900/60"
            >
              <ArrowLeft className="size-3.5" />
              <span>Kembali</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold text-ink">Panel Admin</span>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    Draf Belum Disimpan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted hidden sm:block">
                {userEmail || "admin"} • Kelola konfigurasi, aset, dan linimasa portofolio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pratinjau Draf */}
            <Link
              href="/admin/preview"
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-500/20 dark:text-amber-300"
              title="Buka pratinjau draf tanpa mempublikasikan ke publik"
            >
              <Eye className="size-3.5" />
              <span>Pratinjau Draf</span>
            </Link>

            {/* Riwayat Versi & Rollback */}
            <button
              type="button"
              onClick={() => setShowRevisionsModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/60 px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface hover:text-ink dark:border-line/40 dark:bg-slate-900/60"
              title="Lihat riwayat revisi dan pulihkan versi lama"
            >
              <History className="size-3.5 text-brand" />
              <span className="hidden md:inline">Versi</span>
            </button>

            {/* Content Health Checker Badge */}
            <button
              type="button"
              onClick={() => setShowHealthModal(true)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                healthReport.canPublish
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
              }`}
              title="Periksa kesehatan dan integritas data konten"
            >
              <ShieldCheck className="size-3.5" />
              <span>{healthReport.score}%</span>
            </button>

            {/* Simpan Draf Button */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/80 px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface hover:text-ink disabled:opacity-50 dark:border-line/40 dark:bg-slate-900/80"
              title="Simpan draf ke server tanpa mempublikasikannya ke publik"
            >
              <FileText className="size-3.5" />
              <span>{isSavingDraft ? "Menyimpan..." : "Simpan Draf"}</span>
            </button>

            <button
              type="button"
              onClick={pullFromCloud}
              disabled={syncingCloud}
              className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/60 px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface hover:text-ink disabled:opacity-50 dark:border-line/40 dark:bg-slate-900/60"
            >
              <CloudDownload className="size-3.5 text-brand" />
              <span>{syncingCloud ? "Menyinkronkan..." : "Tarik Cloud"}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="hidden 2xl:inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/60 px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface hover:text-ink dark:border-line/40 dark:bg-slate-900/60"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </button>

            {/* Simpan & Publikasikan (Wajib 'Simpan' untuk script test compatibility) */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand/90 disabled:opacity-50"
              title="Publikasikan draf langsung ke seluruh situs publik"
            >
              {isSaving ? (
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>{isSaving ? "Menyimpan..." : "Simpan"}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/60 p-2 text-xs font-semibold text-muted transition hover:bg-rose-50 hover:text-rose-600 dark:border-line/40 dark:bg-slate-900/60 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
              title="Keluar dari Panel Admin"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="border-t border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-700 dark:text-rose-300">
            <div className="mx-auto flex max-w-7xl items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <div className="flex-1">
                <span className="font-bold">Perbaiki kesalahan berikut sebelum mempublikasikan:</span>{" "}
                {validationErrors.join(" • ")}
              </div>
              <button
                type="button"
                onClick={() => setValidationErrors([])}
                className="text-xs underline hover:no-underline"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Admin Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Navigation Tabs Bar */}
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-line/60 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-brand text-white shadow-sm"
                      : "border border-line/60 bg-white/60 text-muted hover:border-brand/40 hover:text-ink dark:border-line/40 dark:bg-slate-900/60"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {status && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-brand">
              <CheckCircle2 className="size-3.5" />
              <span className="max-w-[280px] truncate">{status}</span>
            </div>
          )}
        </div>

        {/* Tab Content Panes */}
        {tab === "overview" && (
          <TabOverview
            config={config}
            healthReport={healthReport}
            onNavigateTab={(t) => setTab(t)}
            onOpenHealthModal={() => setShowHealthModal(true)}
            onOpenRevisionsModal={() => setShowRevisionsModal(true)}
          />
        )}

        {tab === "general" && (
          <TabGeneral
            config={config}
            setDraft={setDraft}
            setStatus={setStatus}
            uploadAndSet={uploadAndSet}
            uploadingImage={uploadingImage}
            inputClass={inputClass}
          />
        )}

        {tab === "journey" && (
          <TabJourney
            config={config}
            setDraft={setDraft}
            setStatus={setStatus}
            uploadAndSet={uploadAndSet}
            uploadingImage={uploadingImage}
            inputClass={inputClass}
          />
        )}

        {tab === "works" && (
          <TabWorks
            config={config}
            setDraft={setDraft}
            setStatus={setStatus}
            uploadAndSet={uploadAndSet}
            uploadingImage={uploadingImage}
            inputClass={inputClass}
          />
        )}

        {tab === "expertise" && (
          <TabExpertise
            config={config}
            setDraft={setDraft}
            setStatus={setStatus}
            uploadAndSet={uploadAndSet}
            uploadingImage={uploadingImage}
            inputClass={inputClass}
          />
        )}

        {tab === "credentials" && (
          <TabCredentials
            config={config}
            setDraft={setDraft}
            setStatus={setStatus}
            uploadAndSet={uploadAndSet}
            uploadingImage={uploadingImage}
            inputClass={inputClass}
            setPreviewCvRole={setPreviewCvRole}
          />
        )}

        {tab === "content" && (
          <TabContent
            config={config}
            setDraft={setDraft}
            setStatus={setStatus}
            inputClass={inputClass}
          />
        )}

        {tab === "media" && (
          <TabMedia
            config={config}
            setStatus={setStatus}
            uploadAndSet={uploadAndSet}
            uploadingImage={uploadingImage}
            inputClass={inputClass}
          />
        )}

        {tab === "appearance" && (
          <TabAppearance
            config={config}
            setDraft={setDraft}
            setStatus={setStatus}
            uploadAndSet={uploadAndSet}
            uploadingImage={uploadingImage}
            inputClass={inputClass}
          />
        )}

        {tab === "maintenance" && (
          <TabMaintenance
            config={config}
            cloudStatus={cloudStatus}
            healthReport={healthReport}
            onApplyConfig={(newCfg) => {
              setDraft(newCfg);
              writeConfig(newCfg);
            }}
            onResetFactory={handleReset}
            onOpenRevisionsModal={() => setShowRevisionsModal(true)}
            onOpenHealthModal={() => setShowHealthModal(true)}
            setStatus={setStatus}
          />
        )}
      </main>

      {/* CV Preview Modal */}
      {previewCvRole && (
        <CvPreviewModal
          isOpen={true}
          initialRole={previewCvRole}
          onClose={() => setPreviewCvRole(null)}
        />
      )}

      {/* Version History Modal */}
      <ModalRevisions
        isOpen={showRevisionsModal}
        onClose={() => setShowRevisionsModal(false)}
        onRestore={(restored) => {
          setDraft(restored);
          writeConfig(restored);
          setStatus("Versi berhasil dipulihkan dan diterapkan di editor");
        }}
      />

      {/* Content Health Checker Modal */}
      <ModalHealth
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        config={config}
      />
    </div>
  );
}
