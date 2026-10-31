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
  type SiteConfig,
} from "@/lib/site-store";
import CvPreviewModal, { type RoleKey } from "@/components/cv-preview-modal";
import { ArrowLeft, FileText, LogOut } from "lucide-react";

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
  const [tab, setTab] = useState<"lanyard" | "profileCard" | "proyek" | "cv">("lanyard");
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
          {(["lanyard", "profileCard", "proyek", "cv"] as const).map((item) => (
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
                : "Berkas CV / PDF"}
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
        ) : (
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
