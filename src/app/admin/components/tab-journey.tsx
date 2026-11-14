"use client";

import { useState, useMemo } from "react";
import type { SiteConfig, EducationItem, ExperienceItem } from "@/lib/site-store";
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
  Trash2,
  GraduationCap,
  Briefcase,
  Building2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

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

const PAGE_SIZE = 10;

function matchesStatusFilter(
  item: { published?: boolean; visible?: boolean },
  filter: "all" | "published" | "draft" | "hidden"
): boolean {
  if (filter === "published") return item.published !== false && item.visible !== false;
  if (filter === "draft") return item.published === false;
  if (filter === "hidden") return item.published !== false && item.visible === false;
  return true;
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

  // Search/filter/pagination state
  const [eduSearch, setEduSearch] = useState("");
  const [eduStatusFilter, setEduStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all");
  const [eduPage, setEduPage] = useState(1);

  const [expSearch, setExpSearch] = useState("");
  const [expTypeFilter, setExpTypeFilter] = useState<string>("all");
  const [expStatusFilter, setExpStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all");
  const [expPage, setExpPage] = useState(1);

  const [pendingDelete, setPendingDelete] = useState<DeleteImpactItem | null>(null);

  const educationList = config.education || [];
  const experienceList = config.experience || [];

  // ===================== EDUCATION CRUD =====================
  const addEducation = () => {
    const curYear = new Date().getFullYear();
    const newEdu: EducationItem = {
      id: "edu-" + Date.now(),
      institution: "Nama Institusi / Universitas",
      degree: "S1 / Sarjana",
      degreeEn: "Bachelor's Degree",
      program: "Nama Program Studi",
      programEn: "Major / Study Program",
      period: `${curYear} - Sekarang`,
      startYear: curYear,
      endYear: undefined,
      current: true,
      location: "Kota, Negara",
      website: "",
      logo: "",
      status: "Mahasiswa Aktif",
      statusEn: "Active Student",
      desc: "Penjelasan fokus pembelajaran, riset, dan kontribusi...",
      descEn: "Overview of academic focus, coursework, and projects...",
      focus: ["Software Engineering", "UI/UX Design"],
      focusEn: ["Software Engineering", "UI/UX Design"],
      activities: [],
      activitiesEn: [],
      timelineYear: curYear,
      showInTimeline: true,
      projects: [],
      published: true,
      visible: true,
      sortOrder: educationList.length + 1,
    };
    setDraft({ ...config, education: [...educationList, newEdu] });
    setStatus("Institusi pendidikan ditambahkan ke draft");
  };

  const updateEducation = (id: string, updates: Partial<EducationItem>) => {
    setDraft({
      ...config,
      education: educationList.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
    setStatus("Data pendidikan diperbarui");
  };

  const requestDeleteEducation = (edu: EducationItem) => {
    setPendingDelete({
      entityType: "Riwayat Pendidikan",
      itemName: edu.institution || edu.program || edu.id,
      impacts: [
        "Menghapus kartu institusi dari seksi Jejak Akademik.",
        edu.showInTimeline !== false
          ? "Menghapus node milestone pada timeline pendidikan publik."
          : "Item tidak muncul di timeline, tetap terhapus permanen dari database.",
        "Mengurangi daftar organisasi/alumniOf pada JSON-LD SEO dan konteks Buddy AI.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          education: educationList.filter((e) => e.id !== edu.id),
        });
        setPendingDelete(null);
        setStatus("Riwayat pendidikan dihapus");
      },
    });
  };

  const moveEducation = (id: string, direction: "up" | "down") => {
    const idx = educationList.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= educationList.length) return;
    setDraft({
      ...config,
      education: reorderItemsWithSortOrder(educationList, idx, targetIdx),
    });
    setStatus("Urutan riwayat pendidikan diubah");
  };

  const addEduProject = (eduId: string) => {
    const target = educationList.find((e) => e.id === eduId);
    if (!target) return;
    updateEducation(eduId, {
      projects: [
        ...(target.projects || []),
        { title: "Proyek / Riset Baru", desc: "Ringkasan proyek atau studi...", descEn: "", repo: "", url: "" },
      ],
    });
  };

  const updateEduProject = (
    eduId: string,
    projIdx: number,
    updates: Partial<NonNullable<EducationItem["projects"]>[number]>
  ) => {
    const target = educationList.find((e) => e.id === eduId);
    if (!target) return;
    const nextProjects = [...(target.projects || [])];
    nextProjects[projIdx] = { ...nextProjects[projIdx], ...updates };
    updateEducation(eduId, { projects: nextProjects });
  };

  const deleteEduProject = (eduId: string, projIdx: number) => {
    const target = educationList.find((e) => e.id === eduId);
    if (!target) return;
    updateEducation(eduId, {
      projects: (target.projects || []).filter((_, i) => i !== projIdx),
    });
  };

  const eduDrag = useDragReorder(educationList, (reordered) => {
    setDraft({ ...config, education: reordered });
    setStatus("Urutan pendidikan diperbarui (drag)");
  });

  const isEduFiltered = eduSearch.trim() !== "" || eduStatusFilter !== "all";
  const filteredEducation = useMemo(() => {
    const q = eduSearch.trim().toLowerCase();
    return educationList.filter((item) => {
      if (!matchesStatusFilter(item, eduStatusFilter)) return false;
      if (!q) return true;
      return (
        item.institution.toLowerCase().includes(q) ||
        item.program.toLowerCase().includes(q) ||
        item.degree.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.desc || "").toLowerCase().includes(q)
      );
    });
  }, [educationList, eduSearch, eduStatusFilter]);

  const eduTotalPages = Math.max(1, Math.ceil(filteredEducation.length / PAGE_SIZE));
  const safeEduPage = Math.min(eduPage, eduTotalPages);
  const pagedEducation = filteredEducation.slice((safeEduPage - 1) * PAGE_SIZE, safeEduPage * PAGE_SIZE);

  // ===================== EXPERIENCE CRUD =====================
  const addExperience = () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const newExp: ExperienceItem = {
      id: "exp-" + Date.now(),
      role: "Posisi / Peran Baru",
      roleEn: "New Role",
      org: "Nama Organisasi / Perusahaan",
      orgGroup: "",
      orgUrl: "",
      logo: "",
      type: "work",
      period: `${now.getFullYear()} - Sekarang`,
      startDate: ym,
      endDate: "",
      current: true,
      place: "Remote / Indonesia",
      desc: "Tanggung jawab utama, inisiatif produk, dan hasil yang dicapai...",
      descEn: "Key responsibilities, product initiatives, and measurable outcomes...",
      responsibilities: [],
      achievements: [],
      media: [],
      published: true,
      visible: true,
      sortOrder: experienceList.length + 1,
    };
    setDraft({ ...config, experience: [...experienceList, newExp] });
    setStatus("Pengalaman baru ditambahkan ke draft");
  };

  const updateExperience = (id: string, updates: Partial<ExperienceItem>) => {
    setDraft({
      ...config,
      experience: experienceList.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
    setStatus("Data pengalaman diperbarui");
  };

  const requestDeleteExperience = (exp: ExperienceItem) => {
    setPendingDelete({
      entityType: "Pengalaman / Organisasi",
      itemName: `${exp.role} @ ${exp.org}`,
      impacts: [
        "Menghapus kartu dari linimasa Experience & Tentang.",
        "Mempengaruhi perhitungan statistik otomatis (Total Organisasi & Tahun Pengalaman tergabung).",
        "Mengubah kelompok multi-jabatan apabila terhubung lewat orgGroup.",
        "Konteks ini tidak lagi tersedia bagi asisten AI Buddy.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          experience: experienceList.filter((e) => e.id !== exp.id),
        });
        setPendingDelete(null);
        setStatus("Pengalaman dihapus");
      },
    });
  };

  const moveExperience = (id: string, direction: "up" | "down") => {
    const idx = experienceList.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= experienceList.length) return;
    setDraft({
      ...config,
      experience: reorderItemsWithSortOrder(experienceList, idx, targetIdx),
    });
    setStatus("Urutan pengalaman diubah");
  };

  const addExpMedia = (expId: string) => {
    const target = experienceList.find((e) => e.id === expId);
    if (!target) return;
    updateExperience(expId, {
      media: [...(target.media || []), { url: "", caption: "" }],
    });
  };

  const updateExpMedia = (expId: string, mIdx: number, updates: { url?: string; caption?: string }) => {
    const target = experienceList.find((e) => e.id === expId);
    if (!target) return;
    const nextMedia = [...(target.media || [])];
    nextMedia[mIdx] = { ...nextMedia[mIdx], ...updates };
    updateExperience(expId, { media: nextMedia });
  };

  const deleteExpMedia = (expId: string, mIdx: number) => {
    const target = experienceList.find((e) => e.id === expId);
    if (!target) return;
    updateExperience(expId, {
      media: (target.media || []).filter((_, i) => i !== mIdx),
    });
  };

  const expDrag = useDragReorder(experienceList, (reordered) => {
    setDraft({ ...config, experience: reordered });
    setStatus("Urutan pengalaman diperbarui (drag)");
  });

  // Live group stats for same institution roles
  const orgGroupCounts = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const item of experienceList) {
      const label = (item.orgGroup || item.org || "").trim();
      const key = label.toLowerCase();
      if (!key) continue;
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { label, count: 1 });
    }
    return map;
  }, [experienceList]);

  const multiRoleGroups = useMemo(
    () => Array.from(orgGroupCounts.values()).filter((g) => g.count > 1),
    [orgGroupCounts]
  );

  const isExpFiltered =
    expSearch.trim() !== "" || expTypeFilter !== "all" || expStatusFilter !== "all";
  const filteredExperience = useMemo(() => {
    const q = expSearch.trim().toLowerCase();
    return experienceList.filter((item) => {
      if (!matchesStatusFilter(item, expStatusFilter)) return false;
      if (expTypeFilter !== "all" && (item.type || "organization") !== expTypeFilter) return false;
      if (!q) return true;
      return (
        item.role.toLowerCase().includes(q) ||
        (item.roleEn || "").toLowerCase().includes(q) ||
        item.org.toLowerCase().includes(q) ||
        (item.orgGroup || "").toLowerCase().includes(q) ||
        item.place.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
      );
    });
  }, [experienceList, expSearch, expTypeFilter, expStatusFilter]);

  const expTotalPages = Math.max(1, Math.ceil(filteredExperience.length / PAGE_SIZE));
  const safeExpPage = Math.min(expPage, expTotalPages);
  const pagedExperience = filteredExperience.slice((safeExpPage - 1) * PAGE_SIZE, safeExpPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <ConfirmImpactModal pendingDelete={pendingDelete} onCancel={() => setPendingDelete(null)} />

      {/* Subtab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3 dark:border-line/40">
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
          <span>Pendidikan & Sekolah ({educationList.length})</span>
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
          <span>Pengalaman & Organisasi ({experienceList.length})</span>
        </button>
      </div>

      {subTab === "education" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Manajemen Akademik & Institusi
              </h2>
              <p className="text-xs text-muted">
                Kelola sekolah/universitas, logo, milestone timeline, fokus studi, aktivitas, dan proyek akademik
              </p>
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Pendidikan</span>
            </button>
          </div>

          <AdminSearchFilterBar
            search={eduSearch}
            onSearchChange={(val) => {
              setEduSearch(val);
              setEduPage(1);
            }}
            searchPlaceholder="Cari nama institusi, jurusan, kota..."
            statusFilter={eduStatusFilter}
            onStatusFilterChange={(val) => {
              setEduStatusFilter(val);
              setEduPage(1);
            }}
            totalCount={educationList.length}
            filteredCount={filteredEducation.length}
          />

          {/* Live Timeline Node Summary */}
          {educationList.some((e) => e.published !== false && e.visible !== false && e.showInTimeline !== false) && (
            <div className="rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-xs text-body dark:border-line/40 dark:bg-slate-900/40">
              <span className="font-semibold text-ink">Milestone Timeline Publik: </span>
              {educationList
                .filter((e) => e.published !== false && e.visible !== false && e.showInTimeline !== false)
                .map((e) => `${e.timelineYear || e.startYear || e.period} (${e.institution})`)
                .join("  •  ")}
            </div>
          )}

          {pagedEducation.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted dark:border-line/40">
              {educationList.length === 0
                ? 'Belum ada data pendidikan. Klik "Tambah Pendidikan" untuk memulai.'
                : "Tidak ada riwayat pendidikan yang sesuai filter."}
            </div>
          ) : (
            <div className="space-y-5">
              {pagedEducation.map((edu) => {
                const rawIndex = educationList.findIndex((e) => e.id === edu.id);
                const hasYearIssue =
                  !edu.current && edu.startYear && edu.endYear && edu.startYear > edu.endYear;

                return (
                  <div
                    key={edu.id}
                    {...(!isEduFiltered ? eduDrag.getDragProps(rawIndex) : {})}
                    className={`rounded-2xl border bg-white p-5 transition dark:bg-[#0c0e17] ${
                      eduDrag.dragIndex === rawIndex
                        ? "border-brand opacity-70"
                        : "border-line dark:border-line/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                      <div className="flex items-center gap-2.5">
                        {edu.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={edu.logo}
                            alt={edu.institution}
                            className="size-8 rounded-lg border border-line object-contain bg-white p-0.5 dark:border-line/40"
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-muted dark:border-line/40">
                            <GraduationCap className="size-4" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-display text-sm font-bold text-ink">
                            {edu.institution || "Institusi Tanpa Nama"}
                          </h3>
                          <p className="text-[11px] text-muted">
                            {edu.degree} — {edu.program}
                          </p>
                        </div>
                      </div>

                      <AdminItemActionBar
                        published={edu.published}
                        visible={edu.visible}
                        onTogglePublished={() =>
                          updateEducation(edu.id, { published: edu.published === false })
                        }
                        onToggleVisible={() =>
                          updateEducation(edu.id, { visible: edu.visible === false })
                        }
                        onMoveUp={() => moveEducation(edu.id, "up")}
                        onMoveDown={() => moveEducation(edu.id, "down")}
                        disableMoveUp={isEduFiltered || rawIndex <= 0}
                        disableMoveDown={isEduFiltered || rawIndex >= educationList.length - 1}
                        onDelete={() => requestDeleteEducation(edu)}
                        dragHandleProps={!isEduFiltered ? eduDrag.getHandleProps(rawIndex) : undefined}
                      />
                    </div>

                    {(!edu.institution?.trim() || hasYearIssue) && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>
                          {!edu.institution?.trim()
                            ? "Nama institusi wajib diisi."
                            : `Tahun mulai (${edu.startYear}) lebih besar daripada tahun selesai (${edu.endYear}).`}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink">Nama Sekolah / Universitas *</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Lokasi Kampus / Kota</label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Surabaya, Jawa Timur"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Website Institusi (URL)</label>
                        <input
                          type="url"
                          value={edu.website || ""}
                          onChange={(e) => updateEducation(edu.id, { website: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Jenjang / Gelar (ID)</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="S1 Teknik Informatika / SMK"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Degree (EN)</label>
                        <input
                          type="text"
                          value={edu.degreeEn}
                          onChange={(e) => updateEducation(edu.id, { degreeEn: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="B.Sc. in Computer Science"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Periode Tampilan</label>
                        <input
                          type="text"
                          value={edu.period}
                          onChange={(e) => updateEducation(edu.id, { period: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="2023 - Sekarang"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Jurusan / Program Studi (ID)</label>
                        <input
                          type="text"
                          value={edu.program}
                          onChange={(e) => updateEducation(edu.id, { program: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Major / Program (EN)</label>
                        <input
                          type="text"
                          value={edu.programEn}
                          onChange={(e) => updateEducation(edu.id, { programEn: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-ink">Tahun Mulai</label>
                          <input
                            type="number"
                            value={edu.startYear ?? ""}
                            onChange={(e) =>
                              updateEducation(edu.id, {
                                startYear: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            className={`mt-1.5 ${inputClass}`}
                            placeholder="2023"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink">Tahun Lulus</label>
                          <input
                            type="number"
                            disabled={Boolean(edu.current)}
                            value={edu.current ? "" : (edu.endYear ?? "")}
                            onChange={(e) =>
                              updateEducation(edu.id, {
                                endYear: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            className={`mt-1.5 disabled:opacity-50 ${inputClass}`}
                            placeholder={edu.current ? "Aktif" : "2027"}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Status Studi (ID)</label>
                        <input
                          type="text"
                          value={edu.status}
                          onChange={(e) => updateEducation(edu.id, { status: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Mahasiswa Aktif / Lulus"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Study Status (EN)</label>
                        <input
                          type="text"
                          value={edu.statusEn}
                          onChange={(e) => updateEducation(edu.id, { statusEn: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Active Student / Graduated"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Tahun Milestone Timeline</label>
                        <input
                          type="number"
                          value={edu.timelineYear ?? ""}
                          onChange={(e) =>
                            updateEducation(edu.id, {
                              timelineYear: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                          placeholder={String(edu.startYear || "2023")}
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-5 pt-1">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                          <input
                            type="checkbox"
                            checked={Boolean(edu.current)}
                            onChange={(e) =>
                              updateEducation(edu.id, {
                                current: e.target.checked,
                                endYear: e.target.checked ? undefined : edu.endYear,
                              })
                            }
                            className="size-4 rounded border-line text-brand focus:ring-brand"
                          />
                          <span>Sedang Menempuh Studi (Aktif)</span>
                        </label>

                        <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                          <input
                            type="checkbox"
                            checked={edu.showInTimeline !== false}
                            onChange={(e) => updateEducation(edu.id, { showInTimeline: e.target.checked })}
                            className="size-4 rounded border-line text-brand focus:ring-brand"
                          />
                          <span>Tampilkan Node di Timeline Akademik</span>
                        </label>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <MediaFieldControl
                          label="Logo Institusi (WebP / PNG / SVG)"
                          value={edu.logo || ""}
                          onChange={(url) => updateEducation(edu.id, { logo: url })}
                          folder="education"
                          fieldKey={`edu-logo-${edu.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="image/webp,image/png,image/jpeg,image/svg+xml"
                          placeholder="/icons/... atau URL R2"
                          previewShape="square"
                        />
                      </div>

                      <div className="sm:col-span-1 lg:col-span-1.5">
                        <label className="block text-xs font-semibold text-ink">Deskripsi (ID)</label>
                        <textarea
                          rows={3}
                          value={edu.desc || ""}
                          onChange={(e) => updateEducation(edu.id, { desc: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div className="sm:col-span-1 lg:col-span-2">
                        <label className="block text-xs font-semibold text-ink">Description (EN)</label>
                        <textarea
                          rows={3}
                          value={edu.descEn || ""}
                          onChange={(e) => updateEducation(edu.id, { descEn: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Fokus Studi (ID, pisah koma)</label>
                        <input
                          type="text"
                          value={(edu.focus || []).join(", ")}
                          onChange={(e) =>
                            updateEducation(edu.id, {
                              focus: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Rekayasa Perangkat Lunak, UI/UX"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Study Focus (EN, comma-separated)</label>
                        <input
                          type="text"
                          value={(edu.focusEn || []).join(", ")}
                          onChange={(e) =>
                            updateEducation(edu.id, {
                              focusEn: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Software Engineering, HCI"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Aktivitas / Organisasi Kampus (ID, per baris)</label>
                        <textarea
                          rows={2}
                          value={(edu.activities || []).join("\n")}
                          onChange={(e) =>
                            updateEducation(edu.id, {
                              activities: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Satu aktivitas per baris"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold text-ink">Activities (EN, per line)</label>
                        <textarea
                          rows={2}
                          value={(edu.activitiesEn || []).join("\n")}
                          onChange={(e) =>
                            updateEducation(edu.id, {
                              activitiesEn: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="One activity per line"
                        />
                      </div>
                    </div>

                    {/* Related Academic Projects */}
                    <div className="mt-5 border-t border-line pt-4 dark:border-line/40">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted">
                          Proyek / Riset Akademik Terkait ({edu.projects?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() => addEduProject(edu.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-surface dark:border-line/40"
                        >
                          <Plus className="size-3" />
                          <span>Tambah Proyek Akademik</span>
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {(edu.projects || []).map((proj, pIdx) => (
                          <div
                            key={pIdx}
                            className="rounded-xl border border-line bg-surface/50 p-3 dark:border-line/30 dark:bg-slate-900/40"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <input
                                type="text"
                                value={proj.title}
                                onChange={(e) => updateEduProject(edu.id, pIdx, { title: e.target.value })}
                                className="flex-1 bg-transparent text-xs font-bold text-ink border-b border-dashed border-line focus:outline-none focus:border-brand"
                                placeholder="Judul proyek"
                              />
                              <button
                                type="button"
                                onClick={() => deleteEduProject(edu.id, pIdx)}
                                className="text-muted hover:text-red-500"
                                title="Hapus proyek akademik"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={proj.desc}
                              onChange={(e) => updateEduProject(edu.id, pIdx, { desc: e.target.value })}
                              className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] text-body dark:border-line/30 dark:bg-slate-950"
                              placeholder="Deskripsi (ID)"
                            />
                            <input
                              type="text"
                              value={proj.descEn || ""}
                              onChange={(e) => updateEduProject(edu.id, pIdx, { descEn: e.target.value })}
                              className="mt-1.5 w-full rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] text-body dark:border-line/30 dark:bg-slate-950"
                              placeholder="Description (EN)"
                            />
                            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                value={proj.repo || ""}
                                onChange={(e) => updateEduProject(edu.id, pIdx, { repo: e.target.value })}
                                className="w-full rounded-lg border border-line bg-white px-2 py-1 text-[11px] text-muted dark:border-line/30 dark:bg-slate-950"
                                placeholder="Repo: owner/repo atau URL"
                              />
                              <input
                                type="url"
                                value={proj.url || ""}
                                onChange={(e) => updateEduProject(edu.id, pIdx, { url: e.target.value })}
                                className="w-full rounded-lg border border-line bg-white px-2 py-1 text-[11px] text-muted dark:border-line/30 dark:bg-slate-950"
                                placeholder="URL Demo / Paper"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AdminPaginationBar page={safeEduPage} totalPages={eduTotalPages} onPageChange={setEduPage} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Manajemen Pengalaman & Organisasi
              </h2>
              <p className="text-xs text-muted">
                Kelola jabatan, pengelompokan multi-peran institusi (orgGroup), tanggal terstruktur untuk statistik otomatis, dan lampiran
              </p>
            </div>
            <button
              type="button"
              onClick={addExperience}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Pengalaman</span>
            </button>
          </div>

          <AdminSearchFilterBar
            search={expSearch}
            onSearchChange={(val) => {
              setExpSearch(val);
              setExpPage(1);
            }}
            searchPlaceholder="Cari jabatan, organisasi, grup institusi, lokasi..."
            filterValue={expTypeFilter}
            onFilterChange={(val) => {
              setExpTypeFilter(val);
              setExpPage(1);
            }}
            filterOptions={[
              { value: "all", label: "Semua Jenis" },
              { value: "work", label: "Pekerjaan / Freelance" },
              { value: "organization", label: "Organisasi" },
              { value: "community", label: "Komunitas" },
              { value: "committee", label: "Kepanitiaan / Event" },
            ]}
            statusFilter={expStatusFilter}
            onStatusFilterChange={(val) => {
              setExpStatusFilter(val);
              setExpPage(1);
            }}
            totalCount={experienceList.length}
            filteredCount={filteredExperience.length}
          />

          {/* Live Grouped Institution Summary */}
          {multiRoleGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-xs dark:border-line/40 dark:bg-slate-900/40">
              <Building2 className="size-3.5 text-brand" />
              <span className="font-semibold text-ink">Institusi Multi-Jabatan:</span>
              {multiRoleGroups.map((g) => (
                <span
                  key={g.label}
                  className="rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand dark:text-blue-400"
                >
                  {g.label} ({g.count} peran)
                </span>
              ))}
            </div>
          )}

          {pagedExperience.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted dark:border-line/40">
              {experienceList.length === 0
                ? 'Belum ada pengalaman. Klik "Tambah Pengalaman" untuk memulai.'
                : "Tidak ada pengalaman yang sesuai filter."}
            </div>
          ) : (
            <div className="space-y-5">
              {pagedExperience.map((exp) => {
                const rawIndex = experienceList.findIndex((e) => e.id === exp.id);
                const groupKey = (exp.orgGroup || exp.org || "").trim().toLowerCase();
                const groupCount = groupKey ? orgGroupCounts.get(groupKey)?.count || 1 : 1;
                const hasDateIssue =
                  !exp.current && exp.startDate && exp.endDate && exp.startDate > exp.endDate;

                return (
                  <div
                    key={exp.id}
                    {...(!isExpFiltered ? expDrag.getDragProps(rawIndex) : {})}
                    className={`rounded-2xl border bg-white p-5 transition dark:bg-[#0c0e17] ${
                      expDrag.dragIndex === rawIndex
                        ? "border-brand opacity-70"
                        : "border-line dark:border-line/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {exp.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={exp.logo}
                            alt={exp.org}
                            className="size-8 rounded-lg border border-line object-contain bg-white p-0.5 dark:border-line/40"
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-muted dark:border-line/40">
                            <Briefcase className="size-4" />
                          </div>
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-sm font-bold text-ink">
                              {exp.role || "Jabatan Baru"}
                            </h3>
                            <span className="text-xs font-semibold text-brand">@ {exp.org}</span>
                            {groupCount > 1 && (
                              <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                                Grup: {exp.orgGroup || exp.org} ({groupCount})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted">{exp.period}</p>
                        </div>
                      </div>

                      <AdminItemActionBar
                        published={exp.published}
                        visible={exp.visible}
                        onTogglePublished={() =>
                          updateExperience(exp.id, { published: exp.published === false })
                        }
                        onToggleVisible={() =>
                          updateExperience(exp.id, { visible: exp.visible === false })
                        }
                        onMoveUp={() => moveExperience(exp.id, "up")}
                        onMoveDown={() => moveExperience(exp.id, "down")}
                        disableMoveUp={isExpFiltered || rawIndex <= 0}
                        disableMoveDown={isExpFiltered || rawIndex >= experienceList.length - 1}
                        onDelete={() => requestDeleteExperience(exp)}
                        dragHandleProps={!isExpFiltered ? expDrag.getHandleProps(rawIndex) : undefined}
                      />
                    </div>

                    {(!exp.role?.trim() || !exp.org?.trim() || hasDateIssue) && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>
                          {!exp.role?.trim() || !exp.org?.trim()
                            ? "Jabatan dan nama organisasi/perusahaan wajib diisi."
                            : `Tanggal mulai (${exp.startDate}) lebih akhir dibanding tanggal selesai (${exp.endDate}).`}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink">Jabatan / Posisi (ID) *</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Role / Position (EN)</label>
                        <input
                          type="text"
                          value={exp.roleEn || ""}
                          onChange={(e) => updateExperience(exp.id, { roleEn: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Jenis Pengalaman</label>
                        <select
                          value={exp.type || "organization"}
                          onChange={(e) =>
                            updateExperience(exp.id, {
                              type: e.target.value as ExperienceItem["type"],
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                        >
                          <option value="work">Pekerjaan / Freelance (Work)</option>
                          <option value="organization">Organisasi (Organization)</option>
                          <option value="community">Komunitas (Community)</option>
                          <option value="committee">Kepanitiaan / Event (Committee)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Organisasi / Perusahaan *</label>
                        <input
                          type="text"
                          value={exp.org}
                          onChange={(e) => updateExperience(exp.id, { org: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Grup Institusi (`orgGroup`)</label>
                        <input
                          type="text"
                          value={exp.orgGroup || ""}
                          onChange={(e) => updateExperience(exp.id, { orgGroup: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Samakan nama grup untuk hubungkan beberapa peran"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Tautan Institusi (URL)</label>
                        <input
                          type="url"
                          value={exp.orgUrl || ""}
                          onChange={(e) => updateExperience(exp.id, { orgUrl: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Periode Tampilan</label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => updateExperience(exp.id, { period: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Jan 2024 - Sekarang"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Lokasi / Mode</label>
                        <input
                          type="text"
                          value={exp.place}
                          onChange={(e) => updateExperience(exp.id, { place: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Remote / Surabaya"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-ink">Mulai (`YYYY-MM`)</label>
                          <input
                            type="month"
                            value={exp.startDate || ""}
                            onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                            className={`mt-1.5 ${inputClass}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink">Selesai (`YYYY-MM`)</label>
                          <input
                            type="month"
                            disabled={Boolean(exp.current)}
                            value={exp.current ? "" : (exp.endDate || "")}
                            onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                            className={`mt-1.5 disabled:opacity-50 ${inputClass}`}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                          <input
                            type="checkbox"
                            checked={Boolean(exp.current)}
                            onChange={(e) =>
                              updateExperience(exp.id, {
                                current: e.target.checked,
                                endDate: e.target.checked ? "" : exp.endDate,
                              })
                            }
                            className="size-4 rounded border-line text-brand focus:ring-brand"
                          />
                          <span>Masih Aktif Menjabat (Current — dihitung sampai bulan ini di statistik)</span>
                        </label>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <MediaFieldControl
                          label="Logo Institusi / Organisasi"
                          value={exp.logo || ""}
                          onChange={(url) => updateExperience(exp.id, { logo: url })}
                          folder="experience"
                          fieldKey={`exp-logo-${exp.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="image/webp,image/png,image/jpeg,image/svg+xml"
                          placeholder="/icons/... atau URL R2"
                          previewShape="square"
                        />
                      </div>

                      <div className="lg:col-span-1">
                        <label className="block text-xs font-semibold text-ink">Deskripsi Singkat (ID)</label>
                        <textarea
                          rows={3}
                          value={exp.desc}
                          onChange={(e) => updateExperience(exp.id, { desc: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-ink">Short Description (EN)</label>
                        <textarea
                          rows={3}
                          value={exp.descEn || ""}
                          onChange={(e) => updateExperience(exp.id, { descEn: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Tanggung Jawab (1 per baris)</label>
                        <textarea
                          rows={3}
                          value={(exp.responsibilities || []).join("\n")}
                          onChange={(e) =>
                            updateExperience(exp.id, {
                              responsibilities: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Merancang komponen UI...&#10;Mengelola integrasi API..."
                        />
                      </div>

                      <div className="sm:col-span-1 lg:col-span-2">
                        <label className="block text-xs font-semibold text-ink">Pencapaian / Dampak Utama (1 per baris)</label>
                        <textarea
                          rows={3}
                          value={(exp.achievements || []).join("\n")}
                          onChange={(e) =>
                            updateExperience(exp.id, {
                              achievements: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Mempercepat waktu rilis hingga 30%..."
                        />
                      </div>
                    </div>

                    {/* Media Attachments */}
                    <div className="mt-4 border-t border-line pt-4 dark:border-line/40">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted">
                          Media / Lampiran Pendukung ({exp.media?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() => addExpMedia(exp.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-surface dark:border-line/40"
                        >
                          <Plus className="size-3" />
                          <span>Tambah Lampiran</span>
                        </button>
                      </div>

                      {(exp.media || []).length > 0 && (
                        <div className="space-y-3">
                          {(exp.media || []).map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className="rounded-xl border border-line bg-surface/50 p-3 dark:border-line/30 dark:bg-slate-900/40"
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <input
                                  type="text"
                                  value={m.caption || ""}
                                  onChange={(e) =>
                                    updateExpMedia(exp.id, mIdx, { caption: e.target.value })
                                  }
                                  className={`flex-1 ${inputClass}`}
                                  placeholder={`Label lampiran #${mIdx + 1} (mis. Surat Tugas / Dokumentasi)`}
                                />
                                {m.url && (
                                  <a
                                    href={m.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-lg border border-line p-2 text-brand hover:bg-white dark:border-line/40"
                                    title="Buka lampiran"
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteExpMedia(exp.id, mIdx)}
                                  className="rounded-lg p-2 text-muted hover:text-red-500"
                                  title="Hapus lampiran"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                              <MediaFieldControl
                                label="URL / Berkas Lampiran"
                                value={m.url}
                                onChange={(url) => updateExpMedia(exp.id, mIdx, { url })}
                                folder="experience"
                                fieldKey={`exp-media-${exp.id}-${mIdx}`}
                                uploadAndSet={uploadAndSet}
                                uploadingImage={uploadingImage}
                                config={config}
                                accept="image/webp,image/png,image/jpeg,image/svg+xml,application/pdf"
                                placeholder="https://... atau /api/r2-file?key=..."
                                previewShape="wide"
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

          <AdminPaginationBar page={safeExpPage} totalPages={expTotalPages} onPageChange={setExpPage} />
        </div>
      )}
    </div>
  );
}

export default TabJourney;
