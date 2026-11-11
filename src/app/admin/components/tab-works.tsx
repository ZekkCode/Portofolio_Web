"use client";

import { useState } from "react";
import type { SiteConfig, Project } from "@/lib/site-store";
import { Trash2, ChevronUp, ChevronDown, Upload, FolderGit2, Star, Eye, ExternalLink } from "lucide-react";

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

export function TabWorks({
  config,
  setDraft,
  setStatus,
  uploadAndSet,
  uploadingImage,
  inputClass,
}: TabWorksProps) {
  const [filterCategory, setFilterCategory] = useState<"all" | "it" | "design" | "both">("all");

  const addProject = () => {
    const newProj: Project = {
      id: "project-" + Date.now(),
      title: "Proyek Baru",
      titleEn: "New Project",
      desc: "Deskripsi ringkas mengenai tujuan, fitur, dan arsitektur proyek...",
      descEn: "Brief description of the project goals, architecture, and features...",
      category: "both",
      tags: ["Next.js", "TypeScript", "Tailwind CSS"],
      role: "Frontend Developer & UI Designer",
      problem: "",
      problemEn: "",
      approach: "",
      approachEn: "",
      outcome: "",
      outcomeEn: "",
      image: "",
      galleryImages: [],
      previewUrl: "",
      repo: "",
      featured: false,
      published: true,
      sortOrder: (config.projects?.length || 0) + 1,
    };
    setDraft({ ...config, projects: [newProj, ...(config.projects || [])] });
    setStatus("Proyek baru ditambahkan");
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setDraft({
      ...config,
      projects: (config.projects || []).map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
    setStatus("Proyek diperbarui di draft");
  };

  const deleteProject = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus proyek ini dari portofolio?")) return;
    setDraft({
      ...config,
      projects: (config.projects || []).filter((p) => p.id !== id),
    });
    setStatus("Proyek dihapus");
  };

  const moveProject = (id: string, direction: "up" | "down") => {
    const list = [...(config.projects || [])];
    const index = list.findIndex((p) => p.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, projects: list });
    setStatus("Urutan proyek diubah");
  };

  const addGalleryImage = (projId: string, url: string) => {
    const proj = (config.projects || []).find((p) => p.id === projId);
    if (!proj) return;
    const gallery = Array.isArray(proj.galleryImages) ? [...proj.galleryImages, url] : [url];
    updateProject(projId, { galleryImages: gallery });
  };

  const removeGalleryImage = (projId: string, imgIdx: number) => {
    const proj = (config.projects || []).find((p) => p.id === projId);
    if (!proj || !Array.isArray(proj.galleryImages)) return;
    const gallery = proj.galleryImages.filter((_, i) => i !== imgIdx);
    updateProject(projId, { galleryImages: gallery });
  };

  const filteredList = (config.projects || []).filter((p) => {
    if (filterCategory === "all") return true;
    return p.category === filterCategory || (p.category === "both" && (filterCategory === "it" || filterCategory === "design"));
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-ink">Koleksi Proyek Portofolio</h2>
          <p className="text-xs text-muted">
            Total {config.projects?.length || 0} proyek ({config.projects?.filter((p) => p.published !== false).length || 0} dipublikasikan)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-body dark:border-line/40 dark:bg-slate-900"
          >
            <option value="all">Semua Kategori</option>
            <option value="it">Rekayasa IT</option>
            <option value="design">Desain UI/UX</option>
            <option value="both">Both (IT & Design)</option>
          </select>

          <button
            type="button"
            onClick={addProject}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink transition"
          >
            + Tambah proyek
          </button>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center dark:border-line/40">
          <FolderGit2 className="mx-auto size-8 text-muted" />
          <h3 className="mt-3 text-sm font-bold text-ink">Belum Ada Proyek yang Ditampilkan</h3>
          <p className="mt-1 text-xs text-muted">Koleksi proyek saat ini kosong (Zero Slop Policy). Klik tombol di bawah untuk menambahkan proyek portofolio pertama Anda.</p>
          <button
            type="button"
            onClick={addProject}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-ink transition"
          >
            + Tambah proyek
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredList.map((project, idx) => (
            <div
              key={project.id}
              className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                  <h3 className="font-display text-sm font-bold text-ink">{project.title || "Proyek Baru"}</h3>
                  <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand dark:bg-blue-500/10 dark:text-blue-300 uppercase">
                    {project.category || "both"}
                  </span>
                  {project.featured && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      <Star className="size-2.5 fill-amber-500" /> Unggulan
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="flex cursor-pointer items-center gap-1 text-[11px] text-body">
                    <input
                      type="checkbox"
                      checked={project.featured || false}
                      onChange={(e) => updateProject(project.id, { featured: e.target.checked })}
                      className="size-3.5 rounded border-line text-brand focus:ring-brand"
                    />
                    <span>Featured</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-1 text-[11px] text-body">
                    <input
                      type="checkbox"
                      checked={project.published !== false}
                      onChange={(e) => updateProject(project.id, { published: e.target.checked })}
                      className="size-3.5 rounded border-line text-brand focus:ring-brand"
                    />
                    <span>Publik</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => moveProject(project.id, "up")}
                    disabled={idx === 0}
                    className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    title="Geser Naik"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProject(project.id, "down")}
                    disabled={idx === filteredList.length - 1}
                    className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    title="Geser Turun"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProject(project.id)}
                    className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    title="Hapus Proyek"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Form Fields Grid */}
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
                  <label className="block text-xs font-semibold text-ink">Kategori Domain</label>
                  <select
                    value={project.category || "both"}
                    onChange={(e) => updateProject(project.id, { category: e.target.value as any })}
                    className={`mt-1.5 ${inputClass}`}
                  >
                    <option value="both">Both (IT & UI/UX Design)</option>
                    <option value="it">Rekayasa IT & Web</option>
                    <option value="design">Desain UI/UX & Grafis</option>
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
                  <label className="block text-xs font-semibold text-ink">Tag Teknologi (Koma)</label>
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
                  <label className="block text-xs font-semibold text-ink">URL Demo Langsung (Live Preview)</label>
                  <input
                    type="text"
                    value={project.previewUrl || ""}
                    onChange={(e) => updateProject(project.id, { previewUrl: e.target.value })}
                    className={`mt-1.5 ${inputClass}`}
                    placeholder="https://..."
                  />
                </div>

                {/* Exactly ONE textarea for desc to maintain test assertion contract */}
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
                    placeholder="English description for international visitors..."
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
                    placeholder="Masalah utama yang ingin diselesaikan..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">Challenge / Problem (EN)</label>
                  <input
                    type="text"
                    value={project.problemEn || ""}
                    onChange={(e) => updateProject(project.id, { problemEn: e.target.value })}
                    className={`mt-1.5 ${inputClass}`}
                    placeholder="Core problem statement..."
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
                    placeholder="Arsitektur, metode desain, atau solusi teknis..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">Approach & Solution (EN)</label>
                  <input
                    type="text"
                    value={project.approachEn || ""}
                    onChange={(e) => updateProject(project.id, { approachEn: e.target.value })}
                    className={`mt-1.5 ${inputClass}`}
                    placeholder="Design architecture & engineering approach..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">Hasil / Dampak (ID)</label>
                  <input
                    type="text"
                    value={project.outcome || ""}
                    onChange={(e) => updateProject(project.id, { outcome: e.target.value })}
                    className={`mt-1.5 ${inputClass}`}
                    placeholder="Peningkatan efisiensi, metrik, respon pengguna..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">Outcome & Result (EN)</label>
                  <input
                    type="text"
                    value={project.outcomeEn || ""}
                    onChange={(e) => updateProject(project.id, { outcomeEn: e.target.value })}
                    className={`mt-1.5 ${inputClass}`}
                    placeholder="Efficiency improvements, adoption metrics..."
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
              </div>

              {/* Cover Image & Upload */}
              <div className="mt-4 rounded-xl border border-line/60 bg-surface/50 p-4 dark:border-line/30 dark:bg-slate-900/40">
                <span className="text-xs font-semibold text-ink">Foto Cover Utama (WebP Disarankan)</span>
                <div className="mt-2.5 flex flex-wrap items-center gap-4">
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-white shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
                    {project.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={project.image} alt={project.title} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted">
                        <FolderGit2 className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={project.image || ""}
                      onChange={(e) => updateProject(project.id, { image: e.target.value })}
                      placeholder="URL cover (WebP disarankan)"
                      className={inputClass}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1 text-xs font-semibold text-ink shadow-2xs hover:bg-surface cursor-pointer dark:border-line/40 dark:bg-[#151928] transition">
                        <Upload className="size-3 text-brand" />
                        <span>{uploadingImage === `proj-${project.id}` ? "Mengonversi..." : "Unggah Cover (WebP)"}</span>
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
                                (url) => updateProject(project.id, { image: url }),
                                `proj-${project.id}`
                              );
                            }
                          }}
                        />
                      </label>
                      {project.image && (
                        <button
                          type="button"
                          onClick={() => updateProject(project.id, { image: "" })}
                          className="inline-flex min-h-[32px] items-center px-2.5 text-xs text-muted hover:text-red-600 transition"
                        >
                          Hapus Cover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div className="mt-4 rounded-xl border border-line/60 bg-surface/50 p-4 dark:border-line/30 dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Galeri Tangkapan Layar ({project.galleryImages?.length || 0} Gambar)</span>
                  <label className="inline-flex min-h-[28px] items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink shadow-2xs hover:bg-surface cursor-pointer dark:border-line/40 dark:bg-[#151928] transition">
                    <Upload className="size-3 text-brand" />
                    <span>+ Tambah Gambar Galeri</span>
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
                            (url) => addGalleryImage(project.id, url),
                            `gallery-${project.id}`
                          );
                        }
                      }}
                    />
                  </label>
                </div>

                {project.galleryImages && project.galleryImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {project.galleryImages.map((imgUrl, gIdx) => (
                      <div key={gIdx} className="group relative aspect-video rounded-lg overflow-hidden border border-line bg-white dark:border-line/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={`Galeri ${gIdx + 1}`} className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(project.id, gIdx)}
                          className="absolute top-1 right-1 rounded bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                          title="Hapus gambar galeri"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
