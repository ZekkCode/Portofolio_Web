"use client";

import { useState, useEffect, useMemo } from "react";
import { Upload, FolderSearch, Trash2, X, FileText, Search, ExternalLink } from "lucide-react";
import type { SiteConfig } from "@/lib/site-store";
import { scanReferencedMedia } from "@/lib/content/media-catalog";

interface R2ListItem {
  key: string;
  url: string;
  size: number;
  lastModified?: string;
}

interface MediaFieldControlProps {
  label: string;
  value: string;
  onChange: (nextUrl: string) => void;
  folder: string;
  fieldKey: string;
  uploadAndSet: (
    file: File,
    folder: string,
    callback: (url: string) => void,
    fieldKey: string
  ) => Promise<void> | void;
  uploadingImage: string | null;
  config: SiteConfig;
  accept?: string;
  placeholder?: string;
  helpText?: string;
  previewShape?: "square" | "wide" | "avatar" | "pdf" | "portrait";
}

export function MediaFieldControl({
  label,
  value,
  onChange,
  folder,
  fieldKey,
  uploadAndSet,
  uploadingImage,
  config,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif",
  placeholder = "/... atau https://...",
  helpText,
  previewShape = "square",
}: MediaFieldControlProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [r2Items, setR2Items] = useState<R2ListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isUploading = uploadingImage === fieldKey;
  const isPdf = previewShape === "pdf" || /\.pdf(\?|$)/i.test(value || "") || (value || "").startsWith("data:application/pdf");

  useEffect(() => {
    if (!pickerOpen) return;
    setLoadingList(true);
    fetch("/api/upload?action=list", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = data?.items || data?.objects;
        if (Array.isArray(list)) {
          setR2Items(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [pickerOpen]);

  const pickerChoices = useMemo(() => {
    const map = new Map<string, { url: string; label: string; category: string }>();
    for (const item of r2Items) {
      map.set(item.url, { url: item.url, label: item.key, category: "r2" });
    }
    for (const ref of scanReferencedMedia(config)) {
      if (!map.has(ref.url)) {
        map.set(ref.url, { url: ref.url, label: ref.source, category: ref.category });
      }
    }
    const q = searchQuery.trim().toLowerCase();
    return Array.from(map.values()).filter((item) => {
      if (accept.includes("pdf") && !accept.includes("image")) {
        if (!/\.pdf/i.test(item.url) && !item.category.includes("cv") && !item.category.includes("cert")) {
          // still show if matches search
        }
      }
      if (!q) return true;
      return (
        item.url.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [r2Items, config, searchQuery, accept]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-semibold text-body">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 hover:underline dark:text-rose-400"
          >
            <Trash2 className="size-3" />
            <span>Hapus Media</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-[160px] rounded-xl border border-line bg-surface/60 px-3 py-1.5 text-xs font-mono text-ink placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none dark:border-line/60 dark:bg-slate-900/60"
        />

        <label
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/15 dark:text-blue-400 ${
            isUploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Upload className="size-3.5" />
          <span>{isUploading ? "Mengunggah..." : "Unggah"}</span>
          <input
            type="file"
            accept={accept}
            disabled={isUploading}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadAndSet(file, folder, onChange, fieldKey);
              }
              e.target.value = "";
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line/70 bg-white px-3 py-1.5 text-xs font-semibold text-body hover:border-brand/40 hover:text-brand dark:border-line/50 dark:bg-slate-900"
        >
          <FolderSearch className="size-3.5" />
          <span>Pilih Media</span>
        </button>
      </div>

      {helpText && <p className="text-[10px] text-muted">{helpText}</p>}

      {value && (
        <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-line/50 bg-surface/40 p-2 dark:border-line/30 dark:bg-slate-900/40">
          {isPdf ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-brand">
              <FileText className="size-5" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              className={
                previewShape === "wide"
                  ? "h-12 w-20 shrink-0 rounded-lg border border-line/50 object-cover bg-white"
                  : previewShape === "portrait"
                  ? "h-14 w-10 shrink-0 rounded-lg border border-line/50 object-cover bg-white"
                  : previewShape === "avatar"
                  ? "size-11 shrink-0 rounded-full border border-line/50 object-cover bg-white"
                  : "size-11 shrink-0 rounded-lg border border-line/50 object-contain bg-white p-0.5"
              }
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[10px] text-ink">{value}</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-brand hover:underline"
            >
              <span>Buka Pratinjau</span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>
      )}

      {/* Pustaka Media Picker Modal */}
      {pickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Pilih Media untuk ${label}`}
          className="fixed inset-0 z-[105] flex items-center justify-center p-4"
        >
          <div
            onClick={() => setPickerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="relative z-10 flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl dark:border-line/60 dark:bg-[#0e111a]">
            <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
              <div>
                <h3 className="font-display text-sm font-bold text-ink">
                  Pilih dari Pustaka Media
                </h3>
                <p className="text-[11px] text-muted">
                  Aset Cloudflare R2 & berkas aktif di website ({pickerChoices.length} berkas)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:text-ink"
                aria-label="Tutup pemilih media"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="border-b border-line/50 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama file, kategori, atau URL..."
                  className="w-full rounded-xl border border-line bg-surface/60 pl-8 pr-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-line/50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingList && pickerChoices.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted">Memuat daftar berkas...</p>
              ) : pickerChoices.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted">Tidak ada berkas yang cocok.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pickerChoices.map((choice) => {
                    const pdfChoice = /\.pdf(\?|$)/i.test(choice.url);
                    return (
                      <button
                        key={choice.url}
                        type="button"
                        onClick={() => {
                          onChange(choice.url);
                          setPickerOpen(false);
                        }}
                        className={`group flex flex-col overflow-hidden rounded-xl border text-left transition hover:border-brand ${
                          value === choice.url
                            ? "border-brand bg-brand/5"
                            : "border-line/60 bg-white dark:border-line/40 dark:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex h-24 w-full items-center justify-center bg-surface/60 overflow-hidden dark:bg-slate-950/60">
                          {pdfChoice ? (
                            <FileText className="size-8 text-brand" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={choice.url}
                              alt={choice.label}
                              loading="lazy"
                              className="h-full w-full object-contain p-1 group-hover:scale-105 transition"
                            />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="truncate text-[11px] font-semibold text-ink">{choice.label}</p>
                          <p className="truncate font-mono text-[10px] text-muted">{choice.category}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
