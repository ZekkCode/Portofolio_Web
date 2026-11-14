"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { SiteConfig } from "@/lib/site-store";
import { scanReferencedMedia, type MediaCatalogItem } from "@/lib/content/media-catalog";
import { ConfirmImpactModal, type DeleteImpactItem } from "./ConfirmImpactModal";
import {
  Upload,
  Copy,
  Check,
  ExternalLink,
  ImageIcon,
  FileText,
  Search,
  Sparkles,
  Trash2,
  RefreshCw,
  HardDrive,
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

interface R2ListedObject {
  key: string;
  url: string;
  size: number;
  lastModified?: string;
  isReferenced: boolean;
  usedIn: string[];
}

export function TabMedia({
  config,
  setStatus,
  uploadAndSet,
  uploadingImage,
}: TabMediaProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("projects");
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "referenced" | "orphan">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [r2Configured, setR2Configured] = useState<boolean>(false);
  const [r2Objects, setR2Objects] = useState<R2ListedObject[]>([]);
  const [loadingStorage, setLoadingStorage] = useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = useState<DeleteImpactItem | null>(null);

  const loadR2Inventory = useCallback(async () => {
    setLoadingStorage(true);
    try {
      const res = await fetch("/api/upload?action=list", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setR2Configured(Boolean(data.configured));
      if (Array.isArray(data.items)) {
        setR2Objects(data.items);
      }
    } catch {
      // Offline / local mode fallback cleanly renders config-referenced items only
    } finally {
      setLoadingStorage(false);
    }
  }, []);

  useEffect(() => {
    void loadR2Inventory();
  }, [loadR2Inventory]);

  const referencedItems: MediaCatalogItem[] = useMemo(
    () => scanReferencedMedia(config),
    [config]
  );

  // Merge live R2 storage objects + referenced items so orphans become visible & manageable
  const combinedItems = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        url: string;
        key?: string;
        source: string;
        category: string;
        type: string;
        isReferenced: boolean;
        size?: number;
        usedIn: string[];
      }
    >();

    for (const item of referencedItems) {
      map.set(item.url, {
        id: item.id,
        url: item.url,
        key: item.key,
        source: item.source,
        category: item.category,
        type: item.type,
        isReferenced: true,
        usedIn: item.sources,
      });
    }

    for (const obj of r2Objects) {
      const existing = map.get(obj.url);
      if (existing) {
        existing.key = obj.key;
        existing.size = obj.size;
        if (obj.usedIn.length > 0) {
          existing.usedIn = Array.from(new Set([...existing.usedIn, ...obj.usedIn]));
        }
      } else {
        const lower = obj.key.toLowerCase();
        const type = lower.endsWith(".pdf")
          ? "pdf"
          : lower.endsWith(".svg")
          ? "vector"
          : "image";
        const folder = obj.key.split("/")[0] || "storage";
        map.set(obj.url, {
          id: `r2-${obj.key}`,
          url: obj.url,
          key: obj.key,
          source: obj.isReferenced ? obj.usedIn.join(" • ") : "Berkas R2 Tidak Terpakai (Orphan)",
          category: folder,
          type,
          isReferenced: obj.isReferenced,
          size: obj.size,
          usedIn: obj.usedIn,
        });
      }
    }

    return Array.from(map.values());
  }, [referencedItems, r2Objects]);

  const orphanCount = useMemo(
    () => combinedItems.filter((i) => !i.isReferenced && i.key).length,
    [combinedItems]
  );

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
    void uploadAndSet(
      file,
      selectedFolder,
      (url) => {
        setLastUploadedUrl(url);
        setStatus(`Berkas berhasil diunggah ke folder '${selectedFolder}'!`);
        void loadR2Inventory();
      },
      "media_quick_upload"
    );
  };

  const requestDeleteR2Object = (item: (typeof combinedItems)[number]) => {
    setPendingDelete({
      entityType: "Objek Cloudflare R2",
      itemName: item.key || item.url,
      impacts: item.isReferenced
        ? [
            `PERHATIAN: Berkas ini masih dipakai di: ${item.usedIn.join(", ")}. Server akan menolak penghapusan sebelum referensi dilepas dan dipublikasikan.`,
          ]
        : [
            "Berkas tidak terpakai pada versi Draft maupun Publik.",
            "Menghapus objek dari bucket Cloudflare R2 bersifat permanen dan menghemat ruang storage.",
          ],
      onConfirm: async () => {
        try {
          const res = await fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: item.key, url: item.url }),
          });
          const data = await res.json();
          if (!res.ok) {
            setStatus(`Ditolak server: ${data.error || "Gagal menghapus berkas"}`);
          } else {
            setStatus("Berkas berhasil dihapus permanen dari Cloudflare R2");
            void loadR2Inventory();
          }
        } catch {
          setStatus("Gagal menghubungi endpoint DELETE /api/upload");
        } finally {
          setPendingDelete(null);
        }
      },
    });
  };

  const filteredMedia = combinedItems.filter((m) => {
    if (filterMode === "referenced" && !m.isReferenced) return false;
    if (filterMode === "orphan" && m.isReferenced) return false;
    const matchesCat = filterCategory === "all" || m.category === filterCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      m.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.key || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const seo = config.seo;
  const profile = config.generalProfile;
  const displaySeoTitle =
    seo?.metaTitle || `${profile?.name || "Zakaria Mujur Prasetyo"} | ${profile?.roles || "Portfolio"}`;
  const displaySeoDesc = seo?.metaDesc || profile?.heroDesc || "";

  return (
    <div className="space-y-8">
      <ConfirmImpactModal pendingDelete={pendingDelete} onCancel={() => setPendingDelete(null)} />

      {/* Quick Upload Box */}
      <div className="rounded-2xl border border-line/70 bg-surface/50 p-6 dark:border-line/40 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-ink">
              Unggah Cepat Media (WebP Otomatis + Sanitasi SVG + PDF)
            </h3>
            <p className="text-xs text-muted">
              PNG/JPG dikonversi ke WebP; SVG disanitasi otomatis dari script/XSS sebelum masuk storage R2.
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
              <option value="profile">profile/</option>
              <option value="lanyard">lanyard/</option>
              <option value="education">education/</option>
              <option value="experience">experience/</option>
              <option value="achievements">achievements/</option>
              <option value="logos">logos/</option>
              <option value="services">services/</option>
              <option value="blog">blog/</option>
              <option value="seo">seo/</option>
              <option value="misc">misc/</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand/90">
            <Upload className="size-4" />
            <span>
              {uploadingImage === "media_quick_upload"
                ? "Memproses & Mengunggah..."
                : "Pilih Berkas (Img / SVG / PDF)"}
            </span>
            <input
              type="file"
              accept="image/*,.svg,application/pdf"
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
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink">
                Pustaka Media & Storage ({combinedItems.length} Aset)
              </h3>
              {r2Configured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  <HardDrive className="size-3" /> R2 Live ({r2Objects.length} objek)
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                  Katalog Referensi Lokal
                </span>
              )}
              {orphanCount > 0 && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                  {orphanCount} Orphan
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              Aset yang tidak terpakai di Draft maupun Publik ditandai Orphan dan dapat dihapus dengan aman.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadR2Inventory}
              disabled={loadingStorage}
              className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface dark:border-line/60 dark:bg-slate-900"
            >
              <RefreshCw className={`size-3.5 ${loadingStorage ? "animate-spin" : ""}`} />
              <span>Muat Ulang R2</span>
            </button>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 size-3.5 text-muted" />
              <input
                type="text"
                placeholder="Cari aset / key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 rounded-xl border border-line bg-white/80 py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none dark:border-line/60 dark:bg-slate-900/80"
              />
            </div>

            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as "all" | "referenced" | "orphan")}
              className="rounded-xl border border-line bg-white/80 px-2.5 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-line/60 dark:bg-slate-900/80"
            >
              <option value="all">Semua Status</option>
              <option value="referenced">Terpakai Saja</option>
              <option value="orphan">Orphan (Tidak Terpakai)</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-line bg-white/80 px-2.5 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-line/60 dark:bg-slate-900/80"
            >
              <option value="all">Semua Kategori</option>
              <option value="identity">Identitas & Profil</option>
              <option value="projects">Proyek</option>
              <option value="education">Pendidikan</option>
              <option value="experience">Pengalaman</option>
              <option value="certificates">Sertifikat</option>
              <option value="achievements">Prestasi</option>
              <option value="cv">Dokumen CV</option>
              <option value="appearance">Lanyard & 3D</option>
              <option value="stack">Tech Stack</option>
              <option value="services">Layanan</option>
              <option value="blog">Blog</option>
              <option value="seo">SEO / OG</option>
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
            {filteredMedia.map((item) => (
              <div
                key={item.id}
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
                    {!item.isReferenced && (
                      <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        Orphan
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <p className="truncate text-xs font-bold text-ink" title={item.source}>
                      {item.source}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted" title={item.url}>
                      {item.key || item.url}
                    </p>
                    {typeof item.size === "number" && (
                      <p className="mt-0.5 font-mono text-[10px] text-muted">
                        {(item.size / 1024).toFixed(1)} KB
                      </p>
                    )}
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
                    {item.key && r2Configured && (
                      <button
                        type="button"
                        onClick={() => requestDeleteR2Object(item)}
                        className="rounded-lg p-1 text-rose-500 transition hover:bg-rose-500/10"
                        title="Hapus Objek R2"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
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
          <span className="text-[11px] text-muted">Atur detail lengkap pada tab Tampilan -&gt; SEO &amp; OpenGraph</span>
        </div>

        <div className="max-w-2xl rounded-xl border border-line/50 bg-slate-50 p-4 font-sans dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {profile?.name || "Zakaria Mujur Prasetyo"}
            </span>
            <span>{seo?.canonicalUrl || profile?.site || "https://zakariamp.vercel.app"}</span>
          </div>
          <h4 className="mt-1 text-base font-medium text-blue-700 hover:underline dark:text-blue-400">
            {displaySeoTitle}
          </h4>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
            {displaySeoDesc}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TabMedia;
