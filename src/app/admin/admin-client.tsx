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
  type ExperienceItem,
  type CertificateItem,
  type SiteConfig,
} from "@/lib/site-store";
import CvPreviewModal, { type RoleKey } from "@/components/cv-preview-modal";
import {
  ArrowLeft,
  FileText,
  LogOut,
  GraduationCap,
  School,
  Upload,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Briefcase,
  Award,
  FolderGit2,
  ImageIcon,
} from "lucide-react";

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
      { key: "cardColor", label: "Warna kartu", kind: "color" },
      { key: "orientation", label: "Orientasi", kind: "select", options: ["portrait", "landscape"] },
      { key: "finish", label: "Finishing", kind: "select", options: ["glossy", "matte", "holographic", "metallic"] },
      { key: "metal", label: "Warna klip logam", kind: "select", options: ["graphite", "silver", "gold"] },
      { key: "cornerRadius", label: "Corner radius", kind: "range", min: 0.05, max: 0.8, step: 0.01 },
      { key: "size", label: "Ukuran kartu", kind: "range", min: 0.2, max: 0.8, step: 0.01 },
      { key: "anchor", label: "Posisi gantung", kind: "select", options: ["left", "center", "right"] },
    ],
  },
  {
    title: "Tali",
    fields: [
      { key: "strapColor", label: "Warna tali", kind: "color" },
      { key: "strapLength", label: "Panjang tali", kind: "range", min: 0.2, max: 1.5, step: 0.01 },
      { key: "strapWidth", label: "Lebar tali", kind: "range", min: 0.3, max: 1.5, step: 0.01 },
    ],
  },
  {
    title: "Fisika & Interaksi",
    fields: [
      { key: "gravity", label: "Gravitasi", kind: "range", min: 0, max: 3, step: 0.05 },
      { key: "damping", label: "Damping (redaman)", kind: "range", min: 0.05, max: 0.95, step: 0.01 },
      { key: "elasticity", label: "Elastisitas", kind: "range", min: 0.05, max: 0.95, step: 0.01 },
      { key: "breeze", label: "Angin sepoi", kind: "range", min: 0, max: 1, step: 0.02 },
      { key: "interactive", label: "Bisa ditarik kursor", kind: "toggle" },
      { key: "intro", label: "Animasi jatuh awal", kind: "toggle" },
    ],
  },
];

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

type TabKey = "lanyard" | "profileCard" | "proyek" | "experience" | "education" | "certificates" | "cv";

export default function AdminClient({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const storedConfig = useSiteConfig();
  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const [status, setStatus] = useState<string>("");
  const [tab, setTab] = useState<TabKey>("lanyard");
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

  const update = <K extends keyof LanyardConfig>(key: K, value: LanyardConfig[K]) => {
    setDraft({ ...config, lanyard: { ...config.lanyard, [key]: value } });
    setStatus("Draft Lanyard diubah");
  };

  const updateProfileCard = <K extends keyof ProfileCardConfig>(key: K, value: ProfileCardConfig[K]) => {
    setDraft({ ...config, profileCard: { ...config.profileCard, [key]: value } });
    setStatus("Draft Profile Card diubah");
  };

  // ===================== PROYEK CRUD =====================
  const addProject = () => {
    const newProj: Project = {
      id: "project-" + Date.now(),
      title: "Proyek Baru",
      desc: "Deskripsi ringkas mengenai tujuan, fitur, dan arsitektur proyek...",
      image: "",
      previewUrl: "",
      repo: "",
      tags: ["Next.js", "TypeScript", "Tailwind CSS"],
      role: "Frontend Developer",
      problem: "",
      highlight: "",
      outcome: "",
    };
    setDraft({ ...config, projects: [newProj, ...config.projects] });
    setStatus("Proyek baru ditambahkan");
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setDraft({
      ...config,
      projects: config.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
    setStatus("Proyek diperbarui");
  };

  const deleteProject = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus proyek ini dari portofolio?")) return;
    setDraft({
      ...config,
      projects: config.projects.filter((p) => p.id !== id),
    });
    setStatus("Proyek dihapus");
  };

  const moveProject = (id: string, direction: "up" | "down") => {
    const list = [...config.projects];
    const index = list.findIndex((p) => p.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, projects: list });
    setStatus("Urutan proyek diubah");
  };

  // ===================== EXPERIENCE CRUD =====================
  const addExperience = () => {
    const newExp: ExperienceItem = {
      id: "exp-" + Date.now(),
      role: "Nama Jabatan / Peran",
      org: "Nama Organisasi / Komunitas",
      place: "Bangkalan / Mojokerto",
      period: "2024 — Sekarang",
      desc: "Deskripsi kepemimpinan divisi, perancangan aset visual, dokumentasi, dan pengelolaan program...",
    };
    setDraft({ ...config, experience: [...(config.experience || []), newExp] });
    setStatus("Pengalaman organisasi baru ditambahkan");
  };

  const updateExperience = (id: string, updates: Partial<ExperienceItem>) => {
    setDraft({
      ...config,
      experience: (config.experience || []).map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)),
    });
    setStatus("Data pengalaman diperbarui");
  };

  const deleteExperience = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus riwayat pengalaman organisasi ini?")) return;
    setDraft({
      ...config,
      experience: (config.experience || []).filter((exp) => exp.id !== id),
    });
    setStatus("Pengalaman organisasi dihapus");
  };

  const moveExperience = (id: string, direction: "up" | "down") => {
    const list = [...(config.experience || [])];
    const index = list.findIndex((e) => e.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, experience: list });
    setStatus("Urutan pengalaman diubah");
  };

  // ===================== EDUCATION CRUD =====================
  const addEducation = () => {
    const curYear = new Date().getFullYear();
    const newEdu: EducationItem = {
      id: "edu-" + Date.now(),
      institution: "Nama Institusi Pendidikan",
      location: "Kota, Provinsi",
      program: "Program Studi / Jurusan",
      degree: "S1 Teknik Informatika / SMK Multimedia",
      period: `${curYear} — Sekarang`,
      startYear: curYear,
      endYear: null,
      status: "Mahasiswa Aktif",
      current: true,
      desc: "Fokus studi keilmuan, rekayasa perangkat lunak, dan eksplorasi teknologi...",
      focus: ["Rekayasa Web", "Algoritma"],
      projects: [],
      website: "",
      logo: "",
    };
    setDraft({ ...config, education: [...(config.education || []), newEdu] });
    setStatus("Institusi pendidikan baru ditambahkan");
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
    setStatus("Institusi pendidikan dihapus");
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

  // ===================== CERTIFICATES CRUD =====================
  const addCertificate = () => {
    const curYear = new Date().getFullYear();
    const newCert: CertificateItem = {
      id: "cert-" + Date.now(),
      title: "Nama Sertifikat / Kredensial",
      issuer: "Lembaga Penerbit Resmi",
      date: `${curYear}`,
      credentialUrl: "",
      category: "design",
    };
    setDraft({ ...config, certificates: [...(config.certificates || []), newCert] });
    setStatus("Sertifikat baru ditambahkan");
  };

  const updateCertificate = (id: string, updates: Partial<CertificateItem>) => {
    setDraft({
      ...config,
      certificates: (config.certificates || []).map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
    setStatus("Data sertifikat diperbarui");
  };

  const deleteCertificate = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus sertifikat ini?")) return;
    setDraft({
      ...config,
      certificates: (config.certificates || []).filter((c) => c.id !== id),
    });
    setStatus("Sertifikat dihapus");
  };

  const moveCertificate = (id: string, direction: "up" | "down") => {
    const list = [...(config.certificates || [])];
    const index = list.findIndex((c) => c.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, certificates: list });
    setStatus("Urutan sertifikat diubah");
  };

  // ===================== CV DOCS =====================
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

  // ===================== CLOUD SAVE & SYNC =====================
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
      setStatus("Tersimpan sebagai draft lokal");
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
    if (typeof window !== "undefined" && !window.confirm("Kembalikan seluruh konfigurasi ke nilai bawaan?")) return;
    resetConfig();
    setDraft(null);
    setStatus("Kembali ke default");
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "lanyard", label: "Lanyard" },
    { key: "profileCard", label: "Header & Profile Card" },
    { key: "proyek", label: "Proyek" },
    { key: "experience", label: "Pengalaman" },
    { key: "education", label: "Jejak Akademik" },
    { key: "certificates", label: "Sertifikasi" },
    { key: "cv", label: "Berkas CV / PDF" },
  ];

  return (
    <div className="min-h-screen bg-surface pb-24 text-ink dark:bg-[#07090e]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md dark:border-line/40 dark:bg-[#0c0e17]/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-body hover:bg-surface hover:text-ink dark:border-line/40"
              title="Kembali ke Portofolio"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="font-display text-sm font-bold tracking-tight text-ink sm:text-base">
                Panel Admin & Manajemen Portofolio
              </h1>
              {userEmail && <p className="text-[11px] text-muted">Admin: {userEmail}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={pullFromCloud}
              disabled={syncingCloud}
              className="hidden sm:inline-flex min-h-[36px] items-center rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-body hover:bg-surface hover:text-ink disabled:opacity-50 dark:border-line/40 transition"
            >
              {syncingCloud ? "Menyinkronkan..." : "Tarik dari Cloud"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="hidden sm:inline-flex min-h-[36px] items-center rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-body hover:bg-surface hover:text-ink dark:border-line/40 transition"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={save}
              className="min-h-[36px] rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink transition"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-body hover:bg-surface hover:text-red-600 dark:border-line/40 transition"
              title="Keluar (Logout)"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        {/* Navigation Tabs Bar */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`min-h-[40px] shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                tab === item.key
                  ? "bg-ink text-white shadow-xs dark:bg-white dark:text-ink"
                  : "border border-line text-body hover:border-ink/30 hover:text-ink dark:border-line/40"
              }`}
            >
              {item.label}
            </button>
          ))}
          {status && <span className="ml-2 text-xs font-medium text-brand truncate max-w-[280px]">{status}</span>}
        </div>

        {/* ===================== TAB 1: LANYARD ===================== */}
        {tab === "lanyard" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-5">
              {GROUPS.map((group) => (
                <section
                  key={group.title}
                  className="rounded-2xl border border-line bg-white/85 p-5 shadow-2xs dark:border-line/40 dark:bg-[#111422]"
                >
                  <h2 className="font-display text-xs font-bold uppercase tracking-[0.08em] text-ink">{group.title}</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {group.fields.map((field) => {
                      const value = config.lanyard[field.key];
                      return (
                        <div key={field.key} className={field.kind === "image" ? "sm:col-span-2" : ""}>
                          <div className="flex items-center justify-between text-xs text-body">
                            <label htmlFor={`field-${field.key}`} className="font-medium">
                              {field.label}
                            </label>
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
                              value={String(value)}
                              onChange={(event) => update(field.key, event.target.value as never)}
                              className={`mt-1.5 ${inputClass}`}
                            >
                              {field.options?.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                          {field.kind === "color" && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <input
                                id={`field-${field.key}`}
                                type="color"
                                value={String(value)}
                                onChange={(event) => update(field.key, event.target.value as never)}
                                className="size-9 cursor-pointer rounded-lg border border-line bg-transparent p-0.5"
                              />
                              <input
                                type="text"
                                value={String(value)}
                                onChange={(event) => update(field.key, event.target.value as never)}
                                className={inputClass}
                              />
                            </div>
                          )}
                          {field.kind === "toggle" && (
                            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-body">
                              <input
                                id={`field-${field.key}`}
                                type="checkbox"
                                checked={Boolean(value)}
                                onChange={(event) => update(field.key, event.target.checked as never)}
                                className="size-4 rounded border-line text-brand focus:ring-brand"
                              />
                              <span>{Boolean(value) ? "Aktif" : "Nonaktif"}</span>
                            </label>
                          )}
                          {field.kind === "image" && (
                            <div className="mt-1.5 space-y-2">
                              <input
                                id={`field-${field.key}`}
                                type="text"
                                value={String(value ?? "")}
                                onChange={(event) => update(field.key, event.target.value as never)}
                                placeholder="https://... atau data URI"
                                className={inputClass}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-surface cursor-pointer dark:border-line/40 dark:bg-[#151928] transition">
                                  <Upload className="size-3.5 text-brand" />
                                  <span>{uploadingImage === field.key ? "Memproses..." : "Unggah (PNG/JPG/WebP)"}</span>
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        void uploadAndSet(
                                          file,
                                          "lanyard",
                                          (url) => update(field.key, url as never),
                                          field.key
                                        );
                                      }
                                    }}
                                  />
                                </label>
                                {value && (
                                  <button
                                    type="button"
                                    onClick={() => update(field.key, "" as never)}
                                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-body hover:text-red-600 hover:bg-red-50 dark:border-line/40 dark:hover:bg-red-950/20 transition"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </div>
                              {field.hint && <p className="text-[11px] text-muted">{field.hint}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="sticky top-24 self-start rounded-2xl border border-line bg-white/85 p-4 shadow-2xs dark:border-line/40 dark:bg-[#111422]">
              <h3 className="font-display text-xs uppercase tracking-wider text-muted">Pratinjau Fisika 3D</h3>
              <div className="mt-3 aspect-square w-full overflow-hidden rounded-xl bg-surface/40 dark:bg-black/40">
                <Lanyard
                  {...config.lanyard}
                  frontImage={config.lanyard.frontImage || undefined}
                  backImage={config.lanyard.backImage || undefined}
                  strapImage={config.lanyard.strapImage || undefined}
                />
              </div>
            </div>
          </div>
        ) : tab === "profileCard" ? (
          /* ===================== TAB 2: PROFILE CARD ===================== */
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-line bg-white/85 p-5 shadow-2xs dark:border-line/40 dark:bg-[#111422]">
                <h2 className="font-display text-xs font-bold uppercase tracking-[0.08em] text-ink">Gambar & Aset</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-body">Logo Header Situs</label>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-white dark:border-line/40 dark:bg-black overflow-hidden">
                        {config.headerLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={config.headerLogoUrl} alt="Logo" className="size-full object-cover" />
                        ) : (
                          <span className="font-bold text-xs">Z</span>
                        )}
                      </div>
                      <label className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-surface cursor-pointer dark:border-line/40 dark:bg-[#151928] transition">
                        <Upload className="size-3.5 text-brand" />
                        <span>{uploadingImage === "headerLogo" ? "Memproses..." : "Unggah Logo"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void uploadAndSet(
                                file,
                                "header",
                                (url) => setDraft({ ...config, headerLogoUrl: url }),
                                "headerLogo"
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-body">Foto Avatar Profil</label>
                    <input
                      type="text"
                      value={config.profileCard.avatarUrl}
                      onChange={(e) => updateProfileCard("avatarUrl", e.target.value)}
                      placeholder="/profile.webp atau URL Cloud"
                      className={`mt-1.5 ${inputClass}`}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-surface cursor-pointer dark:border-line/40 dark:bg-[#151928] transition">
                        <Upload className="size-3.5 text-brand" />
                        <span>{uploadingImage === "avatarUrl" ? "Memproses..." : "Unggah Avatar (PNG/JPG/WebP)"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void uploadAndSet(
                                file,
                                "profile",
                                (url) => updateProfileCard("avatarUrl", url),
                                "avatarUrl"
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

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
                    <label className="text-xs font-medium text-body">Judul Peran (Roles)</label>
                    <input
                      type="text"
                      value={config.profileCard.title}
                      onChange={(e) => updateProfileCard("title", e.target.value)}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-body">Username Handle</label>
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

            <div className="sticky top-24 self-start rounded-2xl border border-line bg-white/85 p-4 shadow-2xs dark:border-line/40 dark:bg-[#111422]">
              <h3 className="font-display text-xs uppercase tracking-wider text-muted">Pratinjau Kartu Hologram</h3>
              <div className="mt-3 flex items-center justify-center p-4">
                <ProfileCard {...config.profileCard} />
              </div>
            </div>
          </div>
        ) : tab === "proyek" ? (
          /* ===================== TAB 3: PROYEK CRUD ===================== */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Koleksi Proyek Portofolio</h2>
                <p className="text-xs text-body">Kelola proyek unggulan, peran, thumbnail, dan link repositori</p>
              </div>
              <button
                type="button"
                onClick={addProject}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink transition"
              >
                + Tambah proyek
              </button>
            </div>

            {config.projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white/60 p-12 text-center dark:border-line/40 dark:bg-[#111422]/60">
                <FolderGit2 className="mx-auto size-10 text-muted" />
                <h3 className="mt-3 font-display text-sm font-bold text-ink">Belum Ada Proyek yang Ditampilkan</h3>
                <p className="mt-1 text-xs text-body max-w-sm mx-auto">
                  Koleksi proyek saat ini kosong (Zero Slop Policy). Klik tombol di bawah untuk menambahkan proyek portofolio pertama Anda.
                </p>
                <button
                  type="button"
                  onClick={addProject}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-ink transition"
                >
                  + Tambah proyek
                </button>
              </div>
            ) : (
              <div className="grid gap-5">
                {config.projects.map((proj, idx) => (
                  <div
                    key={proj.id}
                    className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#111422]"
                  >
                    {/* Header: Title, Order & Delete */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3 dark:border-line/40">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                        <span className="font-display text-sm font-bold text-ink">{proj.title || "Proyek Tanpa Judul"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveProject(proj.id, "up")}
                          disabled={idx === 0}
                          title="Geser ke Atas"
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40 transition"
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProject(proj.id, "down")}
                          disabled={idx === config.projects.length - 1}
                          title="Geser ke Bawah"
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40 transition"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProject(proj.id)}
                          className="inline-flex min-h-[28px] items-center gap-1 px-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg dark:hover:bg-red-950/20 transition"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    {/* Fields Grid */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="block text-xs font-semibold text-body">
                        Judul
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-body">
                        Peran Anda
                        <input
                          type="text"
                          value={proj.role || ""}
                          onChange={(e) => updateProject(proj.id, { role: e.target.value })}
                          placeholder="Lead Frontend & UI/UX"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </label>

                      <div>
                        <label className="text-xs font-medium text-body">Tag Teknologi (pisahkan koma)</label>
                        <input
                          type="text"
                          value={Array.isArray(proj.tags) ? proj.tags.join(", ") : ""}
                          onChange={(e) =>
                            updateProject(proj.id, {
                              tags: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Next.js, TypeScript, Tailwind"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold text-body">
                          Deskripsi Ringkas
                          <textarea
                            value={proj.desc}
                            onChange={(e) => updateProject(proj.id, { desc: e.target.value })}
                            rows={2}
                            className={`mt-1.5 ${inputClass}`}
                          />
                        </label>
                      </div>

                      {/* Image Thumbnail & Upload */}
                      <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-line/60 bg-surface/50 p-3.5 dark:border-line/30 dark:bg-slate-900/40">
                        <span className="text-xs font-semibold text-ink">Foto / Tangkapan Layar Thumbnail</span>
                        <div className="mt-2.5 flex flex-wrap items-center gap-4">
                          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-white shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
                            {proj.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={proj.image} alt={proj.title} className="size-full object-cover" />
                            ) : (
                              <div className="flex size-full items-center justify-center text-muted">
                                <ImageIcon className="size-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <input
                              type="text"
                              value={proj.image || ""}
                              onChange={(e) => updateProject(proj.id, { image: e.target.value })}
                              placeholder="URL gambar atau unggah berkas WebP..."
                              className={inputClass}
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <label className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1 text-xs font-semibold text-ink shadow-2xs hover:bg-surface cursor-pointer dark:border-line/40 dark:bg-[#151928] transition">
                                <Upload className="size-3 text-brand" />
                                <span>{uploadingImage === `proj-${proj.id}` ? "Mengonversi..." : "Unggah Gambar"}</span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      void uploadAndSet(
                                        file,
                                        "projects",
                                        (url) => updateProject(proj.id, { image: url }),
                                        `proj-${proj.id}`
                                      );
                                    }
                                  }}
                                />
                              </label>
                              {proj.image && (
                                <button
                                  type="button"
                                  onClick={() => updateProject(proj.id, { image: "" })}
                                  className="inline-flex min-h-[32px] items-center px-2.5 text-xs text-muted hover:text-red-600 transition"
                                >
                                  Hapus Gambar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-body">Tautan Live (URL)</label>
                        <input
                          type="url"
                          value={proj.previewUrl || ""}
                          onChange={(e) => updateProject(proj.id, { previewUrl: e.target.value })}
                          placeholder="https://..."
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-body">Tautan Repository (GitHub)</label>
                        <input
                          type="url"
                          value={proj.repo || ""}
                          onChange={(e) => updateProject(proj.id, { repo: e.target.value })}
                          placeholder="https://github.com/..."
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-body">Sorotan Utama (Highlight)</label>
                        <input
                          type="text"
                          value={proj.highlight || ""}
                          onChange={(e) => updateProject(proj.id, { highlight: e.target.value })}
                          placeholder="Fitur kunci / optimasi utama"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === "experience" ? (
          /* ===================== TAB 4: EXPERIENCE CRUD ===================== */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Riwayat Pengalaman & Aktivitas Organisasi</h2>
                <p className="text-xs text-body">Kelola peran di kampus, komunitas Linux, GDG, dan pengalaman profesional</p>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink transition"
              >
                <Plus className="size-3.5" />
                <span>Tambah Pengalaman</span>
              </button>
            </div>

            {(config.experience || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white/60 p-12 text-center dark:border-line/40 dark:bg-[#111422]/60">
                <Briefcase className="mx-auto size-10 text-muted" />
                <h3 className="mt-3 font-display text-sm font-bold text-ink">Belum Ada Pengalaman Ditambahkan</h3>
                <p className="mt-1 text-xs text-body max-w-sm mx-auto">
                  Tambahkan riwayat organisasi atau peran kerja Anda untuk ditampilkan di timeline interaktif portofolio.
                </p>
                <button
                  type="button"
                  onClick={addExperience}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-ink transition"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Pengalaman Pertama</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-5">
                {(config.experience || []).map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#111422]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3 dark:border-line/40">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                        <span className="font-display text-sm font-bold text-ink">{exp.role}</span>
                        <span className="text-xs font-medium text-muted">— {exp.org}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveExperience(exp.id, "up")}
                          disabled={idx === 0}
                          title="Geser ke Atas"
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40 transition"
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExperience(exp.id, "down")}
                          disabled={idx === (config.experience?.length || 1) - 1}
                          title="Geser ke Bawah"
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40 transition"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExperience(exp.id)}
                          className="inline-flex min-h-[28px] items-center gap-1 px-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg dark:hover:bg-red-950/20 transition"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="text-xs font-medium text-body">Posisi / Peran</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                          placeholder="Kepala Divisi Media Creative"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-body">Organisasi / Lembaga</label>
                        <input
                          type="text"
                          value={exp.org}
                          onChange={(e) => updateExperience(exp.id, { org: e.target.value })}
                          placeholder="HIMATIF UTM"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-body">Lokasi / Tempat</label>
                        <input
                          type="text"
                          value={exp.place}
                          onChange={(e) => updateExperience(exp.id, { place: e.target.value })}
                          placeholder="Bangkalan / Mojokerto"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-body">Periode Waktu</label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => updateExperience(exp.id, { period: e.target.value })}
                          placeholder="2024-09 — Sekarang"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-body">Deskripsi Tanggung Jawab & Dampak</label>
                        <textarea
                          value={exp.desc}
                          onChange={(e) => updateExperience(exp.id, { desc: e.target.value })}
                          rows={2}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === "education" ? (
          /* ===================== TAB 5: EDUCATION CRUD ===================== */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Jejak Akademik & Logo Pendidikan</h2>
                <p className="text-xs text-body">Kelola riwayat pendidikan, logo institusi resmi, dan proyek akademik di timeline portofolio</p>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink transition"
              >
                <Plus className="size-3.5" />
                <span>Tambah Institusi</span>
              </button>
            </div>

            {(config.education || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white/60 p-12 text-center dark:border-line/40 dark:bg-[#111422]/60">
                <GraduationCap className="mx-auto size-10 text-muted" />
                <h3 className="mt-3 font-display text-sm font-bold text-ink">Belum Ada Institusi Pendidikan</h3>
                <p className="mt-1 text-xs text-body max-w-sm mx-auto">
                  Tambahkan data perguruan tinggi atau sekolah Anda untuk membangun visualisasi jejak akademik.
                </p>
                <button
                  type="button"
                  onClick={addEducation}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-ink transition"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Institusi</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-5">
                {(config.education || []).map((edu, idx) => (
                  <div
                    key={edu.id}
                    className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#111422]"
                  >
                    {/* Header */}
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
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40 transition"
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEducation(edu.id, "down")}
                          disabled={idx === (config.education?.length || 1) - 1}
                          title="Geser ke Bawah"
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40 transition"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEducation(edu.id)}
                          className="inline-flex min-h-[28px] items-center gap-1 px-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg dark:hover:bg-red-950/20 transition"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    {/* Main Fields */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="text-xs font-medium text-body">Nama Institusi</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-body">Program / Jurusan</label>
                        <input
                          type="text"
                          value={edu.program}
                          onChange={(e) => updateEducation(edu.id, { program: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-body">Jenjang / Gelar</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                          placeholder="S1 Teknik Informatika / SMK Multimedia"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-body">Lokasi</label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                          placeholder="Bangkalan, Jawa Timur"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-body">Tahun Mulai</label>
                        <input
                          type="number"
                          value={edu.startYear}
                          onChange={(e) => updateEducation(edu.id, { startYear: parseInt(e.target.value, 10) || 2024 })}
                          className={`mt-1.5 ${inputClass}`}
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
                          className={`mt-1.5 ${inputClass}`}
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

                    {/* Description & Website */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-body">Deskripsi Perjalanan & Ringkasan Studi</label>
                        <textarea
                          value={edu.desc}
                          onChange={(e) => updateEducation(edu.id, { desc: e.target.value })}
                          rows={2}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-body">Fokus Studi & Kompetensi (pisahkan koma)</label>
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
                          placeholder="Rekayasa Perangkat Lunak, UI/UX"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-body">Situs Web Institusi (URL)</label>
                        <input
                          type="url"
                          value={edu.website || ""}
                          onChange={(e) => updateEducation(edu.id, { website: e.target.value })}
                          placeholder="https://www.trunojoyo.ac.id"
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>
                    </div>

                    {/* Sub-Editor: Proyek Akademik */}
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
                          <div
                            key={pIdx}
                            className="rounded-xl border border-line/70 bg-surface/30 p-3 text-xs dark:border-line/30 dark:bg-slate-900/30"
                          >
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
            )}
          </div>
        ) : tab === "certificates" ? (
          /* ===================== TAB 6: CERTIFICATES CRUD ===================== */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Koleksi Sertifikasi & Kredensial</h2>
                <p className="text-xs text-body">Kelola sertifikasi profesional dari Google, Cisco, Dicoding, dan BNSP</p>
              </div>
              <button
                type="button"
                onClick={addCertificate}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink transition"
              >
                <Plus className="size-3.5" />
                <span>Tambah Sertifikat</span>
              </button>
            </div>

            {(config.certificates || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white/60 p-12 text-center dark:border-line/40 dark:bg-[#111422]/60">
                <Award className="mx-auto size-10 text-muted" />
                <h3 className="mt-3 font-display text-sm font-bold text-ink">Belum Ada Sertifikasi Ditambahkan</h3>
                <p className="mt-1 text-xs text-body max-w-sm mx-auto">
                  Tambahkan sertifikasi keahlian Anda untuk membuktikan kompetensi teknis kepada pengunjung.
                </p>
                <button
                  type="button"
                  onClick={addCertificate}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-ink transition"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Sertifikat Pertama</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(config.certificates || []).map((cert, idx) => (
                  <div
                    key={cert.id}
                    className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#111422]"
                  >
                    <div className="flex items-center justify-between border-b border-line/60 pb-3 dark:border-line/40">
                      <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveCertificate(cert.id, "up")}
                          disabled={idx === 0}
                          title="Geser ke Atas"
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40 transition"
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCertificate(cert.id, "down")}
                          disabled={idx === (config.certificates?.length || 1) - 1}
                          title="Geser ke Bawah"
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-body hover:bg-surface disabled:opacity-30 disabled:pointer-events-none dark:border-line/40 transition"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCertificate(cert.id)}
                          className="inline-flex min-h-[28px] items-center gap-1 px-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg dark:hover:bg-red-950/20 transition"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-body">Judul Sertifikat</label>
                        <input
                          type="text"
                          value={cert.title}
                          onChange={(e) => updateCertificate(cert.id, { title: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-body">Lembaga Penerbit</label>
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) => updateCertificate(cert.id, { issuer: e.target.value })}
                            placeholder="Google / Dicoding"
                            className={`mt-1 ${inputClass}`}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-body">Tahun</label>
                          <input
                            type="text"
                            value={cert.date}
                            onChange={(e) => updateCertificate(cert.id, { date: e.target.value })}
                            placeholder="2024"
                            className={`mt-1 ${inputClass}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-body">Kategori</label>
                          <select
                            value={cert.category}
                            onChange={(e) =>
                              updateCertificate(cert.id, {
                                category: e.target.value as "design" | "frontend" | "systems" | "all",
                              })
                            }
                            className={`mt-1 ${inputClass}`}
                          >
                            <option value="design">Desain & UX</option>
                            <option value="frontend">Frontend & Web</option>
                            <option value="systems">Sistem & Jaringan</option>
                            <option value="all">Umum</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-body">URL Kredensial</label>
                          <input
                            type="url"
                            value={cert.credentialUrl || ""}
                            onChange={(e) => updateCertificate(cert.id, { credentialUrl: e.target.value })}
                            placeholder="https://..."
                            className={`mt-1 ${inputClass}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ===================== TAB 7: CV DOCS ===================== */
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Berkas CV ATS & Halaman Dokumen</h2>
              <p className="text-xs text-body">Kelola berkas ATS PDF untuk 4 pilar peran profesional Zakaria</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["graphic", "uiux", "frontend", "itsupport"] as const).map((role) => {
                const doc = config.cvDocs.find((d) => d.roleKey === role);
                return (
                  <div
                    key={role}
                    className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#111422]"
                  >
                    <div className="flex items-center justify-between border-b border-line/60 pb-2.5 dark:border-line/40">
                      <h3 className="font-bold text-ink uppercase text-xs tracking-wider">Peran: {role}</h3>
                      <button
                        type="button"
                        onClick={() => setPreviewCvRole(role)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                      >
                        <FileText className="size-3.5" />
                        <span>Pratinjau</span>
                      </button>
                    </div>
                    <div className="mt-3.5 space-y-3">
                      <div>
                        <label className="text-xs text-body font-medium">Judul Dokumen</label>
                        <input
                          type="text"
                          value={doc?.title || ""}
                          onChange={(e) => updateCvDoc(role, { title: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-body font-medium">Sub-judul Spesialisasi</label>
                        <input
                          type="text"
                          value={doc?.subtitle || ""}
                          onChange={(e) => updateCvDoc(role, { subtitle: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-body font-medium">URL Berkas PDF ATS</label>
                        <input
                          type="text"
                          value={doc?.pdfUrl || ""}
                          onChange={(e) => updateCvDoc(role, { pdfUrl: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                          placeholder="/cv-ats-zakariamp-2025.pdf"
                        />
                      </div>
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
