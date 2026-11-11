"use client";

import { useState } from "react";
import type { SiteConfig, TechStackItem, ServiceItemConfig } from "@/lib/site-store";
import { Plus, Trash2, ChevronUp, ChevronDown, Wrench, Layers, Upload, ExternalLink } from "lucide-react";

interface TabExpertiseProps {
  config: SiteConfig;
  setDraft: (next: SiteConfig) => void;
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

export function TabExpertise({
  config,
  setDraft,
  setStatus,
  uploadAndSet,
  uploadingImage,
  inputClass,
}: TabExpertiseProps) {
  const [subTab, setSubTab] = useState<"stack" | "services">("stack");

  // ===================== TECH STACK CRUD =====================
  const addTechStackItem = () => {
    const newItem: TechStackItem = {
      id: "ts-" + Date.now(),
      name: "Alat Baru",
      category: "frontend",
      icon: "/icons/nextjs.svg",
      sortOrder: (config.techStack?.length || 0) + 1,
      visible: true,
    };
    setDraft({ ...config, techStack: [...(config.techStack || []), newItem] });
    setStatus("Alat teknologi baru ditambahkan");
  };

  const updateTechStackItem = (id: string, updates: Partial<TechStackItem>) => {
    setDraft({
      ...config,
      techStack: (config.techStack || []).map((t) => (t.id === id ? { ...t, ...updates } : t)),
    });
    setStatus("Alat teknologi diperbarui");
  };

  const deleteTechStackItem = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus alat teknologi ini dari Tech Stack?")) return;
    setDraft({
      ...config,
      techStack: (config.techStack || []).filter((t) => t.id !== id),
    });
    setStatus("Alat teknologi dihapus");
  };

  const moveTechStackItem = (id: string, direction: "up" | "down") => {
    const list = [...(config.techStack || [])];
    const index = list.findIndex((t) => t.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, techStack: list });
    setStatus("Urutan alat diubah");
  };

  // ===================== SERVICES CRUD =====================
  const addService = () => {
    const num = String((config.services?.length || 0) + 1).padStart(2, "0");
    const newService: ServiceItemConfig = {
      id: "srv-" + Date.now(),
      key: `s${num}`,
      num,
      titleId: "Layanan Baru",
      titleEn: "New Service",
      descId: "Deskripsi ruang lingkup pekerjaan dan hasil yang diserahkan...",
      descEn: "Description of deliverables and workflows...",
      iconName: "layout",
      sortOrder: (config.services?.length || 0) + 1,
      visible: true,
    };
    setDraft({ ...config, services: [...(config.services || []), newService] });
    setStatus("Layanan baru ditambahkan");
  };

  const updateService = (id: string, updates: Partial<ServiceItemConfig>) => {
    setDraft({
      ...config,
      services: (config.services || []).map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
    setStatus("Data layanan diperbarui");
  };

  const deleteService = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus layanan ini dari portofolio?")) return;
    setDraft({
      ...config,
      services: (config.services || []).filter((s) => s.id !== id),
    });
    setStatus("Layanan dihapus");
  };

  const moveService = (id: string, direction: "up" | "down") => {
    const list = [...(config.services || [])];
    const index = list.findIndex((s) => s.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, services: list });
    setStatus("Urutan layanan diubah");
  };

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex items-center gap-2 border-b border-line pb-3 dark:border-line/40">
        <button
          type="button"
          onClick={() => setSubTab("stack")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "stack"
              ? "bg-brand text-white shadow-xs"
              : "border border-line text-body hover:text-ink dark:border-line/40"
          }`}
        >
          <Wrench className="size-4" />
          <span>Tech Stack & Alat ({config.techStack?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("services")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "services"
              ? "bg-brand text-white shadow-xs"
              : "border border-line text-body hover:text-ink dark:border-line/40"
          }`}
        >
          <Layers className="size-4" />
          <span>4 Pilar Layanan ({config.services?.length || 0})</span>
        </button>
      </div>

      {subTab === "stack" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Manajemen Tech Stack</h2>
              <p className="text-xs text-muted">Ditampilkan pada grid 4 kategori dan pita animasi marquee</p>
            </div>
            <button
              type="button"
              onClick={addTechStackItem}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Alat</span>
            </button>
          </div>

          <div className="space-y-3">
            {(config.techStack || []).map((tool, idx) => (
              <div
                key={tool.id}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface dark:border-line/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tool.icon} alt={tool.name} className="size-5 object-contain" />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={tool.name}
                      onChange={(e) => updateTechStackItem(tool.id, { name: e.target.value })}
                      className="font-display text-sm font-bold text-ink bg-transparent border-b border-dashed border-line focus:outline-none focus:border-brand"
                    />
                    <div className="mt-1 flex items-center gap-2">
                      <select
                        value={tool.category}
                        onChange={(e) => updateTechStackItem(tool.id, { category: e.target.value as any })}
                        className="rounded border border-line bg-surface/50 px-2 py-0.5 text-[11px] text-body dark:border-line/30 dark:bg-slate-900"
                      >
                        <option value="uiux">UI/UX & Desain</option>
                        <option value="frontend">Frontend Web</option>
                        <option value="visual">Desain Grafis / Media</option>
                        <option value="systems">Sistem & Basis Data</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tool.icon}
                      onChange={(e) => updateTechStackItem(tool.id, { icon: e.target.value })}
                      className="w-36 rounded-lg border border-line px-2 py-1 text-xs text-body dark:border-line/40 dark:bg-slate-900"
                      placeholder="/icons/..."
                    />
                    <label
                      className={`flex cursor-pointer items-center rounded-lg border border-line px-2 py-1 text-xs text-ink hover:bg-surface dark:border-line/40 ${
                        uploadingImage === `ts-${tool.id}` ? "opacity-50" : ""
                      }`}
                    >
                      <Upload className="size-3" />
                      <input
                        type="file"
                        accept="image/svg+xml,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            void uploadAndSet(
                              f,
                              "logos",
                              (url) => updateTechStackItem(tool.id, { icon: url }),
                              `ts-${tool.id}`
                            );
                          }
                        }}
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-1 text-xs text-body">
                    <input
                      type="checkbox"
                      checked={tool.visible !== false}
                      onChange={(e) => updateTechStackItem(tool.id, { visible: e.target.checked })}
                      className="size-4 rounded border-line text-brand focus:ring-brand"
                    />
                    <span>Aktif</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => moveTechStackItem(tool.id, "up")}
                    disabled={idx === 0}
                    className="rounded-lg p-1 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTechStackItem(tool.id, "down")}
                    disabled={idx === (config.techStack?.length || 0) - 1}
                    className="rounded-lg p-1 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTechStackItem(tool.id)}
                    className="rounded-lg p-1 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Manajemen Pilar Layanan</h2>
              <p className="text-xs text-muted">Ditampilkan pada seksi 4 Pilar Layanan</p>
            </div>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Layanan</span>
            </button>
          </div>

          <div className="space-y-4">
            {(config.services || []).map((srv, idx) => (
              <div
                key={srv.id}
                className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">{srv.num || `0${idx + 1}`}</span>
                    <h3 className="font-display text-sm font-bold text-ink">{srv.titleId}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-body">
                      <input
                        type="checkbox"
                        checked={srv.visible !== false}
                        onChange={(e) => updateService(srv.id, { visible: e.target.checked })}
                        className="size-4 rounded border-line text-brand focus:ring-brand"
                      />
                      <span>Publik</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => moveService(srv.id, "up")}
                      disabled={idx === 0}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveService(srv.id, "down")}
                      disabled={idx === (config.services?.length || 0) - 1}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteService(srv.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink">Judul Layanan (ID)</label>
                    <input
                      type="text"
                      value={srv.titleId}
                      onChange={(e) => updateService(srv.id, { titleId: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Service Title (EN)</label>
                    <input
                      type="text"
                      value={srv.titleEn}
                      onChange={(e) => updateService(srv.id, { titleEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Ikon Layanan</label>
                    <select
                      value={srv.iconName}
                      onChange={(e) => updateService(srv.id, { iconName: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    >
                      <option value="layout">Layout / UI/UX</option>
                      <option value="code">Code / Frontend</option>
                      <option value="video">Video / Visual Media</option>
                      <option value="server">Server / IT Systems</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Tautan CTA Opsional</label>
                    <input
                      type="text"
                      value={srv.ctaUrl || ""}
                      onChange={(e) => updateService(srv.id, { ctaUrl: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="https://... atau #kontak"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Deskripsi Layanan (ID)</label>
                    <textarea
                      rows={3}
                      value={srv.descId}
                      onChange={(e) => updateService(srv.id, { descId: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Service Description (EN)</label>
                    <textarea
                      rows={3}
                      value={srv.descEn}
                      onChange={(e) => updateService(srv.id, { descEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TabExpertise;
