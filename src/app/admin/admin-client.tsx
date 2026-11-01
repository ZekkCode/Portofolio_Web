"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Lanyard from "@/components/lanyard";
import ProfileCard from "@/components/profile-card";
import {
  normalizeConfig,
  resetConfig,
  saveCloudConfig,
  useSiteConfig,
  writeConfig,
  type LanyardConfig,
  type ProfileCardConfig,
  type Project,
  type CvDocConfig,
  type EducationItem,
  type AcademicProject,
  type SiteConfig,
} from "@/lib/site-store";
import CvPreviewModal, { type RoleKey } from "@/components/cv-preview-modal";
import { ArrowLeft, FileText, LogOut, GraduationCap, School, Upload, Trash2, ChevronUp, ChevronDown, Plus, ExternalLink } from "lucide-react";

type FieldKind = "range" | "select" | "color" | "toggle" | "image";

type Field = {
  key: keyof LanyardConfig;
  label: string;
  kind: FieldKind;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: readonly string[];
};

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Gambar",
    fields: [
      { key: "frontImage", label: "Gambar depan", kind: "image", hint: "Rasio kartu ≈ 0.71 (mis. 640×900). PNG/JPG otomatis dikonversi ke WebP." },
      { key: "backImage", label: "Gambar belakang", kind: "image", hint: "Kosong = pakai gambar depan. PNG/JPG otomatis dikonversi ke WebP." },
      { key: "strapImage", label: "Gambar tali", kind: "image", hint: "Gambar lebar, diulang sepanjang tali. PNG/JPG otomatis dikonversi ke WebP." },
      { key: "imageFit", label: "Image fit", kind: "select", options: ["cover", "contain"] },
    ],
  },
  {
    title: "Kartu",
    fields: [
      { key: "orientation", label: "Orientasi", kind: "select", options: ["portrait", "landscape"] },
      { key: "finish", label: "Finishing", kind: "select", options: ["glossy", "matte", "holographic", "metallic"] },
      { key: "cardColor", label: "Warna kartu", kind: "color" },
      { key: "cornerRadius", label: "Sudut membulat", kind: "range", min: 0, max: 1, step: 0.01 },
      { key: "size", label: "Ukuran kartu", kind: "range", min: 0.15, max: 0.9, step: 0.01 },
    ],
  },
  {
    title: "Tali & logam",
    fields: [
      { key: "anchor", label: "Posisi gantung", kind: "select", options: ["left", "center", "right"] },
      { key: "strapLength", label: "Panjang tali", kind: "range", min: 0, max: 1, step: 0.01 },
      { key: "strapWidth", label: "Lebar tali", kind: "range", min: 0.4, max: 2, step: 0.01 },
      { key: "strapColor", label: "Warna tali", kind: "color" },
      { key: "metal", label: "Metal klip", kind: "select", options: ["silver", "gold", "graphite"] },
    ],
  },
  {
    title: "Fisika",
    fields: [
      { key: "gravity", label: "Gravitasi", kind: "range", min: 0, max: 3, step: 0.05 },
      { key: "damping", label: "Redaman", kind: "range", min: 0, max: 1, step: 0.01 },
      { key: "elasticity", label: "Elastisitas", kind: "range", min: 0, max: 1, step: 0.01 },
      { key: "breeze", label: "Angin", kind: "range", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: "Interaksi",
    fields: [
      { key: "interactive", label: "Bisa di-drag & diklik untuk flip", kind: "toggle" },
      { key: "intro", label: "Animasi masuk saat dibuka", kind: "toggle" },
    ],
  },
];

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-line/60 dark:bg-[#151928]";

/**
 * Konversi gambar raster (PNG, JPG, JPEG) ke format WebP terkompresi
 * langsung di sisi klien menggunakan HTML5 Canvas.
 */
async function convertImageToWebP(file: File, quality = 0.92): Promise<File> {
  if (file.type === "image/webp") return file;
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
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
            const cleanName = file.name.replace(/\.[^/.]+$/, "");
            const webpFile = new File([blob], `${cleanName}.webp`, {
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

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
export default function AdminClient({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const storedConfig = useSiteConfig();
  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const [status, setStatus] = useState<string>("");
  const [tab, setTab] = useState<"lanyard" | "profileCard" | "proyek" | "cv" | "education">("lanyard");
  const [cloudStatus, setCloudStatus] = useState<{ r2: boolean; supabase: boolean } | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [previewCvRole, setPreviewCvRole] = useState<RoleKey | null>(null);

  const config = draft ?? storedConfig;

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
      // Konversi otomatis file PNG/JPG ke format WebP
      let fileToUpload = file;
      const isPngOrJpg = file.type === "image/png" || file.type === "image/jpeg" || /\.(png|jpe?g)$/i.test(file.name);
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

  const update = <K extends keyof LanyardConfig>(key: K, value: LanyardConfig[K]) => {
    setDraft({ ...config, lanyard: { ...config.lanyard, [key]: value } });
    setStatus("Draft diubah");
  };

  const updateProfileCard = <K extends keyof ProfileCardConfig>(key: K, value: ProfileCardConfig[K]) => {
    setDraft({ ...config, profileCard: { ...config.profileCard, [key]: value } });
    setStatus("Draft Profile Card diubah");
  };

  const addProject = () => {
    const newProj: Project = {
      id: "project-" + Date.now(),
      title: "Proyek Baru",
      desc: "Deskripsi singkat mengenai proyek...",
      image: "/profile.webp",
      previewUrl: "",
      repo: "",
      tags: ["Next.js", "TypeScript"],
      role: "Frontend Developer",
      problem: "",
      highlight: "",
      outcome: "",
    };
    setDraft({ ...config, projects: [newProj, ...config.projects] });
    setStatus("Proyek baru ditambahkan ke draft");
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setDraft({
      ...config,
      projects: config.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
    setStatus("Proyek diperbarui di draft");
  };

  const deleteProject = (id: string) => {
    setDraft({
      ...config,
      projects: config.projects.filter((p) => p.id !== id),
    });
    setStatus("Proyek dihapus dari draft");
  };

  
  const addEducation = () => {
    const curYear = new Date().getFullYear();
    const newEdu: EducationItem = {
      id: "edu-" + Date.now(),
      institution: "Nama Institusi",
      location: "Kota, Negara",
      program: "Program / Jurusan",
      degree: "S1 / SMK",
      period: `${curYear} — Sekarang`,
      startYear: curYear,
      endYear: null,
      status: "Mahasiswa Aktif",
      current: true,
      desc: "Deskripsi pengalaman akademik, fokus kajian, dan pencapaian...",
      focus: ["Fokus Utama"],
      projects: [],
      website: "",
      logo: "",
    };
    setDraft({ ...config, education: [...(config.education || []), newEdu] });
    setStatus("Institusi pendidikan baru ditambahkan ke draft");
  };

  const updateEducation = (id: string, updates: Partial<EducationItem>) => {
    setDraft({
      ...config,
      education: (config.education || []).map((edu) => (edu.id === id ? { ...edu, ...updates } : edu)),
    });
    setStatus("Data jejak akademik diperbarui");
  };

  const deleteEducation = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus data institusi pendidikan ini?")) return;
    setDraft({
      ...config,
      education: (config.education || []).filter((edu) => edu.id !== id),
    });
    setStatus("Institusi pendidikan dihapus dari draft");
  };

  const moveEducation = (id: string, direction: "up" | "down") => {
    const list = [...(config.education || [])];
    const index = list.findIndex((e) => e.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, education: list });
    setStatus("Urutan jejak akademik diubah");
  };

  const addAcademicProject = (eduId: string) => {
    const newProj: AcademicProject = {
      title: "Proyek Akademik Baru",
      desc: "Penjelasan proyek atau riset...",
      repo: "",
      url: "",
    };
    const edu = (config.education || []).find((e) => e.id === eduId);
    if (!edu) return;
    updateEducation(eduId, { projects: [...(edu.projects || []), newProj] });
  };

  const updateAcademicProject = (eduId: string, pIdx: number, updates: Partial<AcademicProject>) => {
    const edu = (config.education || []).find((e) => e.id === eduId);
    if (!edu) return;
    const projs = [...(edu.projects || [])];
    projs[pIdx] = { ...projs[pIdx], ...updates };
    updateEducation(eduId, { projects: projs });
  };

  const deleteAcademicProject = (eduId: string, pIdx: number) => {
    const edu = (config.education || []).find((e) => e.id === eduId);
    if (!edu) return;
    const projs = [...(edu.projects || [])].filter((_, i) => i !== pIdx);
    updateEducation(eduId, { projects: projs });
  };

  const updateCvDoc = (roleKey: Exclude<RoleKey, "all">, updates: Partial<CvDocConfig>) => {
    const existing = config.cvDocs.find((d) => d.roleKey === roleKey);
    let newDocs = [...config.cvDocs];
    if (existing) {
      newDocs = newDocs.map((d) => (d.roleKey === roleKey ? { ...d, ...updates } : d));
    } else {
      newDocs.push({
        id: roleKey,
        roleKey,
        title: "",
        subtitle: "",
        color: "#1b45c4",
        pdfUrl: "",
        pages: [],
        ...updates,
      });
    }
    setDraft({ ...config, cvDocs: newDocs });
    setStatus(`CV Dokumen (${roleKey}) diperbarui di draft`);
  };

  const save = async () => {
    writeConfig(config);
    if (cloudStatus?.supabase) {
      setStatus("Menyimpan ke Supabase Cloud...");
      const res = await saveCloudConfig(config);
      if (res.success) {
        setStatus("Tersimpan di Browser & Supabase Cloud");
      } else {
        setStatus(`Tersimpan lokal (${res.message || "Gagal sinkron cloud"})`);
      }
    } else {
      setStatus("Tersimpan sebagai draft lokal (Supabase belum aktif di server)");
    }
  };

  const pullFromCloud = async () => {
    setSyncingCloud(true);
    setStatus("Mengambil data dari Supabase...");
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      const data = await res.json();
      if (data.configured && data.config) {
        setDraft(normalizeConfig(data.config));
        writeConfig(normalizeConfig(data.config));
        setStatus("Konfigurasi Supabase berhasil disinkronkan");
      } else {
        setStatus(data.message || "Belum ada konfigurasi di cloud");
      }
    } catch {
      setStatus("Gagal terhubung ke API cloud");
    } finally {
      setSyncingCloud(false);
    }
  };

  const reset = () => {
    resetConfig();
    setDraft(null);
    setStatus("Kembali ke default");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "site-config.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("JSON diekspor");
  };

  const importJson = async (file: File) => {
    try {
      setDraft(normalizeConfig(JSON.parse(await file.text())));
      setStatus("JSON dimuat, klik Simpan");
    } catch {
      setStatus("File JSON tidak valid");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#08090e]">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md dark:border-line/40 dark:bg-[#0c0e17]/95">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-body hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ArrowLeft className="size-3.5" />
              <span>Portofolio</span>
            </Link>
            <span className="h-4 w-px bg-line" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                Panel Admin
              </span>
              {userEmail && (
                <span className="hidden sm:inline text-[11px] font-mono text-muted">
                  ({userEmail})
                </span>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 ml-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                  cloudStatus?.r2
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    cloudStatus?.r2 ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {cloudStatus?.r2 ? "R2 Storage Aktif" : "R2 Offline (Lokal)"}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                  cloudStatus?.supabase
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    cloudStatus?.supabase ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {cloudStatus?.supabase ? "Supabase DB Aktif" : "Supabase Offline (Lokal)"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {cloudStatus?.supabase && (
              <button
                type="button"
                onClick={pullFromCloud}
                disabled={syncingCloud}
                className="min-h-[36px] rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink hover:border-brand/50"
              >
                {syncingCloud ? "Menyinkronkan..." : "Tarik Cloud"}
              </button>
            )}
            <button
              type="button"
              onClick={exportJson}
              className="min-h-[36px] rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink hover:border-brand/50"
            >
              Ekspor
            </button>
            <label className="min-h-[36px] inline-flex items-center cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink hover:border-brand/50">
              Impor
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void importJson(file);
                }}
              />
            </label>
            <button
              type="button"
              onClick={reset}
              className="min-h-[36px] rounded-full border border-line px-3 py-1 text-xs font-semibold text-body hover:border-red-300 hover:text-red-600"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={save}
              className="min-h-[36px] rounded-full bg-brand px-4 py-1 text-xs font-semibold text-white shadow-md hover:bg-brand-ink"
            >
              Simpan
            </button>

            {/* Tombol Logout Aman */}
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari Panel Admin"
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 dark:border-line/40 dark:hover:bg-red-950/30"
            >
              <LogOut className="size-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(["lanyard", "profileCard", "proyek", "cv", "education"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`min-h-[40px] shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                tab === item
                  ? "bg-ink text-white dark:bg-white dark:text-ink"
                  : "border border-line text-body hover:border-ink/30 hover:text-ink dark:border-line/40"
              }`}
            >
              {item === "lanyard"
                ? "Lanyard"
                : item === "profileCard"
                ? "Header & Profile Card"
                : item === "proyek"
                ? "Proyek"
                : item === "cv"
                ? "Berkas CV / PDF"
                : "Jejak Akademik"}
            </button>
          ))}
          {status && <span className="ml-2 text-xs font-medium text-brand">{status}</span>}
        </div>

        {tab === "lanyard" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-5">
              {GROUPS.map((group) => (
                <section key={group.title} className="rounded-2xl border border-line bg-white/85 p-5 dark:border-line/40 dark:bg-[#111422]">
                  <h2 className="font-display text-sm uppercase tracking-[0.08em] text-ink">{group.title}</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {group.fields.map((field) => {
                      const value = config.lanyard[field.key];
                      return (
                        <div key={field.key} className={field.kind === "image" ? "sm:col-span-2" : ""}>
                          <div className="flex items-center justify-between text-xs text-body">
                            <label htmlFor={`field-${field.key}`} className="font-medium">{field.label}</label>
                            {field.kind === "range" && (
                              <span className="font-mono text-ink">
                                {typeof value === "number" ? value.toFixed(2) : String(value)}
                              </span>
                            )}
                          </div>
                          {field.kind === "range" && (
                            <input
                              id={`field-${field.key}`}
                              type="range"
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              value={Number(value ?? 0)}
                              onChange={(event) => update(field.key, Number(event.target.value))}
                              className="mt-2 w-full accent-brand"
                            />
                          )}
                          {field.kind === "select" && (
                            <select
                              id={`field-${field.key}`}
                              value={String(value ?? "")}
                              onChange={(event) => update(field.key, event.target.value as never)}
                              className={`mt-2 ${inputClass}`}
                            >
                              {field.options?.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                          {field.kind === "color" && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                id={`field-${field.key}`}
                                type="color"
                                value={String(value ?? "#000000")}
                                onChange={(event) => update(field.key, event.target.value as never)}
                                className="h-9 w-12 cursor-pointer rounded-lg border border-line bg-white p-1"
                              />
                              <input
                                type="text"
                                value={String(value ?? "")}
                                onChange={(event) => update(field.key, event.target.value as never)}
                                className={inputClass}
                              />
                            </div>
                          )}
                          {field.kind === "toggle" && (
                            <button
                              id={`field-${field.key}`}
                              type="button"
                              onClick={() => update(field.key, !value as never)}
                              className={`mt-2 flex h-9 items-center rounded-lg border px-3 text-xs font-semibold ${
                                value
                                  ? "border-brand bg-brand/10 text-brand"
                                  : "border-line text-body hover:text-ink"
                              }`}
                            >
                              {value ? "Aktif" : "Nonaktif"}
                            </button>
                          )}
                          {field.kind === "image" && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                placeholder="/path/ke/gambar.webp"
                                value={String(value ?? "")}
                                onChange={(event) => update(field.key, event.target.value as never)}
                                className={`flex-1 ${inputClass}`}
                              />
                              <label className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-brand/50 dark:bg-slate-900">
                                {uploadingImage === field.key ? "Mengunggah..." : "Pilih File"}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/*"
                                  className="hidden"
                                  onChange={async (event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;
                                    await uploadAndSet(
                                      file,
                                      "lanyard",
                                      (url) => update(field.key, url as never),
                                      field.key
                                    );
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="sticky top-24 self-start rounded-2xl border border-line bg-white/85 p-4 dark:border-line/40 dark:bg-[#111422]">
              <h3 className="font-display text-xs uppercase tracking-wider text-muted">Pratinjau Lanyard</h3>
              <div className="mt-3 aspect-square overflow-hidden rounded-xl bg-slate-900/5 dark:bg-black/40">
                <Lanyard {...config.lanyard} />
              </div>
            </div>
          </div>
        ) : tab === "profileCard" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-line bg-white/85 p-5 dark:border-line/40 dark:bg-[#111422]">
                <h2 className="font-display text-sm uppercase tracking-[0.08em] text-ink">Identitas & Teks</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-body">Nama Lengkap</label>
                    <input
                      type="text"
                      value={config.profileCard.name}
                      onChange={(e) => updateProfileCard("name", e.target.value)}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-body">Judul / Peran</label>
                    <input
                      type="text"
                      value={config.profileCard.title}
                      onChange={(e) => updateProfileCard("title", e.target.value)}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-body">Handle Sosial</label>
                    <input
                      type="text"
                      value={config.profileCard.handle}
                      onChange={(e) => updateProfileCard("handle", e.target.value)}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-body">Status Aktivitas</label>
                    <input
                      type="text"
                      value={config.profileCard.status}
                      onChange={(e) => updateProfileCard("status", e.target.value)}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="sticky top-24 self-start rounded-2xl border border-line bg-white/85 p-4 dark:border-line/40 dark:bg-[#111422]">
              <h3 className="font-display text-xs uppercase tracking-wider text-muted">Pratinjau Kartu</h3>
              <div className="mt-3 flex items-center justify-center p-4">
                <ProfileCard {...config.profileCard} />
              </div>
            </div>
          </div>
        ) : tab === "proyek" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Koleksi Proyek Portofolio</h2>
                <p className="text-xs text-body">Kelola proyek yang ditampilkan di grid halaman utama</p>
              </div>
              <button
                type="button"
                onClick={addProject}
                className="min-h-[40px] rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-ink"
              >
                + Tambah proyek
              </button>
            </div>

            <div className="grid gap-4">
              {config.projects.map((proj, idx) => (
                <div key={proj.id} className="rounded-2xl border border-line bg-white p-5 dark:border-line/40 dark:bg-[#111422]">
                  <div className="flex items-center justify-between border-b border-line/60 pb-3 dark:border-line/40">
                    <span className="font-mono text-xs font-bold text-brand">#{idx + 1} — {proj.id}</span>
                    <button
                      type="button"
                      onClick={() => deleteProject(proj.id)}
                      className="min-h-[32px] px-2 text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-body">
                      Judul
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                    <label className="block text-xs font-semibold text-body">
                      Peran Anda
                      <input
                        type="text"
                        value={proj.role || ""}
                        onChange={(e) => updateProject(proj.id, { role: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-body">
                        Deskripsi Ringkas
                        <textarea
                        value={proj.desc}
                        onChange={(e) => updateProject(proj.id, { desc: e.target.value })}
                        rows={2}
                        className={`mt-1 ${inputClass}`}
                      />
                      </label>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-body">Tautan Live (URL)</label>
                      <input
                        type="url"
                        value={proj.previewUrl || ""}
                        onChange={(e) => updateProject(proj.id, { previewUrl: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-body">Tautan Repository (GitHub)</label>
                      <input
                        type="url"
                        value={proj.repo || ""}
                        onChange={(e) => updateProject(proj.id, { repo: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : tab === "cv" ? (
          <div className="space-y-6">
            <h2 className="font-display text-base font-bold text-ink">Berkas CV & Dokumen PDF</h2>
            <p className="text-xs text-body">Kelola lembar ATS PDF dan render halaman resolusi tinggi</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["graphic", "uiux", "frontend", "itsupport"] as const).map((role) => {
                const doc = config.cvDocs.find((d) => d.roleKey === role);
                return (
                  <div key={role} className="rounded-2xl border border-line bg-white p-5 dark:border-line/40 dark:bg-[#111422]">
                    <h3 className="font-bold text-ink uppercase text-xs tracking-wider">Peran: {role}</h3>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="text-xs text-body">URL Berkas PDF</label>
                        <input
                          type="text"
                          value={doc?.pdfUrl || ""}
                          onChange={(e) => updateCvDoc(role, { pdfUrl: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                          placeholder="/cv-ats-zakariamp-2025.pdf"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewCvRole(role)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                      >
                        <FileText className="size-3.5" />
                        <span>Pratinjau Dokumen</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Jejak Akademik & Logo Pendidikan</h2>
                <p className="text-xs text-body">Kelola riwayat pendidikan, logo institusi, dan proyek akademik di timeline portofolio</p>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-ink transition"
              >
                <Plus className="size-3.5" />
                <span>Tambah Institusi</span>
              </button>
            </div>

            <div className="grid gap-5">
              {(config.education || []).map((edu, idx) => (
                <div key={edu.id} className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#111422]">
                  {/* Top Bar: Order, Name, Reorder & Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3 dark:border-line/40">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                      <span className="font-display text-sm font-bold text-ink">{edu.institution}</span>
                      {edu.current && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveEducation(edu.id, "up")}
                        disabled={idx === 0}
                        title="Geser ke Atas"
                        className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEducation(edu.id, "down")}
                        disabled={idx === (config.education?.length || 1) - 1}
                        title="Geser ke Bawah"
                        className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEducation(edu.id)}
                        className="inline-flex min-h-[28px] items-center gap-1 px-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg dark:hover:bg-red-950/30 transition"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Education Fields */}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="text-xs font-medium text-body">Nama Institusi</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-body">Program / Jurusan</label>
                      <input
                        type="text"
                        value={edu.program}
                        onChange={(e) => updateEducation(edu.id, { program: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-body">Jenjang / Gelar</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                        placeholder="S1 Teknik Informatika / SMK Multimedia"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-body">Lokasi</label>
                      <input
                        type="text"
                        value={edu.location}
                        onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                        placeholder="Bangkalan, Madura"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-body">Tahun Mulai</label>
                      <input
                        type="number"
                        value={edu.startYear}
                        onChange={(e) => updateEducation(edu.id, { startYear: parseInt(e.target.value, 10) || 2024 })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-body">Tahun Selesai</label>
                      <input
                        type="number"
                        value={edu.endYear ?? ""}
                        placeholder="Kosongkan jika masih studi"
                        onChange={(e) =>
                          updateEducation(edu.id, {
                            endYear: e.target.value ? parseInt(e.target.value, 10) : null,
                            current: !e.target.value,
                          })
                        }
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`current-${edu.id}`}
                        checked={Boolean(edu.current)}
                        onChange={(e) =>
                          updateEducation(edu.id, {
                            current: e.target.checked,
                            endYear: e.target.checked ? null : edu.endYear,
                          })
                        }
                        className="size-4 rounded border-line text-brand focus:ring-brand"
                      />
                      <label htmlFor={`current-${edu.id}`} className="text-xs font-medium text-body cursor-pointer select-none">
                        Masih aktif studi saat ini (status Sekarang / Present)
                      </label>
                    </div>
                  </div>

                  {/* Logo Management */}
                  <div className="mt-4 rounded-xl border border-line/60 bg-surface/50 p-3.5 dark:border-line/30 dark:bg-slate-900/40">
                    <span className="text-xs font-semibold text-ink">Logo Institusi Resmi</span>
                    <div className="mt-2.5 flex flex-wrap items-center gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-line bg-white shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
                        {edu.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={edu.logo} alt={edu.institution} className="size-11 object-contain" />
                        ) : (
                          <School className="size-6 text-muted" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-surface cursor-pointer dark:border-line/40 dark:bg-[#151928] transition">
                          <Upload className="size-3.5 text-brand" />
                          <span>{uploadingImage === `edu-logo-${edu.id}` ? "Memproses..." : "Unggah Logo (PNG/JPG/WebP)"}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                void uploadAndSet(
                                  f,
                                  "education",
                                  (url) => updateEducation(edu.id, { logo: url }),
                                  `edu-logo-${edu.id}`
                                );
                              }
                            }}
                          />
                        </label>
                        {edu.logo && (
                          <button
                            type="button"
                            onClick={() => updateEducation(edu.id, { logo: "" })}
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-body hover:text-red-600 hover:bg-red-50 dark:border-line/40 dark:hover:bg-red-950/20 transition"
                          >
                            Hapus Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description, Focus, and Website */}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-body">Deskripsi Perjalanan & Ringkasan Studi</label>
                      <textarea
                        value={edu.desc}
                        onChange={(e) => updateEducation(edu.id, { desc: e.target.value })}
                        rows={2}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-body">Fokus Studi & Kompetensi (pisahkan dengan koma)</label>
                      <input
                        type="text"
                        value={(edu.focus || []).join(", ")}
                        onChange={(e) =>
                          updateEducation(edu.id, {
                            focus: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Rekayasa Perangkat Lunak, UI/UX, dsb."
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-body">Situs Web Institusi (URL)</label>
                      <input
                        type="url"
                        value={edu.website || ""}
                        onChange={(e) => updateEducation(edu.id, { website: e.target.value })}
                        placeholder="https://www.trunojoyo.ac.id"
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                  </div>

                  {/* Sub-Editor: Academic Projects */}
                  <div className="mt-4 border-t border-line/60 pt-3 dark:border-line/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-ink">Proyek Akademik Terkait ({edu.projects?.length || 0})</span>
                      <button
                        type="button"
                        onClick={() => addAcademicProject(edu.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                      >
                        <Plus className="size-3" />
                        <span>Tambah Proyek Akademik</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(edu.projects || []).map((proj, pIdx) => (
                        <div key={pIdx} className="rounded-xl border border-line/70 bg-surface/30 p-3 text-xs dark:border-line/30 dark:bg-slate-900/30">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              type="text"
                              value={proj.title}
                              onChange={(e) => updateAcademicProject(edu.id, pIdx, { title: e.target.value })}
                              placeholder="Judul Proyek Akademik"
                              className={inputClass}
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="url"
                                value={proj.repo || ""}
                                onChange={(e) => updateAcademicProject(edu.id, pIdx, { repo: e.target.value })}
                                placeholder="URL GitHub Repo (opsional)"
                                className={inputClass}
                              />
                              <button
                                type="button"
                                onClick={() => deleteAcademicProject(edu.id, pIdx)}
                                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={proj.desc}
                            onChange={(e) => updateAcademicProject(edu.id, pIdx, { desc: e.target.value })}
                            placeholder="Deskripsi singkat proyek..."
                            className={`mt-2 ${inputClass}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

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
