"use client";

import { useState } from "react";
import type { SiteConfig, FaqItemConfig, BlogConfig } from "@/lib/site-store";
import { Plus, Trash2, ChevronUp, ChevronDown, HelpCircle, Newspaper, Globe, Eye, EyeOff } from "lucide-react";

interface TabContentProps {
  config: SiteConfig;
  setDraft: (next: SiteConfig) => void;
  setStatus: (status: string) => void;
  inputClass: string;
}

export function TabContent({ config, setDraft, setStatus, inputClass }: TabContentProps) {
  const [subTab, setSubTab] = useState<"faq" | "blog">("faq");

  // ===================== FAQ CRUD =====================
  const addFaq = () => {
    const newFaq: FaqItemConfig = {
      id: "faq-" + Date.now(),
      questionId: "Pertanyaan Baru",
      questionEn: "New Question",
      answerId: "Jawaban penjelasan ringkas dan informatif...",
      answerEn: "Concise and informative explanation answer...",
      visible: true,
      sortOrder: (config.faq?.length || 0) + 1,
    };
    setDraft({ ...config, faq: [...(config.faq || []), newFaq] });
    setStatus("Item FAQ baru ditambahkan");
  };

  const updateFaq = (id: string, updates: Partial<FaqItemConfig>) => {
    setDraft({
      ...config,
      faq: (config.faq || []).map((item) => (item.id === id ? { ...item, ...updates } : item)),
    });
    setStatus("Data FAQ diperbarui");
  };

  const deleteFaq = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus pertanyaan FAQ ini?")) return;
    setDraft({
      ...config,
      faq: (config.faq || []).filter((item) => item.id !== id),
    });
    setStatus("Item FAQ dihapus");
  };

  const moveFaq = (id: string, direction: "up" | "down") => {
    const list = [...(config.faq || [])];
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, faq: list.map((item, idx) => ({ ...item, sortOrder: idx + 1 })) });
    setStatus("Urutan FAQ diubah");
  };

  // ===================== BLOG SETTINGS =====================
  const updateBlog = (updates: Partial<BlogConfig>) => {
    setDraft({
      ...config,
      blog: {
        ...config.blog,
        ...updates,
      },
    });
    setStatus("Pengaturan Blog ZekkTech diperbarui");
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-3">
        <button
          type="button"
          onClick={() => setSubTab("faq")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "faq"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <HelpCircle className="size-4" />
          FAQ Pertanyaan Umum ({config.faq?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setSubTab("blog")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "blog"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <Newspaper className="size-4" />
          Integrasi Blog ZekkTech
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
              config.blog?.visible
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-500/10 text-slate-500"
            }`}
          >
            {config.blog?.visible ? "Aktif" : "Nonaktif"}
          </span>
        </button>
      </div>

      {/* ===================== SUBTAB 1: FAQ ===================== */}
      {subTab === "faq" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 bg-surface/50 p-4 dark:border-line/40 dark:bg-slate-900/40">
            <div>
              <h3 className="text-sm font-bold text-ink">Daftar Pertanyaan yang Sering Diajukan (FAQ)</h3>
              <p className="text-xs text-muted">
                Kelola pertanyaan seputar ketersediaan kerja sama, proses revisi, format serah terima, dan spesialisasi layanan.
              </p>
            </div>
            <button
              type="button"
              onClick={addFaq}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand/90"
            >
              <Plus className="size-3.5" />
              Tambah FAQ
            </button>
          </div>

          {(!config.faq || config.faq.length === 0) && (
            <div className="rounded-2xl border border-dashed border-line/80 p-8 text-center">
              <HelpCircle className="mx-auto mb-2 size-8 text-muted" />
              <p className="text-sm font-medium text-ink">Belum Ada Pertanyaan FAQ</p>
              <p className="text-xs text-muted">Klik &quot;Tambah FAQ&quot; untuk menambahkan butir tanya-jawab baru.</p>
            </div>
          )}

          <div className="space-y-4">
            {(config.faq || []).map((item, idx) => (
              <div
                key={item.id}
                className="relative rounded-2xl border border-line/70 bg-white/70 p-5 shadow-sm transition hover:border-brand/40 dark:border-line/40 dark:bg-slate-900/60"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-brand/10 font-mono text-[11px] font-bold text-brand">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {item.questionId || "Pertanyaan Baru"}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateFaq(item.id, { visible: item.visible === false ? true : false })}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
                        item.visible !== false
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-500/10 text-slate-500"
                      }`}
                      title={item.visible !== false ? "Klik untuk sembunyikan dari situs" : "Klik untuk tampilkan"}
                    >
                      {item.visible !== false ? (
                        <>
                          <Eye className="size-3" /> Tampil
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-3" /> Tersembunyi
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveFaq(item.id, "up")}
                      disabled={idx === 0}
                      className="rounded-lg p-1.5 text-muted hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-800"
                      title="Geser Naik"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFaq(item.id, "down")}
                      disabled={idx === (config.faq?.length || 0) - 1}
                      className="rounded-lg p-1.5 text-muted hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-800"
                      title="Geser Turun"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFaq(item.id)}
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10"
                      title="Hapus FAQ"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-muted">
                        Pertanyaan (Bahasa Indonesia) *
                      </label>
                      <input
                        type="text"
                        value={item.questionId}
                        onChange={(e) => updateFaq(item.id, { questionId: e.target.value })}
                        className={inputClass}
                        placeholder="Berapa lama estimasi pengerjaan suatu proyek?"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-muted">
                        Jawaban (Bahasa Indonesia) *
                      </label>
                      <textarea
                        rows={4}
                        value={item.answerId}
                        onChange={(e) => updateFaq(item.id, { answerId: e.target.value })}
                        className={inputClass}
                        placeholder="Estimasi berkisar antara 1 hingga 3 minggu tergantung pada kompleksitas..."
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-muted">
                        Question (English)
                      </label>
                      <input
                        type="text"
                        value={item.questionEn || ""}
                        onChange={(e) => updateFaq(item.id, { questionEn: e.target.value })}
                        className={inputClass}
                        placeholder="What is the typical project turnaround time?"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-muted">
                        Answer (English)
                      </label>
                      <textarea
                        rows={4}
                        value={item.answerEn || ""}
                        onChange={(e) => updateFaq(item.id, { answerEn: e.target.value })}
                        className={inputClass}
                        placeholder="Turnaround times typically range between 1 to 3 weeks depending on scope..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 2: BLOG INTEGRATION ===================== */}
      {subTab === "blog" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line/70 bg-surface/50 p-5 dark:border-line/40 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-ink">Integrasi Blog Publik ZekkTech</h3>
                <p className="text-xs text-muted">
                  Hubungkan dengan portal blog ZekkTech (`https://zekktech.biz.id/blog`) atau feed artikel eksternal.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/80 px-3.5 py-2 text-xs font-semibold text-ink shadow-sm dark:bg-slate-800">
                <input
                  type="checkbox"
                  checked={config.blog?.visible ?? true}
                  onChange={(e) => updateBlog({ visible: e.target.checked })}
                  className="size-4 rounded text-brand focus:ring-brand"
                />
                Tampilkan Seksi Blog di Halaman Depan
              </label>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-line/70 bg-white/70 p-5 shadow-sm dark:border-line/40 dark:bg-slate-900/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Pengaturan Tautan & Feed</h4>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted">
                  URL Portal Blog / RSS Feed
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 size-4 text-muted" />
                  <input
                    type="url"
                    value={config.blog?.feedUrl || ""}
                    onChange={(e) => updateBlog({ feedUrl: e.target.value })}
                    className={`${inputClass} pl-9`}
                    placeholder="https://zekktech.biz.id/blog"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  Tautan ke portal artikel lengkap saat pengunjung mengklik &quot;Lihat Semua Artikel&quot;.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted">
                  Jumlah Artikel yang Ditampilkan di Preview
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={config.blog?.displayCount || 3}
                  onChange={(e) => updateBlog({ displayCount: parseInt(e.target.value, 10) || 3 })}
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-muted">
                  Rekomendasi: 3 artikel untuk menjaga keseimbangan layout 3-kolom.
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-line/70 bg-white/70 p-5 shadow-sm dark:border-line/40 dark:bg-slate-900/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Kustomisasi Judul & Teks Seksi</h4>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted">
                  Judul Seksi (Bahasa Indonesia)
                </label>
                <input
                  type="text"
                  value={config.blog?.titleId || ""}
                  onChange={(e) => updateBlog({ titleId: e.target.value })}
                  className={inputClass}
                  placeholder="Catatan & Tulisan Terpilih"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted">
                  Deskripsi Seksi (Bahasa Indonesia)
                </label>
                <textarea
                  rows={2}
                  value={config.blog?.descId || ""}
                  onChange={(e) => updateBlog({ descId: e.target.value })}
                  className={inputClass}
                  placeholder="Dokumentasi eksplorasi teknis, catatan arsitektur frontend, dan wawasan desain..."
                />
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">
                    Section Title (English)
                  </label>
                  <input
                    type="text"
                    value={config.blog?.titleEn || ""}
                    onChange={(e) => updateBlog({ titleEn: e.target.value })}
                    className={inputClass}
                    placeholder="Selected Articles & Logs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">
                    Section Description (English)
                  </label>
                  <input
                    type="text"
                    value={config.blog?.descEn || ""}
                    onChange={(e) => updateBlog({ descEn: e.target.value })}
                    className={inputClass}
                    placeholder="Technical exploration notes and design insights..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
