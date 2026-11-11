"use client";

import { useState } from "react";
import type { SiteConfig, EducationItem, ExperienceItem, AcademicProject } from "@/lib/site-store";
import { Plus, Trash2, ChevronUp, ChevronDown, GraduationCap, Briefcase, Upload, FolderGit2 } from "lucide-react";

interface TabJourneyProps {
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

export function TabJourney({
  config,
  setDraft,
  setStatus,
  uploadAndSet,
  uploadingImage,
  inputClass,
}: TabJourneyProps) {
  const [subTab, setSubTab] = useState<"education" | "experience">("education");

  // ===================== EDUCATION CRUD =====================
  const addEducation = () => {
    const curYear = new Date().getFullYear();
    const newEdu: EducationItem = {
      id: "edu-" + Date.now(),
      institution: "Nama Institusi Pendidikan",
      location: "Kota, Provinsi",
      program: "Program Studi / Jurusan",
      degree: "S1 Teknik Informatika / SMK Multimedia",
      degreeEn: "Bachelor of Computer Science",
      period: `${curYear} — Sekarang`,
      startYear: curYear,
      endYear: null,
      status: "Mahasiswa Aktif",
      statusEn: "Active Student",
      current: true,
      desc: "Fokus studi keilmuan, rekayasa antarmuka web, dan arsitektur sistem...",
      descEn: "Undergraduate focus on web engineering, systems architecture, and 3D web physics...",
      focus: ["Rekayasa Web", "Algoritma"],
      focusEn: ["Web Engineering", "Algorithms"],
      projects: [],
      website: "",
      logo: "",
      published: true,
      sortOrder: (config.education?.length || 0) + 1,
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

  // ===================== EXPERIENCE CRUD =====================
  const addExperience = () => {
    const newExp: ExperienceItem = {
      id: "exp-" + Date.now(),
      role: "Nama Jabatan / Peran",
      roleEn: "Role Title",
      org: "Nama Organisasi / Komunitas",
      place: "Bangkalan / Mojokerto",
      period: "2024 — Sekarang",
      desc: "Deskripsi kepemimpinan divisi, perancangan aset visual, dokumentasi, dan pengelolaan program...",
      descEn: "Leading visual design, documentation, and digital media production...",
      published: true,
      sortOrder: (config.experience?.length || 0) + 1,
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

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex items-center gap-2 border-b border-line pb-3 dark:border-line/40">
        <button
          type="button"
          onClick={() => setSubTab("education")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "education"
              ? "bg-brand text-white shadow-xs"
              : "border border-line text-body hover:text-ink dark:border-line/40"
          }`}
        >
          <GraduationCap className="size-4" />
          <span>Jejak Akademik ({config.education?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("experience")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "experience"
              ? "bg-brand text-white shadow-xs"
              : "border border-line text-body hover:text-ink dark:border-line/40"
          }`}
        >
          <Briefcase className="size-4" />
          <span>Pengalaman Organisasi ({config.experience?.length || 0})</span>
        </button>
      </div>

      {subTab === "education" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Manajemen Pendidikan Formal</h2>
              <p className="text-xs text-muted">Ditampilkan di timeline horizontal Jejak Akademik</p>
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Pendidikan</span>
            </button>
          </div>

          <div className="space-y-4">
            {(config.education || []).map((edu, idx) => (
              <div
                key={edu.id}
                className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                    <h3 className="font-display text-sm font-bold text-ink">{edu.institution}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-body">
                      <input
                        type="checkbox"
                        checked={edu.published !== false}
                        onChange={(e) => updateEducation(edu.id, { published: e.target.checked })}
                        className="size-4 rounded border-line text-brand focus:ring-brand"
                      />
                      <span>Publik</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => moveEducation(edu.id, "up")}
                      disabled={idx === 0}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveEducation(edu.id, "down")}
                      disabled={idx === (config.education?.length || 0) - 1}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEducation(edu.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink">Nama Institusi</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Lokasi</label>
                    <input
                      type="text"
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Gelar / Jenjang (ID)</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Degree (EN)</label>
                    <input
                      type="text"
                      value={edu.degreeEn || ""}
                      onChange={(e) => updateEducation(edu.id, { degreeEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Tahun Mulai</label>
                    <input
                      type="number"
                      value={edu.startYear}
                      onChange={(e) => updateEducation(edu.id, { startYear: Number(e.target.value) })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Tahun Selesai (Kosong = Sekarang)</label>
                    <input
                      type="number"
                      value={edu.endYear ?? ""}
                      onChange={(e) =>
                        updateEducation(edu.id, {
                          endYear: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink">Deskripsi Studi (ID)</label>
                    <textarea
                      rows={2}
                      value={edu.desc || ""}
                      onChange={(e) => updateEducation(edu.id, { desc: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink">Study Description (EN)</label>
                    <textarea
                      rows={2}
                      value={edu.descEn || ""}
                      onChange={(e) => updateEducation(edu.id, { descEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                </div>

                {/* Academic Projects Sub-module */}
                <div className="mt-5 border-t border-line/60 pt-4 dark:border-line/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-ink">Proyek Akademik Relevan</span>
                    <button
                      type="button"
                      onClick={() => addAcademicProject(edu.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      <Plus className="size-3" />
                      <span>Tambah Proyek</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(edu.projects || []).map((proj, pIdx) => (
                      <div
                        key={pIdx}
                        className="rounded-xl border border-line/60 bg-surface/40 p-3 text-xs dark:border-line/30 dark:bg-slate-900/40"
                      >
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) => updateAcademicProject(edu.id, pIdx, { title: e.target.value })}
                            className={inputClass}
                            placeholder="Judul Proyek Akademik"
                          />
                          <input
                            type="text"
                            value={proj.repo || ""}
                            onChange={(e) => updateAcademicProject(edu.id, pIdx, { repo: e.target.value })}
                            className={inputClass}
                            placeholder="Tautan Repositori GitHub"
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={proj.desc || ""}
                            onChange={(e) => updateAcademicProject(edu.id, pIdx, { desc: e.target.value })}
                            className={`flex-1 ${inputClass}`}
                            placeholder="Deskripsi singkat proyek..."
                          />
                          <button
                            type="button"
                            onClick={() => deleteAcademicProject(edu.id, pIdx)}
                            className="p-1 text-muted hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Manajemen Pengalaman Organisasi & Kerja</h2>
              <p className="text-xs text-muted">Ditampilkan di timeline horizontal Pengalaman</p>
            </div>
            <button
              type="button"
              onClick={addExperience}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Pengalaman</span>
            </button>
          </div>

          <div className="space-y-4">
            {(config.experience || []).map((exp, idx) => (
              <div
                key={exp.id}
                className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                    <h3 className="font-display text-sm font-bold text-ink">
                      {exp.role} — {exp.org}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-body">
                      <input
                        type="checkbox"
                        checked={exp.published !== false}
                        onChange={(e) => updateExperience(exp.id, { published: e.target.checked })}
                        className="size-4 rounded border-line text-brand focus:ring-brand"
                      />
                      <span>Publik</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => moveExperience(exp.id, "up")}
                      disabled={idx === 0}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveExperience(exp.id, "down")}
                      disabled={idx === (config.experience?.length || 0) - 1}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteExperience(exp.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink">Peran / Jabatan (ID)</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Role Title (EN)</label>
                    <input
                      type="text"
                      value={exp.roleEn || ""}
                      onChange={(e) => updateExperience(exp.id, { roleEn: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Nama Organisasi / Perusahaan</label>
                    <input
                      type="text"
                      value={exp.org}
                      onChange={(e) => updateExperience(exp.id, { org: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Periode Waktu</label>
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) => updateExperience(exp.id, { period: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink">Deskripsi Pengalaman (ID)</label>
                    <textarea
                      rows={3}
                      value={exp.desc}
                      onChange={(e) => updateExperience(exp.id, { desc: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink">Experience Description (EN)</label>
                    <textarea
                      rows={3}
                      value={exp.descEn || ""}
                      onChange={(e) => updateExperience(exp.id, { descEn: e.target.value })}
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

export default TabJourney;
