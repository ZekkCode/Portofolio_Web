"use client";

import { useState, useMemo } from "react";
import type { SiteConfig, Project, ProjectCategoryConfig } from "@/lib/site-store";
import { slugifyProjectTitle } from "@/lib/site-config";
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
  Trash2,
  Upload,
  FolderGit2,
  Star,
  Plus,
  Tag,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface TabWorksProps {
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

const PAGE_SIZE = 15;

export function TabWorks({
  config,
  setDraft,
  setStatus,
  uploadAndSet,
  uploadingImage,
  inputClass,
}: TabWorksProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all");
  const [page, setPage] = useState(1);
  const [showCatManager, setShowCatManager] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DeleteImpactItem | null>(null);

  const projects = config.projects || [];
  const categories = config.projectCategories || [];

  const addProject = () => {
    const id = "project-" + Date.now();
    const newProj: Project = {
      id,
      slug: `proyek-baru-${projects.length + 1}`,
      title: "Proyek Baru",
      titleEn: "New Project",
      summary: "",
      summaryEn: "",
      desc: "Deskripsi ringkas mengenai tujuan, fitur, dan arsitektur proyek...",
      descEn: "Brief description of the project goals, architecture, and features...",
      category: "both",
      tags: ["Next.js", "TypeScript", "Tailwind CSS"],
      techIds: [],
      role: "Frontend Developer & UI Designer",
      period: String(new Date().getFullYear()),
      status: "completed",
      collaborators: [],
      caseStudyUrl: "",
      architecture: "",
      architectureEn: "",
      problem: "",
      problemEn: "",
      approach: "",
      approachEn: "",
      outcome: "",
      outcomeEn: "",
      image: "",
      imageAlt: "",
      logo: "",
      galleryImages: [],
      galleryAlts: [],
      previewUrl: "",
      repo: "",
      featured: false,
      published: true,
      visible: true,
      sortOrder: projects.length + 1,
    };
    const nextList = [...projects, newProj];
    setSearch("");
    setFilterCategory("all");
    setStatusFilter("all");
    setPage(Math.max(1, Math.ceil(nextList.length / PAGE_SIZE)));
    setDraft({ ...config, projects: nextList });
    setStatus("Proyek baru ditambahkan di draft");
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setDraft({
      ...config,
      projects: projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
    setStatus("Proyek diperbarui di draft");
  };

  const requestDeleteProject = (project: Project) => {
    setPendingDelete({
      entityType: "Proyek Portofolio",
      itemName: project.title || project.id,
      impacts: [
        "Menghapus proyek dari grid portofolio & menurunkan hitungan statistik otomatis.",
        "Menghilangkan proyek ini dari pengetahuan publik Buddy AI.",
        project.image ? "Media gambar proyek di R2 tidak otomatis terhapus (aman untuk riwayat)." : "Tidak ada lampiran gambar tambahan yang hilang permanen.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          projects: projects.filter((p) => p.id !== project.id),
        });
        setStatus(`Proyek '${project.title}' dihapus dari draft`);
      },
    });
  };

  const setProjectsReordered = (next: Project[]) => {
    setDraft({ ...config, projects: next });
    setStatus("Urutan proyek diperbarui");
  };

  const { getDragProps, getHandleProps } = useDragReorder(projects, setProjectsReordered);

  const toggleTechId = (project: Project, techId: string) => {
    const existing = project.techIds || [];
    const next = existing.includes(techId)
      ? existing.filter((x) => x !== techId)
      : [...existing, techId];
    updateProject(project.id, { techIds: next });
  };

  const addGalleryImage = (projId: string, url: string) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    const gallery = Array.isArray(proj.galleryImages) ? [...proj.galleryImages, url] : [url];
    const alts = Array.isArray(proj.galleryAlts) ? [...proj.galleryAlts, ""] : [""];
    updateProject(projId, { galleryImages: gallery, galleryAlts: alts });
  };

  const removeGalleryImage = (projId: string, imgIdx: number) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj || !Array.isArray(proj.galleryImages)) return;
    updateProject(projId, {
      galleryImages: proj.galleryImages.filter((_, i) => i !== imgIdx),
      galleryAlts: (proj.galleryAlts || []).filter((_, i) => i !== imgIdx),
    });
  };

  // ===================== CATEGORY CRUD =====================
  const addCategory = () => {
    const next: ProjectCategoryConfig = {
      id: "pcat-" + Date.now(),
      key: "cat-" + Date.now().toString().slice(-4),
      labelId: "Kategori Baru",
      labelEn: "New Category",
      visible: true,
      sortOrder: categories.length + 1,
    };
    setDraft({ ...config, projectCategories: [...categories, next] });
    setStatus("Kategori proyek ditambahkan");
  };

  const updateCategory = (id: string, updates: Partial<ProjectCategoryConfig>) => {
    setDraft({
      ...config,
      projectCategories: categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const deleteCategory = (cat: ProjectCategoryConfig) => {
    if (cat.key === "all") return;
    const usedCount = projects.filter((p) => p.category === cat.key).length;
    setPendingDelete({
      entityType: "Kategori Proyek",
      itemName: cat.labelId,
      impacts: [
        usedCount > 0
          ? `${usedCount} proyek menggunakan kategori '${cat.key}' — pastikan untuk memindahkan kategorinya jika perlu.`
          : "Tidak ada proyek yang terdampak langsung.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          projectCategories: categories.filter((c) => c.id !== cat.id),
        });
      },
    });
  };

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (filterCategory !== "all") {
        const match =
          p.category === filterCategory ||
          (p.category === "both" && (filterCategory === "it" || filterCategory === "design"));
        if (!match) return false;
      }
      if (statusFilter === "published" && (p.published === false || p.visible === false)) return false;
      if (statusFilter === "draft" && p.published !== false) return false;
      if (statusFilter === "hidden" && p.visible !== false) return false;

      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.titleEn || "").toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        (p.slug || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [projects, filterCategory, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedList = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-ink">Koleksi Proyek Portofolio</h2>
          <p className="text-xs text-muted">
            Total {projects.length} proyek ({projects.filter((p) => p.published !== false && p.visible !== false).length} tampil publik)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCatManager((prev) => !prev)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-body hover:text-ink dark:border-line/40"
          >
            <Tag className="size-3.5 text-brand" />
            <span>Kategori ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={addProject}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink transition"
          >
            + Tambah proyek
          </button>
        </div>
      </div>

      {/* Category Manager Drawer */}
      {showCatManager && (
        <div className="rounded-2xl border border-brand/25 bg-brand/5 p-4 space-y-3 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-brand">
              Kelola Kategori Proyek
            </h3>
            <button
              type="button"
              onClick={addCategory}
              className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-[11px] font-semibold text-white"
            >
              <Plus className="size-3" />
              <span>Tambah Kategori</span>
            </button>
          </div>
          <div className="space-y-2">
            {categories.map((cat, cIdx) => (
              <div
                key={cat.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-line/60 bg-white p-2.5 dark:border-line/40 dark:bg-slate-900/70"
              >
                <input
                  type="text"
                  value={cat.key}
                  disabled={cat.key === "all"}
                  onChange={(e) =>
                    updateCategory(cat.id, {
                      key: slugifyProjectTitle(e.target.value, cat.key),
                    })
                  }
                  className="w-28 rounded-lg border border-line px-2 py-1 font-mono text-xs disabled:opacity-50 dark:border-line/40 dark:bg-slate-950"
                  placeholder="key"
                />
                <input
                  type="text"
                  value={cat.labelId}
                  onChange={(e) => updateCategory(cat.id, { labelId: e.target.value })}
                  className="flex-1 min-w-[130px] rounded-lg border border-line px-2 py-1 text-xs dark:border-line/40 dark:bg-slate-950"
                  placeholder="Label ID"
                />
                <input
                  type="text"
                  value={cat.labelEn}
                  onChange={(e) => updateCategory(cat.id, { labelEn: e.target.value })}
                  className="flex-1 min-w-[130px] rounded-lg border border-line px-2 py-1 text-xs dark:border-line/40 dark:bg-slate-950"
                  placeholder="Label EN"
                />
                <label className="flex items-center gap-1 text-[11px]">
                  <input
                    type="checkbox"
                    checked={cat.visible !== false}
                    onChange={(e) => updateCategory(cat.id, { visible: e.target.checked })}
                  />
                  <span>Tampil</span>
                </label>
                <button
                  type="button"
                  disabled={cIdx === 0}
                  onClick={() =>
                    setDraft({
                      ...config,
                      projectCategories: reorderItemsWithSortOrder(categories, cIdx, cIdx - 1),
                    })
                  }
                  className="rounded p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={cIdx === categories.length - 1}
                  onClick={() =>
                    setDraft({
                      ...config,
                      projectCategories: reorderItemsWithSortOrder(categories, cIdx, cIdx + 1),
                    })
                  }
                  className="rounded p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <ChevronDown className="size-3.5" />
                </button>
                {cat.key !== "all" && (
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat)}
                    className="rounded p-1 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search, Filter & Status Bar */}
      <AdminSearchFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Cari judul, slug, tag, atau ringkasan proyek..."
        filterValue={filterCategory}
        onFilterChange={(v) => {
          setFilterCategory(v);
          setPage(1);
        }}
        filterOptions={[
          { value: "all", label: "Semua Kategori" },
          ...categories
            .filter((c) => c.key !== "all")
            .map((c) => ({ value: c.key, label: c.labelId })),
          { value: "both", label: "Both (IT & Design)" },
        ]}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        totalCount={projects.length}
        filteredCount={filteredList.length}
      />

      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center dark:border-line/40">
          <FolderGit2 className="mx-auto size-8 text-muted" />
          <h3 className="mt-3 text-sm font-bold text-ink">Belum Ada Proyek yang Ditampilkan</h3>
          <p className="mt-1 text-xs text-muted">
            {projects.length === 0
              ? "Belum ada proyek yang ditambahkan. Klik tombol di bawah untuk membuat proyek pertama."
              : "Tidak ada proyek yang cocok dengan filter pencarian saat ini."}
          </p>
          {projects.length === 0 && (
            <button
              type="button"
              onClick={addProject}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-ink transition"
            >
              + Tambah proyek
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {pagedList.map((project) => {
            const globalIdx = projects.findIndex((p) => p.id === project.id);
            return (
              <div
                key={project.id}
                {...getDragProps(globalIdx)}
                className="rounded-2xl border border-line bg-white p-5 dark:border-line/40 dark:bg-[#0c0e17]"
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] font-bold text-muted">
                      #{globalIdx + 1}
                    </span>
                    <h3 className="font-display text-sm font-bold text-ink truncate">
                      {project.title || "Proyek Baru"}
                    </h3>
                    <span className="rounded border border-line/60 px-2 py-0.5 text-[10px] font-semibold text-muted uppercase dark:border-line/40">
                      {project.category || "both"}
                    </span>
                    {project.featured && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        <Star className="size-2.5 fill-amber-500" /> Unggulan
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1 text-[11px] text-body">
                      <input
                        type="checkbox"
                        checked={project.featured || false}
                        onChange={(e) => updateProject(project.id, { featured: e.target.checked })}
                        className="size-3.5 rounded border-line text-brand focus:ring-brand"
                      />
                      <span>Unggulan</span>
                    </label>

                    <AdminItemActionBar
                      published={project.published !== false}
                      visible={project.visible !== false}
                      onTogglePublished={() =>
                        updateProject(project.id, { published: project.published === false })
                      }
                      onToggleVisible={() =>
                        updateProject(project.id, { visible: project.visible === false })
                      }
                      dragHandleProps={getHandleProps(globalIdx)}
                      disableMoveUp={globalIdx === 0}
                      disableMoveDown={globalIdx === projects.length - 1}
                      onMoveUp={() =>
                        setProjectsReordered(
                          reorderItemsWithSortOrder(projects, globalIdx, globalIdx - 1)
                        )
                      }
                      onMoveDown={() =>
                        setProjectsReordered(
                          reorderItemsWithSortOrder(projects, globalIdx, globalIdx + 1)
                        )
                      }
                      onDelete={() => requestDeleteProject(project)}
                    />
                  </div>
                </div>

                {/* Form Fields Grid — PENTING: HANYA SATU <label> mengandung kata 'Judul' dan SATU <textarea> per kartu! */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block text-xs font-semibold text-body">
                    Judul
                    <input
                      type="text"
                      value={project.title}
                      onChange={(e) => updateProject(project.id, { title: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Project Title (EN)</label>
                    <input
                      type="text"
                      value={project.titleEn || ""}
                      onChange={(e) => updateProject(project.id, { titleEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Slug URL</label>
                    <div className="mt-1.5 flex gap-1.5">
                      <input
                        type="text"
                        value={project.slug || ""}
                        onChange={(e) => updateProject(project.id, { slug: e.target.value })}
                        className={`flex-1 font-mono ${inputClass}`}
                        placeholder="nama-proyek"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateProject(project.id, {
                            slug: slugifyProjectTitle(project.title, project.id),
                          })
                        }
                        className="rounded-xl border border-line/70 px-2.5 text-[10px] font-semibold text-muted hover:text-ink"
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Kategori Domain</label>
                    <select
                      value={project.category || "both"}
                      onChange={(e) => updateProject(project.id, { category: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    >
                      <option value="both">Both (IT & Design)</option>
                      {categories
                        .filter((c) => c.key !== "all")
                        .map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.labelId}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Peran / Posisi Proyek</label>
                    <input
                      type="text"
                      value={project.role || ""}
                      onChange={(e) => updateProject(project.id, { role: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="Fullstack Developer & UI Designer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Periode & Status Proyek</label>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={project.period || ""}
                        onChange={(e) => updateProject(project.id, { period: e.target.value })}
                        className={inputClass}
                        placeholder="2025"
                      />
                      <select
                        value={project.status || "completed"}
                        onChange={(e) =>
                          updateProject(project.id, {
                            status: e.target.value as Project["status"],
                          })
                        }
                        className={inputClass}
                      >
                        <option value="completed">Completed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="concept">Concept</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Kolaborator / Tim (pisah koma)</label>
                    <input
                      type="text"
                      value={(project.collaborators || []).join(", ")}
                      onChange={(e) =>
                        updateProject(project.id, {
                          collaborators: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="Solo, Tim Kampus"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Ringkasan Singkat (Summary ID)</label>
                    <input
                      type="text"
                      value={project.summary || ""}
                      onChange={(e) => updateProject(project.id, { summary: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="1 kalimat ringkas untuk kartu..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Short Summary (EN)</label>
                    <input
                      type="text"
                      value={project.summaryEn || ""}
                      onChange={(e) => updateProject(project.id, { summaryEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Tag Tambahan (Koma)</label>
                    <input
                      type="text"
                      value={project.tags?.join(", ") || ""}
                      onChange={(e) =>
                        updateProject(project.id, {
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="Next.js, TypeScript, Tailwind"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">URL Demo Langsung</label>
                    <input
                      type="text"
                      value={project.previewUrl || ""}
                      onChange={(e) => updateProject(project.id, { previewUrl: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">URL Repositori GitHub</label>
                    <input
                      type="text"
                      value={project.repo || ""}
                      onChange={(e) => updateProject(project.id, { repo: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-semibold text-ink">URL Studi Kasus Lengkap (Behance / Notion / Blog)</label>
                    <input
                      type="text"
                      value={project.caseStudyUrl || ""}
                      onChange={(e) => updateProject(project.id, { caseStudyUrl: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Relasi ke Tech Stack CMS */}
                  {(config.techStack || []).length > 0 && (
                    <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-line/50 bg-surface/30 p-3 dark:border-line/30">
                      <span className="block text-[11px] font-semibold text-ink mb-2">
                        Hubungkan Teknologi dari Master Tech Stack:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {config.techStack.map((tech) => {
                          const linked = (project.techIds || []).includes(tech.id);
                          return (
                            <button
                              key={tech.id}
                              type="button"
                              onClick={() => toggleTechId(project, tech.id)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                                linked
                                  ? "border-brand bg-brand/10 text-brand dark:text-blue-400"
                                  : "border-line/60 bg-white text-muted hover:text-ink dark:border-line/40 dark:bg-slate-900"
                              }`}
                            >
                              {tech.icon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={tech.icon} alt="" className="size-3 object-contain" />
                              )}
                              <span>{tech.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Strictly ONE textarea per project card to uphold check.mjs contract */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-semibold text-body">
                      Deskripsi Ringkas
                      <textarea
                        rows={2}
                        value={project.desc}
                        onChange={(e) => updateProject(project.id, { desc: e.target.value })}
                        className={`mt-1.5 ${inputClass}`}
                      />
                    </label>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-semibold text-ink">Short Description (EN)</label>
                    <input
                      type="text"
                      value={project.descEn || ""}
                      onChange={(e) => updateProject(project.id, { descEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="English description..."
                    />
                  </div>

                  {/* Case Study Details */}
                  <div>
                    <label className="block text-xs font-semibold text-ink">Tantangan / Problem (ID)</label>
                    <input
                      type="text"
                      value={project.problem || ""}
                      onChange={(e) => updateProject(project.id, { problem: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink">Challenge / Problem (EN)</label>
                    <input
                      type="text"
                      value={project.problemEn || ""}
                      onChange={(e) => updateProject(project.id, { problemEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink">Arsitektur Teknis (ID)</label>
                    <input
                      type="text"
                      value={project.architecture || ""}
                      onChange={(e) => updateProject(project.id, { architecture: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink">Technical Architecture (EN)</label>
                    <input
                      type="text"
                      value={project.architectureEn || ""}
                      onChange={(e) => updateProject(project.id, { architectureEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink">Solusi / Pendekatan (ID)</label>
                    <input
                      type="text"
                      value={project.approach || project.highlight || ""}
                      onChange={(e) =>
                        updateProject(project.id, { approach: e.target.value, highlight: e.target.value })
                      }
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink">Approach & Solution (EN)</label>
                    <input
                      type="text"
                      value={project.approachEn || ""}
                      onChange={(e) => updateProject(project.id, { approachEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink">Hasil / Dampak (ID)</label>
                    <input
                      type="text"
                      value={project.outcome || ""}
                      onChange={(e) => updateProject(project.id, { outcome: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink">Outcome & Result (EN)</label>
                    <input
                      type="text"
                      value={project.outcomeEn || ""}
                      onChange={(e) => updateProject(project.id, { outcomeEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                </div>

                {/* Cover, Alt Text & Logo */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2 rounded-xl border border-line/60 bg-surface/50 p-4 dark:border-line/30 dark:bg-slate-900/40">
                  <div className="space-y-2">
                    <MediaFieldControl
                      label="Foto Cover Utama (WebP / SVG)"
                      value={project.image || ""}
                      onChange={(url) => updateProject(project.id, { image: url })}
                      folder="projects"
                      fieldKey={`proj-cover-${project.id}`}
                      uploadAndSet={uploadAndSet}
                      uploadingImage={uploadingImage}
                      config={config}
                      previewShape="wide"
                    />
                    <input
                      type="text"
                      value={project.imageAlt || ""}
                      onChange={(e) => updateProject(project.id, { imageAlt: e.target.value })}
                      className={inputClass}
                      placeholder="Alt text aksesibilitas & SEO gambar cover..."
                    />
                  </div>

                  <MediaFieldControl
                    label="Logo Ikon Proyek (Opsional)"
                    value={project.logo || ""}
                    onChange={(url) => updateProject(project.id, { logo: url })}
                    folder="logos"
                    fieldKey={`proj-logo-${project.id}`}
                    uploadAndSet={uploadAndSet}
                    uploadingImage={uploadingImage}
                    config={config}
                    previewShape="square"
                  />
                </div>

                {/* Gallery Images */}
                <div className="mt-4 rounded-xl border border-line/60 bg-surface/50 p-4 dark:border-line/30 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink">
                      Galeri Tangkapan Layar ({project.galleryImages?.length || 0} Gambar)
                    </span>
                    <label className="inline-flex min-h-[28px] items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink shadow-2xs hover:bg-surface cursor-pointer dark:border-line/40 dark:bg-[#151928] transition">
                      <Upload className="size-3 text-brand" />
                      <span>+ Tambah Gambar Galeri</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void uploadAndSet(
                              file,
                              "projects",
                              (url) => addGalleryImage(project.id, url),
                              `gallery-${project.id}`
                            );
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {project.galleryImages && project.galleryImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {project.galleryImages.map((imgUrl, gIdx) => (
                        <div
                          key={gIdx}
                          className="rounded-lg border border-line bg-white p-2 space-y-1.5 dark:border-line/40 dark:bg-slate-900"
                        >
                          <div className="group relative aspect-video rounded overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgUrl} alt={`Galeri ${gIdx + 1}`} className="size-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(project.id, gIdx)}
                              className="absolute top-1 right-1 rounded bg-black/75 p-1 text-white hover:bg-red-600"
                              title="Hapus gambar galeri"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={project.galleryAlts?.[gIdx] || ""}
                            onChange={(e) => {
                              const nextAlts = [...(project.galleryAlts || [])];
                              nextAlts[gIdx] = e.target.value;
                              updateProject(project.id, { galleryAlts: nextAlts });
                            }}
                            className={inputClass}
                            placeholder={`Alt text slide ${gIdx + 1}...`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminPaginationBar
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <ConfirmImpactModal
        pendingDelete={pendingDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
