"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { profile } from "@/lib/profile";
import CvPreviewModal, { type RoleKey } from "@/components/cv-preview-modal";

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
      { key: "frontImage", label: "Gambar depan", kind: "image", hint: "Rasio kartu ≈ 0.71 (mis. 640×900)" },
      { key: "backImage", label: "Gambar belakang", kind: "image", hint: "Kosong = pakai gambar depan" },
      { key: "strapImage", label: "Gambar tali", kind: "image", hint: "Gambar lebar, diulang sepanjang tali" },
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
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const readImage = (file: File, max = 1400) =>
  new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("Canvas tidak tersedia"));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", 0.9));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca gambar"));
    };
    image.src = url;
  });

const readPdfFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca PDF"));
    reader.readAsDataURL(file);
  });

const uploadAsset = async (file: File, folder = "uploads"): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch {
    // fallback ke lokal
  }

  if (file.type.includes("pdf")) {
    return readPdfFile(file);
  }
  return readImage(file);
};

function Control({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: LanyardConfig[keyof LanyardConfig];
  onChange: (value: unknown) => void;
}) {
  if (field.kind === "toggle") {
    return (
      <label className="flex items-center justify-between gap-4 py-1.5">
        <span className="text-sm text-ink">{field.label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 accent-brand"
        />
      </label>
    );
  }

  if (field.kind === "image") {
    const src = typeof value === "string" ? value : "";
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink">{field.label}</span>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-ink hover:border-brand/50">
              Unggah
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  const url = await uploadAsset(file, "images");
                  onChange(url);
                }}
              />
            </label>
            {src && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-body hover:border-red-300 hover:text-red-600"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-line/40">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-[9px] text-body">kosong</span>
            )}
          </span>
          <input
            type="text"
            value={src.startsWith("data:") ? "" : src}
            placeholder={src.startsWith("data:") ? "gambar terunggah" : "/card-front.svg"}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        </div>
        {field.hint && <p className="text-[11px] text-body">{field.hint}</p>}
      </div>
    );
  }

  if (field.kind === "color") {
    return (
      <label className="flex items-center justify-between gap-4 py-1.5">
        <span className="text-sm text-ink">{field.label}</span>
        <span className="flex items-center gap-2">
          <input
            type="color"
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-line bg-white"
          />
          <span className="w-20 text-right font-mono text-[11px] text-body">{String(value)}</span>
        </span>
      </label>
    );
  }

  if (field.kind === "select") {
    return (
      <label className="flex items-center justify-between gap-4 py-1.5">
        <span className="text-sm text-ink">{field.label}</span>
        <select
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm capitalize outline-none focus:border-brand"
        >
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  const number = Number(value);
  return (
    <label className="block py-1.5">
      <span className="flex items-center justify-between gap-3 text-sm text-ink">
        {field.label}
        <span className="font-mono text-[11px] text-body">{number.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={number}
        onChange={(event) => onChange(Number(event.target.value))}
        onInput={(event) => onChange(Number((event.target as HTMLInputElement).value))}
        className="mt-1.5 w-full accent-brand"
      />
    </label>
  );
}

function ProfileCardPreview({ config }: { config: ProfileCardConfig }) {
  return (
    <ProfileCard
      {...config}
      avatarUrl={config.avatarUrl || undefined}
      iconUrl={config.iconUrl || undefined}
      miniAvatarUrl={config.miniAvatarUrl || undefined}
      imageFit={config.imageFit || "contain"}
      backdropColor={config.backdropColor || undefined}
    />
  );
}


function ProfileCardTab({
  config,
  inputClass,
  setProfileCard,
  setHeaderLogoUrl,
}: {
  config: SiteConfig;
  inputClass: string;
  setProfileCard: (key: keyof ProfileCardConfig, value: unknown) => void;
  setHeaderLogoUrl: (value: string) => void;
}) {
  const pc = config.profileCard;
  const F = Control;
  const K = "frontImage" as keyof LanyardConfig;
  const R = "cornerRadius" as keyof LanyardConfig;
  const T = "interactive" as keyof LanyardConfig;
  const C = "cardColor" as keyof LanyardConfig;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-white/85 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
              Logo Header (Navbar)
            </h2>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              Terpisah dari Hero
            </span>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-body">
            Foto atau ikon logo brand yang tampil di sudut kiri atas navbar header situs.
            Jika dihapus atau dikosongkan, navbar akan otomatis menampilkan badge inisial brand secara rapi tanpa foto statis.
          </p>
          <div className="pt-2">
            <F
              field={{
                key: K,
                label: "Foto Logo Header",
                kind: "image",
                hint: "Rasio 1:1 persegi atau lingkaran (mis. 200×200)",
              }}
              value={config.headerLogoUrl}
              onChange={(v) => setHeaderLogoUrl(String(v))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white/85 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
              Foto Hero (Profile Card)
            </h2>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
              Kartu 3D Hero
            </span>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-body">
            Foto potret utama di kartu 3D hero. Jika dihapus (klik tombol Hapus), kartu akan otomatis beralih ke &quot;DEVELOPER BADGE&quot; monokromatik modern yang bersih dan minimalis tanpa foto.
          </p>
          <div className="divide-y divide-line/70">
            <div className="py-2">
              <F
                field={{
                  key: K,
                  label: "Foto Avatar Hero",
                  kind: "image",
                  hint: "Foto potret diri / ilustrasi",
                }}
                value={pc.avatarUrl}
                onChange={(v) => setProfileCard("avatarUrl", v)}
              />
            </div>
            <div className="py-2.5">
              <label className="flex items-center justify-between gap-4 py-1.5">
                <div>
                  <span className="text-sm font-medium text-ink">Kerapian / Fit Foto Hero</span>
                  <p className="text-[11px] text-body">
                    Pilih &apos;contain&apos; agar foto tidak terlalu zoom dan tidak terpotong.
                  </p>
                </div>
                <select
                  value={pc.imageFit || "contain"}
                  onChange={(e) => setProfileCard("imageFit", e.target.value)}
                  className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-brand"
                >
                  <option value="contain">Contain (Rapi, Utuh, Tidak Terpotong)</option>
                  <option value="cover">Cover (Penuh / Zoom)</option>
                </select>
              </label>
            </div>
            <div className="py-2">
              <F
                field={{
                  key: K,
                  label: "Icon Pattern Hologram",
                  kind: "image",
                  hint: "Pola motif hologram watermark kartu",
                }}
                value={pc.iconUrl}
                onChange={(v) => setProfileCard("iconUrl", v)}
              />
            </div>
            <div className="py-2">
              <F
                field={{
                  key: K,
                  label: "Mini Avatar (Footer Kartu)",
                  kind: "image",
                  hint: "Kosongkan untuk menampilkan inisial",
                }}
                value={pc.miniAvatarUrl}
                onChange={(v) => setProfileCard("miniAvatarUrl", v)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white/85 p-5">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Identitas</h2>
          <div className="divide-y divide-line/70">
            {([["name","Nama"],["title","Title / Role"],["handle","Handle (tanpa @)"],["status","Status"],["contactText","Teks tombol"]] as [keyof ProfileCardConfig, string][]).map(([key, label]) => (
              <div key={key} className="py-2"><label className="block text-xs font-semibold text-body">{label}<input value={pc[key] as string} onChange={(e) => setProfileCard(key, e.target.value)} className={`${inputClass} mt-1`} /></label></div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white/85 p-5">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Tampilan</h2>
          <div className="divide-y divide-line/70">
            <div className="py-2"><F field={{key:K,label:"Tema",kind:"select",options:["dark","light"]}} value={pc.theme} onChange={(v)=>setProfileCard("theme",v)}/></div>
            <div className="py-2"><F field={{key:C,label:"Warna status",kind:"color"}} value={pc.statusColor} onChange={(v)=>setProfileCard("statusColor",v)}/></div>
            <div className="py-2"><F field={{key:C,label:"Backdrop color",kind:"color"}} value={pc.backdropColor||"#000000"} onChange={(v)=>setProfileCard("backdropColor",v)}/></div>
            <div className="py-2"><F field={{key:R,label:"Sudut (px)",kind:"range",min:0,max:40,step:1}} value={pc.radius} onChange={(v)=>setProfileCard("radius",v)}/></div>
            <div className="py-2"><F field={{key:T,label:"Footer info",kind:"toggle"}} value={pc.showUserInfo} onChange={(v)=>setProfileCard("showUserInfo",v)}/></div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white/85 p-5">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Efek</h2>
          <div className="divide-y divide-line/70">
            <div className="py-2"><F field={{key:R,label:"Holo",kind:"range",min:0,max:1,step:0.01}} value={pc.holo} onChange={(v)=>setProfileCard("holo",v)}/></div>
            <div className="py-2"><F field={{key:R,label:"Glare",kind:"range",min:0,max:1,step:0.01}} value={pc.glare} onChange={(v)=>setProfileCard("glare",v)}/></div>
            <div className="py-2"><F field={{key:T,label:"Tilt",kind:"toggle"}} value={pc.enableTilt} onChange={(v)=>setProfileCard("enableTilt",v)}/></div>
            <div className="py-2"><F field={{key:R,label:"Tilt (°)",kind:"range",min:1,max:40,step:1}} value={pc.tiltStrength} onChange={(v)=>setProfileCard("tiltStrength",v)}/></div>
            <div className="py-2"><F field={{key:R,label:"Parallax",kind:"range",min:0,max:30,step:1}} value={pc.parallax} onChange={(v)=>setProfileCard("parallax",v)}/></div>
            <div className="py-2"><F field={{key:T,label:"Intro",kind:"toggle"}} value={pc.intro} onChange={(v)=>setProfileCard("intro",v)}/></div>
            <div className="py-2"><F field={{key:T,label:"Mobile tilt",kind:"toggle"}} value={pc.enableMobileTilt} onChange={(v)=>setProfileCard("enableMobileTilt",v)}/></div>
            <div className="py-2"><F field={{key:R,label:"Mobile sens.",kind:"range",min:1,max:20,step:1}} value={pc.mobileTiltSensitivity} onChange={(v)=>setProfileCard("mobileTiltSensitivity",v)}/></div>
          </div>
        </section>
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_0%,#1a1a2e,#0f0f23_70%)] p-4 sm:p-8" style={{minHeight:520}}>
          <ProfileCardPreview config={pc} />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-body">Arahkan kursor ke kartu untuk melihat efek.</p>
      </div>
    </div>
  );
}


export default function AdminPage() {
  const stored = useSiteConfig();
  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const [tab, setTab] = useState<"lanyard" | "profileCard" | "proyek" | "cv">("lanyard");
  const [status, setStatus] = useState("");
  const [previewCvModal, setPreviewCvModal] = useState(false);
  const [previewRole, setPreviewRole] = useState<RoleKey>("frontend");
  const [cloudStatus, setCloudStatus] = useState<{ r2: boolean; supabase: boolean } | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const config = draft ?? stored;

  useEffect(() => {
    fetch("/api/upload")
      .then((res) => res.json())
      .then((data) => setCloudStatus(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const setLanyard = (key: keyof LanyardConfig, value: unknown) =>
    setDraft({ ...config, lanyard: { ...config.lanyard, [key]: value } });

  const setHeaderLogoUrl = (value: string) =>
    setDraft({ ...config, headerLogoUrl: value });

  const setProfileCard = (key: keyof ProfileCardConfig, value: unknown) =>
    setDraft({ ...config, profileCard: { ...config.profileCard, [key]: value } });

  const setProject = (id: string, patch: Partial<Project>) =>
    setDraft({
      ...config,
      projects: config.projects.map((project) =>
        project.id === id ? { ...project, ...patch } : project
      ),
    });

  const setCvDoc = (id: string, patch: Partial<CvDocConfig>) =>
    setDraft({
      ...config,
      cvDocs: (config.cvDocs || []).map((doc) =>
        doc.id === id ? { ...doc, ...patch } : doc
      ),
    });

  const addProject = () =>
    setDraft({
      ...config,
      projects: [
        ...config.projects,
        { id: crypto.randomUUID(), title: "Proyek baru", desc: "", tags: [], repo: "" },
      ],
    });

  const removeProject = (id: string) =>
    setDraft({
      ...config,
      projects: config.projects.filter((project) => project.id !== id),
    });

  const loadSeedProjects = () => {
    const seed: Project[] = profile.projects.map((item, index) => ({
      id: `project-${Date.now()}-${index + 1}`,
      title: item.title,
      desc: item.desc,
      tags: [...item.tags],
      repo: item.repo,
      role: item.role,
      problem: item.problem,
      highlight: item.highlight,
      outcome: item.outcome,
    }));
    setDraft({ ...config, projects: seed });
    setStatus("Data proyek profil dimuat ke draft. Klik Simpan untuk menulis ke Supabase.");
  };

  const save = async () => {
    writeConfig(config);
    setStatus("Tersimpan di browser");
    if (cloudStatus?.supabase) {
      setStatus("Menyimpan ke Supabase Cloud...");
      const res = await saveCloudConfig(config);
      if (res.success) {
        setStatus("Tersimpan di Browser & Supabase Cloud");
      } else {
        setStatus(`Tersimpan lokal (${res.message || "Gagal sinkron cloud"})`);
      }
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
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-body hover:text-ink rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand px-1">
              ← Portofolio
            </Link>
            <span className="h-4 w-px bg-line" aria-hidden="true" />
            <span className="font-display text-sm uppercase">Panel Admin</span>

            <div className="hidden md:flex items-center gap-2 ml-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                  cloudStatus?.r2
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
                title={
                  cloudStatus?.r2
                    ? "Cloudflare R2 aktif untuk penyimpanan aset & upload"
                    : "Cloudflare R2 offline. Atur R2_* di .env.local untuk mengaktifkan Cloudflare R2"
                }
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
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
                title={
                  cloudStatus?.supabase
                    ? "Supabase PostgreSQL Database aktif untuk sinkronisasi cloud"
                    : "Supabase offline. Atur SUPABASE_* di .env.local untuk mengaktifkan Cloud Database"
                }
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
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {syncingCloud ? "Menyinkronkan..." : "Tarik Cloud"}
              </button>
            )}
            <button
              type="button"
              onClick={exportJson}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Ekspor
            </button>
            <label className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/50 focus-within:ring-2 focus-within:ring-brand">
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
              className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-body hover:border-red-300 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Simpan
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
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                tab === item
                  ? "bg-ink text-white"
                  : "border border-line text-body hover:border-ink/30 hover:text-ink"
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
          {status && <span className="ml-2 text-xs text-brand">{status}</span>}
        </div>


        {tab === "lanyard" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-5">
              {GROUPS.map((group) => (
                <section key={group.title} className="rounded-2xl border border-line bg-white/85 p-5">
                  <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
                    {group.title}
                  </h2>
                  <div className="divide-y divide-line/70">
                    {group.fields.map((field) => (
                      <div key={field.key} className="py-2">
                        <Control
                          field={field}
                          value={config.lanyard[field.key]}
                          onChange={(value) => setLanyard(field.key, value)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_0%,#eef3ff,#ffffff_70%)]">
                <div className="h-[520px]">
                  <Lanyard
                    {...config.lanyard}
                    frontImage={config.lanyard.frontImage || undefined}
                    backImage={config.lanyard.backImage || undefined}
                    strapImage={config.lanyard.strapImage || undefined}
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-body">
                Tarik kartu untuk menguji fisika. Klik kartu untuk membaliknya.
              </p>
            </div>
          </div>
        ) : tab === "profileCard" ? (
          <ProfileCardTab
            config={config}
            inputClass={inputClass}
            setProfileCard={setProfileCard}
            setHeaderLogoUrl={setHeaderLogoUrl}
          />
        ) : tab === "proyek" ? (
          <div className="space-y-4">
            {config.projects.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line bg-white/70 p-8 text-center">
                <p className="text-sm font-bold text-ink">Belum ada proyek di database</p>
                <p className="mt-1 text-xs text-body max-w-md mx-auto">
                  Situs saat ini menampilkan keadaan kosong (bebas data demo). Anda dapat menambahkan proyek secara manual atau memuat 7 proyek dari data profil ke draft untuk disimpan ke Supabase.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={addProject}
                    className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-ink"
                  >
                    + Tambah proyek
                  </button>
                  <button
                    type="button"
                    onClick={loadSeedProjects}
                    className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-body hover:border-brand/50 hover:text-brand"
                  >
                    Muat 7 Proyek Profil ke Draft
                  </button>
                </div>
              </div>
            )}

            {config.projects.map((project, index) => (
              <div key={project.id} className="rounded-2xl border border-line bg-white/85 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                    Proyek {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProject(project.id)}
                    className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold text-body hover:border-red-300 hover:text-red-600"
                  >
                    Hapus
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-body">
                    Judul
                    <input
                      value={project.title}
                      onChange={(event) => setProject(project.id, { title: event.target.value })}
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-body">
                    URL repo
                    <input
                      value={project.repo}
                      onChange={(event) => setProject(project.id, { repo: event.target.value })}
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-body sm:col-span-2">
                    Deskripsi
                    <textarea
                      value={project.desc}
                      rows={2}
                      onChange={(event) => setProject(project.id, { desc: event.target.value })}
                      className={`${inputClass} mt-1 resize-y`}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-body sm:col-span-2">
                    Tag (pisahkan dengan koma)
                    <input
                      value={project.tags.join(", ")}
                      onChange={(event) =>
                        setProject(project.id, {
                          tags: event.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        })
                      }
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-body">
                    URL Gambar / Screenshot Pratinjau
                    <input
                      value={project.image || ""}
                      placeholder="https://... atau /projects/preview.png"
                      onChange={(event) => setProject(project.id, { image: event.target.value })}
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-body">
                    URL Live Demo (Opsional)
                    <input
                      value={project.previewUrl || ""}
                      placeholder="https://..."
                      onChange={(event) => setProject(project.id, { previewUrl: event.target.value })}
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addProject}
              className="w-full rounded-2xl border border-dashed border-line py-3 text-sm font-semibold text-body hover:border-brand/50 hover:text-brand"
            >
              + Tambah proyek
            </button>
          </div>
        ) : tab === "cv" ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-white/90 p-5 sm:p-6 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-4">
                <div>
                  <h2 className="text-base font-bold text-ink">Konfigurasi Berkas CV & Dokumen PDF</h2>
                  <p className="text-xs text-body mt-0.5">
                    Ganti tautan berkas PDF, unggah berkas PDF/gambar halaman, dan atur jumlah halaman yang dapat digeser di modal pratinjau.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRole("all");
                    setPreviewCvModal(true);
                  }}
                  className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-ink"
                >
                  Tes Modal Geser PDF →
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {(config.cvDocs || []).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col justify-between rounded-2xl border border-line/80 bg-slate-50/60 p-5 shadow-2xs"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-line/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-3.5 rounded-full"
                            style={{ backgroundColor: doc.color }}
                          />
                          <h3 className="font-bold text-sm text-ink">{doc.title}</h3>
                        </div>
                        <span className="font-mono text-[11px] text-body">
                          {doc.roleKey}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-semibold text-body">
                          Judul Tampilan
                          <input
                            value={doc.title}
                            onChange={(e) => setCvDoc(doc.id, { title: e.target.value })}
                            className={`${inputClass} mt-1`}
                          />
                        </label>
                        <label className="block text-xs font-semibold text-body">
                          Warna Aksen
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="color"
                              value={doc.color}
                              onChange={(e) => setCvDoc(doc.id, { color: e.target.value })}
                              className="size-8 rounded-lg border border-line cursor-pointer"
                            />
                            <input
                              value={doc.color}
                              onChange={(e) => setCvDoc(doc.id, { color: e.target.value })}
                              className={`${inputClass}`}
                            />
                          </div>
                        </label>
                      </div>

                      <label className="block text-xs font-semibold text-body">
                        Sub-Judul / Spesialisasi
                        <input
                          value={doc.subtitle}
                          onChange={(e) => setCvDoc(doc.id, { subtitle: e.target.value })}
                          className={`${inputClass} mt-1`}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-body">
                        Path / URL Berkas PDF (mis. /cv/cv-frontend.pdf atau link online)
                        <input
                          value={doc.pdfUrl || ""}
                          placeholder="Kosongkan untuk memakai demo kertas interaktif"
                          onChange={(e) => setCvDoc(doc.id, { pdfUrl: e.target.value })}
                          className={`${inputClass} mt-1`}
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2 pt-1">
                        <div>
                          <span className="block text-xs font-semibold text-body">Unggah Berkas PDF</span>
                          <label className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-line bg-white px-3 py-2 text-xs font-semibold text-brand hover:border-brand">
                            <span>{doc.pdfUrl?.startsWith("data:") ? "PDF Terunggah (Ubah)" : "Pilih File .pdf"}</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setStatus("Mengunggah berkas PDF...");
                                  const url = await uploadAsset(file, "cv-pdf");
                                  setCvDoc(doc.id, { pdfUrl: url });
                                  setStatus(`PDF ${doc.title} berhasil diunggah`);
                                } catch {
                                  setStatus("Gagal memuat file PDF");
                                }
                              }}
                            />
                          </label>
                        </div>

                        <label className="block text-xs font-semibold text-body">
                          Jumlah Halaman Dokumen
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={doc.pageCount || 2}
                            onChange={(e) => setCvDoc(doc.id, { pageCount: Number(e.target.value) })}
                            className={`${inputClass} mt-1`}
                          />
                        </label>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold text-body">
                          Unggah Gambar Halaman (Slide Pratinjau)
                        </span>
                        <label className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-brand">
                          <span>
                            {doc.pages?.length ? `${doc.pages.length} Halaman Terunggah (Tambah)` : "Pilih Gambar Halaman (Multi-Page)"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (!files.length) return;
                              setStatus(`Mengunggah ${files.length} gambar halaman...`);
                              const newPages: string[] = [];
                              for (const file of files) {
                                try {
                                  const url = await uploadAsset(file, "cv-pages");
                                  newPages.push(url);
                                } catch {
                                  // ignore
                                }
                              }
                              setCvDoc(doc.id, {
                                pages: [...(doc.pages || []), ...newPages],
                                pageCount: (doc.pages?.length || 0) + newPages.length,
                              });
                              setStatus(`${newPages.length} halaman berhasil ditambahkan`);
                            }}
                          />
                        </label>
                        {doc.pages && doc.pages.length > 0 && (
                          <div className="mt-2 flex items-center justify-between text-[11px] text-body">
                            <span>{doc.pages.length} gambar halaman tersimpan</span>
                            <button
                              type="button"
                              onClick={() => setCvDoc(doc.id, { pages: [] })}
                              className="text-red-500 hover:underline"
                            >
                              Hapus Gambar Halaman
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewRole(doc.roleKey);
                          setPreviewCvModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                      >
                        Pratinjau / Geser Halaman →
                      </button>
                      {doc.pdfUrl && (
                        <button
                          type="button"
                          onClick={() => setCvDoc(doc.id, { pdfUrl: "" })}
                          className="text-[11px] font-medium text-slate-500 hover:text-red-600"
                        >
                          Hapus PDF
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <p className="mt-10 rounded-xl border border-line bg-white/70 p-4 text-[11px] leading-relaxed text-body">
          Perubahan disimpan di <code>localStorage</code> browser ini (tanpa server), jadi hanya
          terlihat olehmu. Untuk permanen: klik <strong>Ekspor</strong>, lalu tempel nilainya ke{" "}
          <code>defaultLanyard</code> / <code>defaultProjects</code> di{" "}
          <code>src/lib/site-store.ts</code>. Halaman ini <code>noindex</code> dan tidak menyimpan
          data apa pun di server.
        </p>
      </main>

      <CvPreviewModal
        isOpen={previewCvModal}
        initialRole={previewRole}
        onClose={() => setPreviewCvModal(false)}
      />
    </div>
  );
}

