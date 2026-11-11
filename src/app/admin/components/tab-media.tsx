"use client";

import { useState } from "react";
import type { SiteConfig } from "@/lib/site-store";
import {
  Upload,
  Copy,
  Check,
  ExternalLink,
  ImageIcon,
  FileText,
  Search,
  Filter,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

interface TabMediaProps {
  config: SiteConfig;
  setStatus: (status: string) => void;
  uploadAndSet: (
    file: File,
    folder: string,
    callback: (url: string) => void,
    fieldKey: string
  ) => Promise<void>;
  uploadingImage: string | null;
  inputClass: string;
}

type MediaItem = {
  url: string;
  source: string;
  type: "image" | "pdf" | "vector" | "other";
  category: "identity" | "projects" | "certificates" | "cv" | "appearance" | "stack";
};

export function TabMedia({
  config,
  setStatus,
  uploadAndSet,
  uploadingImage,
  inputClass,
}: TabMediaProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("projects");
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Scan and aggregate all active media references across config
  const mediaItems: MediaItem[] = [];

  const addMedia = (url: string | undefined, source: string, category: MediaItem["category"]) => {
    if (!url || typeof url !== "string" || !url.trim()) return;
    const cleanUrl = url.trim();
    if (mediaItems.some((m) => m.url === cleanUrl && m.source === source)) return;

    let type: MediaItem["type"] = "image";
    if (cleanUrl.endsWith(".pdf")) type = "pdf";
    else if (cleanUrl.endsWith(".svg")) type = "vector";

    mediaItems.push({
      url: cleanUrl,
      source,
      type,
      category,
    });
  };

  // 1. Identity & Header
  if (config.headerLogoUrl) addMedia(config.headerLogoUrl, "Header Brand Logo", "identity");
  if (config.generalProfile?.avatarUrl) addMedia(config.generalProfile.avatarUrl, "Foto Avatar Profil", "identity");

  // 2. Appearance (Lanyard & Profile Card)
  if (config.lanyard?.frontImage) addMedia(config.lanyard.frontImage, "Lanyard Depan", "appearance");
  if (config.lanyard?.backImage) addMedia(config.lanyard.backImage, "Lanyard Belakang", "appearance");
  if (config.lanyard?.strapImage) addMedia(config.lanyard.strapImage, "Lanyard Tali", "appearance");
  if (config.profileCard?.avatarUrl) addMedia(config.profileCard.avatarUrl, "Profile Card Avatar", "appearance");
  if (config.profileCard?.iconUrl) addMedia(config.profileCard.iconUrl, "Profile Card Badge Icon", "appearance");
  if (config.profileCard?.miniAvatarUrl) addMedia(config.profileCard.miniAvatarUrl, "Profile Card Mini Avatar", "appearance");

  // 3. Projects
  (config.projects || []).forEach((p) => {
    if (p.image) addMedia(p.image, `Cover: ${p.title}`, "projects");
    (p.galleryImages || []).forEach((g, i) => addMedia(g, `Galeri #${i + 1}: ${p.title}`, "projects"));
  });

  // 4. Certificates & Achievements
  (config.certificates || []).forEach((c) => {
    if (c.image) addMedia(c.image, `Sertifikat: ${c.title}`, "certificates");
    if (c.credentialPdf) addMedia(c.credentialPdf, `PDF Kredensial: ${c.title}`, "certificates");
  });
  (config.achievements || []).forEach((a) => {
    if (a.image) addMedia(a.image, `Prestasi: ${a.title}`, "certificates");
  });

  // 5. CV Docs
  (config.cvDocs || []).forEach((doc) => {
    if (doc.pdfUrl) addMedia(doc.pdfUrl, `Berkas PDF CV (${doc.roleKey})`, "cv");
    (doc.pages || []).forEach((pg, i) => addMedia(pg, `Halaman ${i + 1} CV (${doc.roleKey})`, "cv"));
  });

  // 6. Experience & Stack
  (config.experience || []).forEach((exp) => {
    if (exp.logo) addMedia(exp.logo, `Logo Organisasi: ${exp.org}`, "identity");
  });
  (config.techStack || []).forEach((stk) => {
    if (stk.icon) addMedia(stk.icon, `Ikon Tech Stack: ${stk.name}`, "stack");
  });

  const handleCopy = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setStatus("URL berkas disalin ke clipboard!");
      setTimeout(() => setCopiedUrl(null), 2500);
    }
  };

  const handleDirectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAndSet(
      file,
      selectedFolder,
      (url) => {
        setLastUploadedUrl(url);
        setStatus(`Berkas berhasil diunggah ke folder '${selectedFolder}'!`);
      },
      "media_quick_upload"
    );
  };

  const filteredMedia = mediaItems.filter((m) => {
    const matchesCat = filterCategory === "all" || m.category === filterCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      m.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-8">
      {/* Quick Upload Box */}
      <div className="rounded-2xl border border-line/70 bg-surface/50 p-6 dark:border-line/40 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-ink">Unggah Cepat Media & Konversi WebP Otomatis</h3>
            <p className="text-xs text-muted">
              Format PNG/JPG otomatis dikonversi ke WebP di browser sebelum diunggah ke Cloudflare R2 / Supabase Storage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted">Folder Target:</span>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm focus:border-brand focus:outline-none dark:border-line/60 dark:bg-slate-900"
            >
              <option value="projects">projects/</option>
              <option value="certificates">certificates/</option>
              <option value="cv">cv/</option>
              <option value="avatar">avatar/</option>
              <option value="misc">misc/</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand/90">
            <Upload className="size-4" />
            {uploadingImage === "media_quick_upload" ? "Memproses & Mengunggah..." : "Pilih Berkas untuk Diunggah"}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              disabled={uploadingImage === "media_quick_upload"}
              onChange={handleDirectUpload}
            />
          </label>

          {lastUploadedUrl && (
            <div className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-800 dark:text-emerald-300">
              <span className="truncate font-mono text-[11px]">{lastUploadedUrl}</span>
              <button
                type="button"
                onClick={() => handleCopy(lastUploadedUrl)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
              >
                {copiedUrl === lastUploadedUrl ? <Check className="size-3" /> : <Copy className="size-3" />}
                Salin URL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Asset Manager Gallery */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-ink">
              Pustaka Media Terpakai ({mediaItems.length} Berkas Aktif)
            </h3>
            <p className="text-xs text-muted">
              Daftar seluruh berkas visual dan dokumen yang saat ini ditautkan dalam portofolio Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 size-3.5 text-muted" />
              <input
                type="text"
                placeholder="Cari aset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 rounded-xl border border-line bg-white/80 py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none dark:border-line/60 dark:bg-slate-900/80"
              />
            </div>

            {/* Filter Category */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-line bg-white/80 px-2.5 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-line/60 dark:bg-slate-900/80"
            >
              <option value="all">Semua Kategori</option>
              <option value="identity">Identitas & Profil</option>
              <option value="projects">Proyek</option>
              <option value="certificates">Sertifikat & Prestasi</option>
              <option value="cv">Dokumen CV</option>
              <option value="appearance">Lanyard & 3D</option>
              <option value="stack">Tech Stack</option>
            </select>
          </div>
        </div>

        {filteredMedia.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/80 p-8 text-center">
            <ImageIcon className="mx-auto mb-2 size-8 text-muted" />
            <p className="text-sm font-medium text-ink">Tidak ada berkas yang cocok dengan filter</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMedia.map((item, idx) => (
              <div
                key={`${item.url}-${idx}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line/70 bg-white/80 p-3 shadow-sm transition hover:border-brand/40 hover:shadow-md dark:border-line/40 dark:bg-slate-900/60"
              >
                <div>
                  <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    {item.type === "pdf" ? (
                      <div className="flex flex-col items-center gap-1 text-rose-500">
                        <FileText className="size-8" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">PDF Dokumen</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={item.source}
                        className="size-full object-contain p-1 transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                      {item.type}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <p className="truncate text-xs font-bold text-ink" title={item.source}>
                      {item.source}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted" title={item.url}>
                      {item.url}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2.5">
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[9px] font-semibold text-brand">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.url)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-ink transition hover:bg-surface dark:hover:bg-slate-800"
                      title="Salin URL"
                    >
                      {copiedUrl === item.url ? (
                        <>
                          <Check className="size-3 text-emerald-500" /> Disalin
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" /> Salin
                        </>
                      )}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-1 text-muted transition hover:bg-surface hover:text-ink dark:hover:bg-slate-800"
                      title="Buka Berkas"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEO & SERP Simulator */}
      <div className="rounded-2xl border border-line/70 bg-white/70 p-6 shadow-sm dark:border-line/40 dark:bg-slate-900/60">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            <h3 className="text-sm font-bold text-ink">Pratinjau Hasil Pencarian Google (SERP Preview)</h3>
          </div>
          <span className="text-[11px] text-muted">Data dinamis dari profil aktif</span>
        </div>

        <div className="max-w-2xl rounded-xl border border-line/50 bg-slate-50 p-4 font-sans dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {config.generalProfile?.name || "Zakaria Mujur Prasetyo"}
            </span>
            <span>https://zekktech.biz.id</span>
          </div>
          <h4 className="mt-1 text-base font-medium text-blue-700 hover:underline dark:text-blue-400">
            {config.generalProfile?.name || "Zakaria Mujur Prasetyo"} | {config.generalProfile?.roles || "UI/UX Designer & Frontend Developer"}
          </h4>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
            {config.generalProfile?.heroDesc ||
              "Portfolio resmi Zakaria Mujur Prasetyo (ZekkTech). UI/UX Designer, Frontend Developer, dan Graphic Designer asal Mojokerto, Jawa Timur."}
          </p>
        </div>
      </div>
    </div>
  );
}
