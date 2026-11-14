"use client";

import { useState, useMemo } from "react";
import type {
  SiteConfig,
  TechStackItem,
  TechStackCategoryConfig,
  ServiceItemConfig,
} from "@/lib/site-config";
import { MediaFieldControl } from "./MediaFieldControl";
import { ConfirmImpactModal, type DeleteImpactItem } from "./ConfirmImpactModal";
import {
  AdminSearchFilterBar,
  AdminPaginationBar,
  AdminItemActionBar,
  reorderItemsWithSortOrder,
  useDragReorder,
} from "./AdminListTools";
import {
  Plus,
  Wrench,
  Layers,
  Tag,
  ChevronUp,
  ChevronDown,
  Trash2,
  AlertCircle,
} from "lucide-react";

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

const STACK_PAGE_SIZE = 15;
const SERVICE_PAGE_SIZE = 10;

function matchesStatusFilter(
  item: { published?: boolean; visible?: boolean },
  filter: "all" | "published" | "draft" | "hidden"
): boolean {
  if (filter === "published") return item.published !== false && item.visible !== false;
  if (filter === "draft") return item.published === false;
  if (filter === "hidden") return item.published !== false && item.visible === false;
  return true;
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

  // Tech stack filters & category drawer
  const [stackSearch, setStackSearch] = useState("");
  const [stackCategoryFilter, setStackCategoryFilter] = useState("all");
  const [stackStatusFilter, setStackStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all");
  const [stackPage, setStackPage] = useState(1);
  const [showCatManager, setShowCatManager] = useState(false);

  // Services filters
  const [srvSearch, setSrvSearch] = useState("");
  const [srvStatusFilter, setSrvStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all");
  const [srvPage, setSrvPage] = useState(1);

  const [pendingDelete, setPendingDelete] = useState<DeleteImpactItem | null>(null);

  const stackList = config.techStack || [];
  const categories = config.techStackCategories || [];
  const servicesList = config.services || [];

  // ===================== TECH STACK CATEGORIES CRUD =====================
  const addCategory = () => {
    const key = "cat-" + Date.now().toString().slice(-4);
    const nextCat: TechStackCategoryConfig = {
      id: "tscat-" + Date.now(),
      key,
      labelId: "Kategori Baru",
      labelEn: "New Category",
      visible: true,
      sortOrder: categories.length + 1,
    };
    setDraft({ ...config, techStackCategories: [...categories, nextCat] });
    setStatus("Kategori tech stack ditambahkan");
  };

  const updateCategory = (idOrKey: string, updates: Partial<TechStackCategoryConfig>) => {
    setDraft({
      ...config,
      techStackCategories: categories.map((c) =>
        (c.id || c.key) === idOrKey ? { ...c, ...updates } : c
      ),
    });
    setStatus("Kategori tech stack diperbarui");
  };

  const moveCategory = (idx: number, dir: "up" | "down") => {
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    setDraft({
      ...config,
      techStackCategories: reorderItemsWithSortOrder(categories, idx, targetIdx),
    });
    setStatus("Urutan kategori tech stack diubah");
  };

  const requestDeleteCategory = (cat: TechStackCategoryConfig) => {
    const usingTools = stackList.filter((t) => t.category === cat.key);
    setPendingDelete({
      entityType: "Kategori Tech Stack",
      itemName: `${cat.labelId} (${cat.key})`,
      impacts: [
        usingTools.length > 0
          ? `${usingTools.length} alat/teknologi masih memakai kategori '${cat.key}' (akan tetap tampil hanya jika dipindahkan ke kategori lain).`
          : "Tidak ada alat yang menggunakan kategori ini.",
        "Menghapus tab/kelompok kategori dari seksi Tech Stack publik.",
      ],
      onConfirm: () => {
        const targetIdOrKey = cat.id || cat.key;
        setDraft({
          ...config,
          techStackCategories: categories.filter((c) => (c.id || c.key) !== targetIdOrKey),
        });
        setPendingDelete(null);
        setStatus("Kategori tech stack dihapus");
      },
    });
  };

  // ===================== TECH STACK ITEMS CRUD =====================
  const addTechStackItem = () => {
    const defaultCat = (categories[0]?.key || "uiux") as TechStackItem["category"];
    const newItem: TechStackItem = {
      id: "ts-" + Date.now(),
      name: "Alat / Teknologi Baru",
      icon: "/icons/figma.svg",
      category: defaultCat,
      url: "",
      desc: "",
      descEn: "",
      showInGrid: true,
      showInMarquee: true,
      published: true,
      visible: true,
      sortOrder: stackList.length + 1,
    };
    const nextList = [...stackList, newItem];
    setStackSearch("");
    setStackCategoryFilter("all");
    setStackStatusFilter("all");
    setStackPage(Math.max(1, Math.ceil(nextList.length / STACK_PAGE_SIZE)));
    setDraft({ ...config, techStack: nextList });
    setStatus("Alat / Teknologi baru ditambahkan ke draft");
  };

  const updateTechStackItem = (id: string, updates: Partial<TechStackItem>) => {
    setDraft({
      ...config,
      techStack: stackList.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
    setStatus("Data Tech Stack diperbarui");
  };

  const requestDeleteTechStackItem = (tool: TechStackItem) => {
    const linkedProjects = (config.projects || []).filter((p) =>
      (p.techIds || []).includes(tool.id)
    );
    setPendingDelete({
      entityType: "Alat Tech Stack",
      itemName: tool.name || tool.id,
      impacts: [
        "Menghapus ikon & entri dari grid 4 kategori maupun pita marquee publik.",
        linkedProjects.length > 0
          ? `Akan otomatis dilepas relasinya (techIds) dari ${linkedProjects.length} proyek: ${linkedProjects.map((p) => p.title).join(", ")}.`
          : "Tidak ada proyek yang menautkan techIds ke alat ini.",
        "Menghapus pengetahuan alat ini dari asisten AI Buddy.",
      ],
      onConfirm: () => {
        const nextProjects = (config.projects || []).map((p) =>
          p.techIds?.includes(tool.id)
            ? { ...p, techIds: p.techIds.filter((tid) => tid !== tool.id) }
            : p
        );
        setDraft({
          ...config,
          techStack: stackList.filter((s) => s.id !== tool.id),
          projects: nextProjects,
        });
        setPendingDelete(null);
        setStatus(`Alat '${tool.name}' dihapus dan relasi proyek dibersihkan`);
      },
    });
  };

  const moveTechStackItem = (id: string, direction: "up" | "down") => {
    const idx = stackList.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= stackList.length) return;
    setDraft({
      ...config,
      techStack: reorderItemsWithSortOrder(stackList, idx, targetIdx),
    });
    setStatus("Urutan Tech Stack diubah");
  };

  const stackDrag = useDragReorder(stackList, (reordered) => {
    setDraft({ ...config, techStack: reordered });
    setStatus("Urutan Tech Stack diperbarui (drag)");
  });

  const categoryOptions = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((c) => ({ value: c.key, label: c.labelId }));
    }
    return [
      { value: "uiux", label: "UI/UX & Desain" },
      { value: "frontend", label: "Frontend Web" },
      { value: "visual", label: "Desain Grafis / Media" },
      { value: "systems", label: "Sistem & Basis Data" },
    ];
  }, [categories]);

  const isStackFiltered =
    stackSearch.trim() !== "" || stackCategoryFilter !== "all" || stackStatusFilter !== "all";
  const filteredStack = useMemo(() => {
    const q = stackSearch.trim().toLowerCase();
    return stackList.filter((item) => {
      if (!matchesStatusFilter(item, stackStatusFilter)) return false;
      if (stackCategoryFilter !== "all" && item.category !== stackCategoryFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.desc || "").toLowerCase().includes(q)
      );
    });
  }, [stackList, stackSearch, stackCategoryFilter, stackStatusFilter]);

  const stackTotalPages = Math.max(1, Math.ceil(filteredStack.length / STACK_PAGE_SIZE));
  const safeStackPage = Math.min(stackPage, stackTotalPages);
  const pagedStack = filteredStack.slice(
    (safeStackPage - 1) * STACK_PAGE_SIZE,
    safeStackPage * STACK_PAGE_SIZE
  );

  // ===================== SERVICES CRUD =====================
  const addService = () => {
    const newSrv: ServiceItemConfig = {
      id: "srv-" + Date.now(),
      key: "srv-" + Date.now(),
      num: String(servicesList.length + 1).padStart(2, "0"),
      titleId: "Pilar Layanan Baru",
      titleEn: "New Service Pillar",
      descId: "Deskripsi cakupan layanan, metode kerja, dan luaran hasil...",
      descEn: "Description of service scope, workflow, and deliverables...",
      iconName: "layout",
      iconUrl: "",
      deliverablesId: [],
      deliverablesEn: [],
      ctaLabelId: "Diskusikan Proyek",
      ctaLabelEn: "Discuss Project",
      ctaUrl: "#kontak",
      published: true,
      visible: true,
      sortOrder: servicesList.length + 1,
    };
    setDraft({ ...config, services: [...servicesList, newSrv] });
    setStatus("Layanan baru ditambahkan ke draft");
  };

  const updateService = (id: string, updates: Partial<ServiceItemConfig>) => {
    setDraft({
      ...config,
      services: servicesList.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
    setStatus("Data layanan diperbarui");
  };

  const requestDeleteService = (srv: ServiceItemConfig) => {
    setPendingDelete({
      entityType: "Pilar Layanan",
      itemName: srv.titleId || srv.titleEn || srv.id,
      impacts: [
        "Menghapus kartu layanan ini dari seksi Layanan publik.",
        "Menghapus detail layanan ini dari konteks jawaban asisten AI Buddy.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          services: servicesList.filter((s) => s.id !== srv.id),
        });
        setPendingDelete(null);
        setStatus("Layanan dihapus");
      },
    });
  };

  const moveService = (id: string, direction: "up" | "down") => {
    const idx = servicesList.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= servicesList.length) return;
    setDraft({
      ...config,
      services: reorderItemsWithSortOrder(servicesList, idx, targetIdx),
    });
    setStatus("Urutan layanan diubah");
  };

  const serviceDrag = useDragReorder(servicesList, (reordered) => {
    setDraft({ ...config, services: reordered });
    setStatus("Urutan layanan diperbarui (drag)");
  });

  const isSrvFiltered = srvSearch.trim() !== "" || srvStatusFilter !== "all";
  const filteredServices = useMemo(() => {
    const q = srvSearch.trim().toLowerCase();
    return servicesList.filter((srv) => {
      if (!matchesStatusFilter(srv, srvStatusFilter)) return false;
      if (!q) return true;
      return (
        srv.titleId.toLowerCase().includes(q) ||
        srv.titleEn.toLowerCase().includes(q) ||
        srv.descId.toLowerCase().includes(q) ||
        srv.descEn.toLowerCase().includes(q)
      );
    });
  }, [servicesList, srvSearch, srvStatusFilter]);

  const srvTotalPages = Math.max(1, Math.ceil(filteredServices.length / SERVICE_PAGE_SIZE));
  const safeSrvPage = Math.min(srvPage, srvTotalPages);
  const pagedServices = filteredServices.slice(
    (safeSrvPage - 1) * SERVICE_PAGE_SIZE,
    safeSrvPage * SERVICE_PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <ConfirmImpactModal pendingDelete={pendingDelete} onCancel={() => setPendingDelete(null)} />

      {/* Subtab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3 dark:border-line/40">
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
          <span>Tech Stack & Alat ({stackList.length})</span>
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
          <span>Pilar Layanan ({servicesList.length})</span>
        </button>
      </div>

      {subTab === "stack" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Manajemen Tech Stack & Kategori
              </h2>
              <p className="text-xs text-muted">
                Perubahan ikon SVG/WebP berlaku konsisten di grid kategori, pita marquee, dan relasi proyek
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCatManager((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-surface dark:border-line/40 dark:bg-slate-900"
              >
                <Tag className="size-3.5 text-brand" />
                <span>Kelola Kategori ({categories.length})</span>
              </button>
              <button
                type="button"
                onClick={addTechStackItem}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
              >
                <Plus className="size-3.5" />
                <span>Tambah Alat</span>
              </button>
            </div>
          </div>

          {/* Collapsible Category Manager */}
          {showCatManager && (
            <div className="rounded-2xl border border-brand/30 bg-surface/60 p-4 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Kategori Grid Tech Stack
                  </h3>
                  <p className="text-[11px] text-muted">
                    Atur label bilingual, urutan kelompok, dan visibilitas kategori pada seksi Stack.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCategory}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-ink"
                >
                  <Plus className="size-3" />
                  <span>Tambah Kategori</span>
                </button>
              </div>

              <div className="space-y-2">
                {categories.map((cat, idx) => {
                  const cid = cat.id || cat.key;
                  return (
                  <div
                    key={cid}
                    className="grid gap-2 sm:grid-cols-[120px_1fr_1fr_auto] items-center rounded-xl border border-line bg-white p-2.5 dark:border-line/40 dark:bg-[#0c0e17]"
                  >
                    <input
                      type="text"
                      value={cat.key}
                      onChange={(e) => updateCategory(cid, { key: e.target.value.trim() })}
                      className={inputClass}
                      placeholder="key unik"
                      title="Key Kategori"
                    />
                    <input
                      type="text"
                      value={cat.labelId}
                      onChange={(e) => updateCategory(cid, { labelId: e.target.value })}
                      className={inputClass}
                      placeholder="Label Bahasa Indonesia"
                    />
                    <input
                      type="text"
                      value={cat.labelEn}
                      onChange={(e) => updateCategory(cid, { labelEn: e.target.value })}
                      className={inputClass}
                      placeholder="Label English"
                    />
                    <div className="flex items-center gap-1.5 justify-end">
                      <label className="inline-flex items-center gap-1 text-[11px] text-body">
                        <input
                          type="checkbox"
                          checked={cat.visible !== false}
                          onChange={(e) => updateCategory(cid, { visible: e.target.checked })}
                          className="size-3.5 rounded text-brand"
                        />
                        <span>Tampil</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => moveCategory(idx, "up")}
                        disabled={idx === 0}
                        className="rounded p-1 text-muted hover:bg-surface disabled:opacity-30"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCategory(idx, "down")}
                        disabled={idx >= categories.length - 1}
                        className="rounded p-1 text-muted hover:bg-surface disabled:opacity-30"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDeleteCategory(cat)}
                        className="rounded p-1 text-muted hover:text-red-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          <AdminSearchFilterBar
            search={stackSearch}
            onSearchChange={(val) => {
              setStackSearch(val);
              setStackPage(1);
            }}
            searchPlaceholder="Cari nama alat, framework, catatan..."
            filterValue={stackCategoryFilter}
            onFilterChange={(val) => {
              setStackCategoryFilter(val);
              setStackPage(1);
            }}
            filterOptions={[{ value: "all", label: "Semua Kategori" }, ...categoryOptions]}
            statusFilter={stackStatusFilter}
            onStatusFilterChange={(val) => {
              setStackStatusFilter(val);
              setStackPage(1);
            }}
            totalCount={stackList.length}
            filteredCount={filteredStack.length}
          />

          {pagedStack.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted dark:border-line/40">
              {stackList.length === 0
                ? 'Belum ada alat pada Tech Stack. Klik "Tambah Alat" untuk menambahkan.'
                : "Tidak ada alat yang cocok dengan filter."}
            </div>
          ) : (
            <div className="space-y-4">
              {pagedStack.map((tool) => {
                const rawIndex = stackList.findIndex((s) => s.id === tool.id);
                const linkedCount = (config.projects || []).filter((p) =>
                  (p.techIds || []).includes(tool.id)
                ).length;

                return (
                  <div
                    key={tool.id}
                    {...(!isStackFiltered ? stackDrag.getDragProps(rawIndex) : {})}
                    className={`rounded-2xl border bg-white p-4 transition dark:bg-[#0c0e17] ${
                      stackDrag.dragIndex === rawIndex
                        ? "border-brand opacity-70"
                        : "border-line dark:border-line/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface dark:border-line/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={tool.icon || "/icons/figma.svg"} alt={tool.name} className="size-5 object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-sm font-bold text-ink">
                              {tool.name || "Alat Tanpa Nama"}
                            </h3>
                            <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted dark:bg-slate-800">
                              {tool.category}
                            </span>
                            {linkedCount > 0 && (
                              <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                Dipakai di {linkedCount} proyek
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <AdminItemActionBar
                        published={tool.published}
                        visible={tool.visible}
                        onTogglePublished={() =>
                          updateTechStackItem(tool.id, { published: tool.published === false })
                        }
                        onToggleVisible={() =>
                          updateTechStackItem(tool.id, { visible: tool.visible === false })
                        }
                        onMoveUp={() => moveTechStackItem(tool.id, "up")}
                        onMoveDown={() => moveTechStackItem(tool.id, "down")}
                        disableMoveUp={isStackFiltered || rawIndex <= 0}
                        disableMoveDown={isStackFiltered || rawIndex >= stackList.length - 1}
                        onDelete={() => requestDeleteTechStackItem(tool)}
                        dragHandleProps={!isStackFiltered ? stackDrag.getHandleProps(rawIndex) : undefined}
                      />
                    </div>

                    {!tool.name?.trim() && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>Nama alat/teknologi tidak boleh kosong.</span>
                      </div>
                    )}

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink">Nama Alat / Teknologi *</label>
                        <input
                          type="text"
                          value={tool.name}
                          onChange={(e) => updateTechStackItem(tool.id, { name: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Kategori</label>
                        <select
                          value={tool.category}
                          onChange={(e) =>
                            updateTechStackItem(tool.id, {
                              category: e.target.value as TechStackItem["category"],
                            })
                          }
                          className={`mt-1 ${inputClass}`}
                        >
                          {categoryOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Tautan Resmi (Opsional)</label>
                        <input
                          type="url"
                          value={tool.url || ""}
                          onChange={(e) => updateTechStackItem(tool.id, { url: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                          placeholder="https://nextjs.org"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Catatan Singkat (ID)</label>
                        <input
                          type="text"
                          value={tool.desc || ""}
                          onChange={(e) => updateTechStackItem(tool.id, { desc: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                          placeholder="Framework utama UI & SSR"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Short Note (EN)</label>
                        <input
                          type="text"
                          value={tool.descEn || ""}
                          onChange={(e) => updateTechStackItem(tool.id, { descEn: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                          placeholder="Primary UI & SSR framework"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-5">
                        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
                          <input
                            type="checkbox"
                            checked={tool.showInGrid !== false}
                            onChange={(e) => updateTechStackItem(tool.id, { showInGrid: e.target.checked })}
                            className="size-4 rounded border-line text-brand"
                          />
                          <span>Tampil di Grid</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
                          <input
                            type="checkbox"
                            checked={tool.showInMarquee !== false}
                            onChange={(e) => updateTechStackItem(tool.id, { showInMarquee: e.target.checked })}
                            className="size-4 rounded border-line text-brand"
                          />
                          <span>Tampil di Marquee</span>
                        </label>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <MediaFieldControl
                          label="Ikon Alat (SVG aman / WebP / PNG)"
                          value={tool.icon}
                          onChange={(url) => updateTechStackItem(tool.id, { icon: url })}
                          folder="logos"
                          fieldKey={`ts-${tool.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="image/svg+xml,image/png,image/webp,image/jpeg"
                          placeholder="/icons/... atau URL R2"
                          previewShape="square"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AdminPaginationBar
            page={safeStackPage}
            totalPages={stackTotalPages}
            onPageChange={setStackPage}
          />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Manajemen Pilar Layanan</h2>
              <p className="text-xs text-muted">
                Kelola layanan, ikon bawaan atau kustom, daftar luaran (deliverables), dan CTA per pilar
              </p>
            </div>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Layanan</span>
            </button>
          </div>

          <AdminSearchFilterBar
            search={srvSearch}
            onSearchChange={(val) => {
              setSrvSearch(val);
              setSrvPage(1);
            }}
            searchPlaceholder="Cari judul atau deskripsi layanan..."
            statusFilter={srvStatusFilter}
            onStatusFilterChange={(val) => {
              setSrvStatusFilter(val);
              setSrvPage(1);
            }}
            totalCount={servicesList.length}
            filteredCount={filteredServices.length}
          />

          {pagedServices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted dark:border-line/40">
              Belum ada pilar layanan yang sesuai filter.
            </div>
          ) : (
            <div className="space-y-4">
              {pagedServices.map((srv) => {
                const rawIndex = servicesList.findIndex((s) => s.id === srv.id);

                return (
                  <div
                    key={srv.id}
                    {...(!isSrvFiltered ? serviceDrag.getDragProps(rawIndex) : {})}
                    className={`rounded-2xl border bg-white p-5 transition dark:bg-[#0c0e17] ${
                      serviceDrag.dragIndex === rawIndex
                        ? "border-brand opacity-70"
                        : "border-line dark:border-line/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                      <div className="flex items-center gap-2">
                        {srv.iconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={srv.iconUrl} alt={srv.titleId} className="size-6 object-contain" />
                        )}
                        <h3 className="font-display text-sm font-bold text-ink">
                          {srv.titleId || "Layanan Baru"}
                        </h3>
                      </div>

                      <AdminItemActionBar
                        published={srv.published}
                        visible={srv.visible}
                        onTogglePublished={() =>
                          updateService(srv.id, { published: srv.published === false })
                        }
                        onToggleVisible={() =>
                          updateService(srv.id, { visible: srv.visible === false })
                        }
                        onMoveUp={() => moveService(srv.id, "up")}
                        onMoveDown={() => moveService(srv.id, "down")}
                        disableMoveUp={isSrvFiltered || rawIndex <= 0}
                        disableMoveDown={isSrvFiltered || rawIndex >= servicesList.length - 1}
                        onDelete={() => requestDeleteService(srv)}
                        dragHandleProps={!isSrvFiltered ? serviceDrag.getHandleProps(rawIndex) : undefined}
                      />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-ink">Judul Layanan (ID) *</label>
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
                        <label className="block text-xs font-semibold text-ink">Ikon Bawaan (Lucide)</label>
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
                          placeholder="#kontak atau https://..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Label Tombol CTA (ID)</label>
                        <input
                          type="text"
                          value={srv.ctaLabelId || ""}
                          onChange={(e) => updateService(srv.id, { ctaLabelId: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Konsultasi"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">CTA Button Label (EN)</label>
                        <input
                          type="text"
                          value={srv.ctaLabelEn || ""}
                          onChange={(e) => updateService(srv.id, { ctaLabelEn: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Inquire"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <MediaFieldControl
                          label="Ikon Kustom Layanan (Opsional — menimpa Lucide jika diisi)"
                          value={srv.iconUrl || ""}
                          onChange={(url) => updateService(srv.id, { iconUrl: url })}
                          folder="services"
                          fieldKey={`srv-icon-${srv.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="image/svg+xml,image/png,image/webp"
                          placeholder="Kosongkan untuk pakai ikon standar Lucide"
                          previewShape="square"
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

                      <div>
                        <label className="block text-xs font-semibold text-ink">Poin Luaran / Deliverables (ID, 1 per baris)</label>
                        <textarea
                          rows={2}
                          value={(srv.deliverablesId || []).join("\n")}
                          onChange={(e) =>
                            updateService(srv.id, {
                              deliverablesId: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Wireframe Figma&#10;Design System"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Deliverables (EN, 1 per line)</label>
                        <textarea
                          rows={2}
                          value={(srv.deliverablesEn || []).join("\n")}
                          onChange={(e) =>
                            updateService(srv.id, {
                              deliverablesEn: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Figma Wireframes&#10;Design System"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AdminPaginationBar
            page={safeSrvPage}
            totalPages={srvTotalPages}
            onPageChange={setSrvPage}
          />
        </div>
      )}
    </div>
  );
}

export default TabExpertise;
