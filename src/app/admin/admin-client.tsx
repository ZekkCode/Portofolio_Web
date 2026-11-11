"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  normalizeConfig,
  resetConfig,
  saveCloudConfig,
  useSiteConfig,
  writeConfig,
  type SiteConfig,
} from "@/lib/site-store";
import { validateSiteConfigPayload } from "@/lib/config-validator";
import CvPreviewModal, { type RoleKey } from "@/components/cv-preview-modal";
import {
  ArrowLeft,
  LogOut,
  Save,
  RotateCcw,
  CloudDownload,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  User,
  GraduationCap,
  FolderGit2,
  Wrench,
  Award,
  HelpCircle,
  ImageIcon,
  Sparkles,
} from "lucide-react";

import { TabGeneral } from "./components/tab-general";
import { TabJourney } from "./components/tab-journey";
import { TabWorks } from "./components/tab-works";
import { TabExpertise } from "./components/tab-expertise";
import { TabCredentials } from "./components/tab-credentials";
import { TabContent } from "./components/tab-content";
import { TabMedia } from "./components/tab-media";
import { TabAppearance } from "./components/tab-appearance";

export type AdminTabKey =
  | "general"
  | "journey"
  | "works"
  | "expertise"
  | "credentials"
  | "content"
  | "media"
  | "appearance";

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
  const [status, setStatus] = useState<string>("");
  const [tab, setTab] = useState<AdminTabKey>("appearance");
  const [cloudStatus, setCloudStatus] = useState<{ r2: boolean; supabase: boolean } | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [previewCvRole, setPreviewCvRole] = useState<RoleKey | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const config = draft ?? storedConfig;
  const hasUnsavedChanges = draft !== null;

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
    setStatus("Memeriksa dan memproses berkas...");
    try {
      let fileToUpload = file;
      const isPngOrJpg =
        file.type === "image/png" || file.type === "image/jpeg" || /\.(png|jpe?g)$/i.test(file.name);
      if (isPngOrJpg) {
        setStatus("Mengonversi PNG/JPG ke WebP...");
        fileToUpload = await convertImageToWebP(file);
      }

      setStatus("Mengunggah berkas WebP...");
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(`Unggah gagal: ${data.error || "Terjadi kesalahan"}`);
        return;
      }

      callback(data.url);
      setStatus(
        data.provider === "r2"
          ? "Berkas WebP berhasil disimpan ke Cloudflare R2"
          : "Berkas disimpan sebagai data URI"
      );
    } catch (err) {
      setStatus(`Unggah gagal: ${err instanceof Error ? err.message : "Koneksi terputus"}`);
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSave = async () => {
    // 1. Validate payload schema
    const validation = validateSiteConfigPayload(config);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setStatus(`Gagal validasi: ${validation.errors[0]}`);
      return;
    }
    setValidationErrors([]);
    setIsSaving(true);
    setStatus("Menyimpan konfigurasi...");

    try {
      // 2. Local persistence
      writeConfig(config);

      // 3. Supabase Cloud persistence
      if (cloudStatus?.supabase) {
        const res = await saveCloudConfig(config);
        if (res.success) {
          setStatus("Tersimpan permanen di Supabase Cloud & Lokal");
          setDraft(null);
        } else {
          setStatus(`Tersimpan lokal (${res.message || "Gagal sinkron cloud"})`);
        }
      } else {
        setStatus("Tersimpan sebagai draft lokal (Supabase belum terkonfigurasi)");
        setDraft(null);
      }
    } catch (err) {
      setStatus(`Gagal menyimpan: ${err instanceof Error ? err.message : "Kesalahan sistem"}`);
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

  const tabs: { key: AdminTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "appearance", label: "Tampilan 3D & Hero", icon: Sparkles },
    { key: "works", label: "Proyek", icon: FolderGit2 },
    { key: "general", label: "Profil & Identitas", icon: User },
    { key: "journey", label: "Edukasi & Karir", icon: GraduationCap },
    { key: "expertise", label: "Keahlian & Layanan", icon: Wrench },
    { key: "credentials", label: "Sertifikat & CV", icon: Award },
    { key: "content", label: "FAQ & Blog", icon: HelpCircle },
    { key: "media", label: "Pustaka Media & SEO", icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink transition-colors selection:bg-brand/10 selection:text-brand">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-line/60 bg-white/90 backdrop-blur-md dark:border-line/40 dark:bg-[#0c0e17]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/50 px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface hover:text-ink dark:border-line/40"
              title="Lihat Situs Publik"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Lihat Web</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-sm font-bold text-ink sm:text-base">CMS ZekkTech Studio (Panel Admin)</h1>
                {hasUnsavedChanges && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Ada Draf Belum Disimpan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted truncate max-w-[260px] sm:max-w-none">
                {userEmail ? `Login: ${userEmail}` : "Mode Admin"} • Supabase:{" "}
                <span className={cloudStatus?.supabase ? "text-emerald-600 font-semibold" : "text-amber-600"}>
                  {cloudStatus?.supabase ? "Terhubung" : "Lokal"}
                </span>{" "}
                • R2:{" "}
                <span className={cloudStatus?.r2 ? "text-emerald-600 font-semibold" : "text-slate-500"}>
                  {cloudStatus?.r2 ? "Aktif" : "DataURI"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={pullFromCloud}
              disabled={syncingCloud}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/60 px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface hover:text-ink disabled:opacity-50 dark:border-line/40 dark:bg-slate-900/60"
            >
              <CloudDownload className="size-3.5 text-brand" />
              <span>{syncingCloud ? "Menyinkronkan..." : "Tarik Cloud"}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/60 px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface hover:text-ink dark:border-line/40 dark:bg-slate-900/60"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand/90 disabled:opacity-50"
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
              className="inline-flex size-8 items-center justify-center rounded-xl border border-line text-muted transition hover:bg-rose-50 hover:text-rose-600 dark:border-line/40 dark:hover:bg-rose-950/20"
              title="Keluar (Logout)"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Validation Errors Banner */}
        {validationErrors.length > 0 && (
          <div className="border-t border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-700 dark:text-rose-300">
            <div className="mx-auto flex max-w-7xl items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <div className="flex-1">
                <span className="font-bold">Perbaiki kesalahan berikut sebelum menyimpan:</span>{" "}
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
      </main>

      {/* CV Preview Modal */}
      {previewCvRole && (
        <CvPreviewModal
          isOpen={true}
          initialRole={previewCvRole}
          onClose={() => setPreviewCvRole(null)}
        />
      )}
    </div>
  );
}
