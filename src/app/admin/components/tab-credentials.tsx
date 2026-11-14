"use client";

import { useState, useMemo } from "react";
import type {
  SiteConfig,
  CertificateItem,
  AchievementItem,
  CvDocConfig,
  CvSettingsConfig,
} from "@/lib/site-store";
import type { RoleKey } from "@/components/cv-preview-modal";
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
  ChevronLeft,
  ChevronRight,
  Award,
  Trophy,
  FileText,
  Upload,
  Star,
  AlertCircle,
  Lock,
} from "lucide-react";

interface TabCredentialsProps {
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
  setPreviewCvRole: (role: RoleKey | null) => void;
}

const PAGE_SIZE = 12;

function matchesStatusFilter(
  item: { published?: boolean; visible?: boolean },
  filter: "all" | "published" | "draft" | "hidden"
): boolean {
  if (filter === "published") return item.published !== false && item.visible !== false;
  if (filter === "draft") return item.published === false;
  if (filter === "hidden") return item.published !== false && item.visible === false;
  return true;
}

export function TabCredentials({
  config,
  setDraft,
  setStatus,
  uploadAndSet,
  uploadingImage,
  inputClass,
  setPreviewCvRole,
}: TabCredentialsProps) {
  const [subTab, setSubTab] = useState<"certificates" | "achievements" | "cv">("certificates");

  // Filter states
  const [certSearch, setCertSearch] = useState("");
  const [certCategoryFilter, setCertCategoryFilter] = useState("all");
  const [certStatusFilter, setCertStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all");
  const [certPage, setCertPage] = useState(1);

  const [achSearch, setAchSearch] = useState("");
  const [achCategoryFilter, setAchCategoryFilter] = useState("all");
  const [achStatusFilter, setAchStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all");
  const [achPage, setAchPage] = useState(1);

  const [cvSearch, setCvSearch] = useState("");
  const [cvStatusFilter, setCvStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all");

  const [pendingDelete, setPendingDelete] = useState<DeleteImpactItem | null>(null);

  const certList = config.certificates || [];
  const achList = config.achievements || [];
  const cvList = config.cvDocs || [];
  const cvSettings: CvSettingsConfig = config.cvSettings || { allowDownload: true };

  // ===================== CERTIFICATES CRUD =====================
  const addCertificate = () => {
    const curYear = new Date().getFullYear();
    const newCert: CertificateItem = {
      id: "cert-" + Date.now(),
      title: "Nama Sertifikat / Kredensial",
      issuer: "Lembaga Penerbit Resmi",
      issuerLogo: "",
      date: `${curYear}`,
      expiryDate: "",
      credentialUrl: "",
      credentialPdf: "",
      credentialId: "",
      image: "",
      desc: "",
      descEn: "",
      category: "design",
      featured: false,
      allowDownload: true,
      published: true,
      visible: true,
      sortOrder: certList.length + 1,
    };
    const nextList = [...certList, newCert];
    setCertSearch("");
    setCertCategoryFilter("all");
    setCertStatusFilter("all");
    setCertPage(Math.max(1, Math.ceil(nextList.length / PAGE_SIZE)));
    setDraft({ ...config, certificates: nextList });
    setStatus("Sertifikat baru ditambahkan ke draft");
  };

  const updateCertificate = (id: string, updates: Partial<CertificateItem>) => {
    setDraft({
      ...config,
      certificates: certList.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
    setStatus("Data sertifikat diperbarui");
  };

  const requestDeleteCertificate = (cert: CertificateItem) => {
    setPendingDelete({
      entityType: "Sertifikat Terverifikasi",
      itemName: cert.title || cert.id,
      impacts: [
        "Menghapus kartu kredensial dari seksi Sertifikasi publik.",
        "Menurunkan perhitungan otomatis jumlah Sertifikat pada blok Statistik Tentang.",
        "Menghilangkan referensi sertifikat ini dari pengetahuan Buddy AI.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          certificates: certList.filter((c) => c.id !== cert.id),
        });
        setPendingDelete(null);
        setStatus("Sertifikat dihapus");
      },
    });
  };

  const moveCertificate = (id: string, direction: "up" | "down") => {
    const idx = certList.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= certList.length) return;
    setDraft({
      ...config,
      certificates: reorderItemsWithSortOrder(certList, idx, targetIdx),
    });
    setStatus("Urutan sertifikat diubah");
  };

  const certDrag = useDragReorder(certList, (reordered) => {
    setDraft({ ...config, certificates: reordered });
    setStatus("Urutan sertifikat diperbarui (drag)");
  });

  const isCertFiltered =
    certSearch.trim() !== "" || certCategoryFilter !== "all" || certStatusFilter !== "all";
  const filteredCerts = useMemo(() => {
    const q = certSearch.trim().toLowerCase();
    return certList.filter((c) => {
      if (!matchesStatusFilter(c, certStatusFilter)) return false;
      if (certCategoryFilter !== "all" && c.category !== certCategoryFilter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.issuer.toLowerCase().includes(q) ||
        (c.credentialId || "").toLowerCase().includes(q) ||
        c.date.toLowerCase().includes(q)
      );
    });
  }, [certList, certSearch, certCategoryFilter, certStatusFilter]);

  const certTotalPages = Math.max(1, Math.ceil(filteredCerts.length / PAGE_SIZE));
  const safeCertPage = Math.min(certPage, certTotalPages);
  const pagedCerts = filteredCerts.slice((safeCertPage - 1) * PAGE_SIZE, safeCertPage * PAGE_SIZE);

  // ===================== ACHIEVEMENTS CRUD =====================
  const addAchievement = () => {
    const curYear = new Date().getFullYear();
    const newAch: AchievementItem = {
      id: "ach-" + Date.now(),
      title: "Nama Prestasi / Rekognisi",
      titleEn: "Achievement Title",
      organizer: "Nama Penyelenggara / Organisasi",
      organizerLogo: "",
      category: "award",
      date: `${curYear}`,
      desc: "Penjelasan pencapaian, peran, atau seleksi program...",
      descEn: "Details regarding the award, competition, or recognition...",
      image: "",
      evidenceUrl: "",
      evidencePdf: "",
      featured: false,
      published: true,
      visible: true,
      sortOrder: achList.length + 1,
    };
    const nextList = [...achList, newAch];
    setAchSearch("");
    setAchCategoryFilter("all");
    setAchStatusFilter("all");
    setAchPage(Math.max(1, Math.ceil(nextList.length / PAGE_SIZE)));
    setDraft({ ...config, achievements: nextList });
    setStatus("Prestasi baru ditambahkan ke draft");
  };

  const updateAchievement = (id: string, updates: Partial<AchievementItem>) => {
    setDraft({
      ...config,
      achievements: achList.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
    setStatus("Data prestasi diperbarui");
  };

  const requestDeleteAchievement = (ach: AchievementItem) => {
    setPendingDelete({
      entityType: "Prestasi & Rekognisi",
      itemName: ach.title || ach.id,
      impacts: [
        "Menghapus kartu pencapaian dari seksi Prestasi & Rekognisi publik.",
        config.stats?.includeAchievementsInCerts
          ? "Mempengaruhi hitungan statistik tergabung (karena includeAchievementsInCerts aktif)."
          : "Tidak mengubah statistik apabila mode gabungan prestasi nonaktif.",
        "Menghapus pengetahuan prestasi ini dari asisten AI Buddy.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          achievements: achList.filter((a) => a.id !== ach.id),
        });
        setPendingDelete(null);
        setStatus("Prestasi dihapus");
      },
    });
  };

  const moveAchievement = (id: string, direction: "up" | "down") => {
    const idx = achList.findIndex((a) => a.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= achList.length) return;
    setDraft({
      ...config,
      achievements: reorderItemsWithSortOrder(achList, idx, targetIdx),
    });
    setStatus("Urutan prestasi diubah");
  };

  const achDrag = useDragReorder(achList, (reordered) => {
    setDraft({ ...config, achievements: reordered });
    setStatus("Urutan prestasi diperbarui (drag)");
  });

  const isAchFiltered =
    achSearch.trim() !== "" || achCategoryFilter !== "all" || achStatusFilter !== "all";
  const filteredAch = useMemo(() => {
    const q = achSearch.trim().toLowerCase();
    return achList.filter((a) => {
      if (!matchesStatusFilter(a, achStatusFilter)) return false;
      if (achCategoryFilter !== "all" && a.category !== achCategoryFilter) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        (a.titleEn || "").toLowerCase().includes(q) ||
        a.organizer.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q)
      );
    });
  }, [achList, achSearch, achCategoryFilter, achStatusFilter]);

  const achTotalPages = Math.max(1, Math.ceil(filteredAch.length / PAGE_SIZE));
  const safeAchPage = Math.min(achPage, achTotalPages);
  const pagedAch = filteredAch.slice((safeAchPage - 1) * PAGE_SIZE, safeAchPage * PAGE_SIZE);

  // ===================== CV SETTINGS & DOCS CRUD =====================
  const updateCvSettings = (updates: Partial<CvSettingsConfig>) => {
    setDraft({
      ...config,
      cvSettings: {
        ...cvSettings,
        ...updates,
      },
    });
    setStatus("Pengaturan global berkas CV diperbarui");
  };

  const addCvDoc = () => {
    const newKey = "role-" + Date.now().toString().slice(-4);
    const newDoc: CvDocConfig = {
      id: "cv-" + Date.now(),
      roleKey: newKey,
      title: "Peran Karier Baru",
      subtitle: "Fokus & Keahlian Utama",
      color: "#1b45c4",
      pdfUrl: "/cv-ats-zakariamp-2025.pdf",
      thumbnailUrl: "/cv-page-1.png",
      pages: ["/cv-page-1.png"],
      skills: [],
      tools: [],
      responsibilities: [],
      keyProjects: [],
      versionLabel: "v2025.1",
      updatedAt: new Date().toISOString().slice(0, 10),
      allowDownload: true,
      downloadFilename: `CV-Zakaria-${newKey}.pdf`,
      published: true,
      visible: true,
      sortOrder: cvList.length + 1,
    };
    setDraft({ ...config, cvDocs: [...cvList, newDoc] });
    setStatus("Dokumen CV baru ditambahkan ke draft");
  };

  const updateCvDoc = (id: string, updates: Partial<CvDocConfig>) => {
    setDraft({
      ...config,
      cvDocs: cvList.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    });
    setStatus("Dokumen CV diperbarui di draft");
  };

  const requestDeleteCvDoc = (doc: CvDocConfig) => {
    setPendingDelete({
      entityType: "Dokumen Berkas CV",
      itemName: `${doc.title || doc.roleKey} (${doc.roleKey})`,
      impacts: [
        "Menghapus dokumen ini dari folder 3D interaktif & pemilih peran di modal CV.",
        "Permintaan `/api/cv-pdf?role=" + doc.roleKey + "` tidak lagi merujuk ke dokumen ini.",
        "Menghapus ringkasan CV ini dari pengetahuan asisten AI Buddy.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          cvDocs: cvList.filter((d) => d.id !== doc.id),
        });
        setPendingDelete(null);
        setStatus(`Dokumen CV '${doc.title || doc.roleKey}' dihapus`);
      },
    });
  };

  const moveCvDoc = (id: string, direction: "up" | "down") => {
    const idx = cvList.findIndex((d) => d.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cvList.length) return;
    setDraft({
      ...config,
      cvDocs: reorderItemsWithSortOrder(cvList, idx, targetIdx),
    });
    setStatus("Urutan dokumen CV diubah");
  };

  const cvDrag = useDragReorder(cvList, (reordered) => {
    setDraft({ ...config, cvDocs: reordered });
    setStatus("Urutan dokumen CV diperbarui (drag)");
  });

  const moveCvPage = (doc: CvDocConfig, pageIdx: number, dir: "left" | "right") => {
    const pages = [...(doc.pages || [])];
    const targetIdx = dir === "left" ? pageIdx - 1 : pageIdx + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const [moved] = pages.splice(pageIdx, 1);
    pages.splice(targetIdx, 0, moved);
    updateCvDoc(doc.id, { pages });
  };

  const isCvFiltered = cvSearch.trim() !== "" || cvStatusFilter !== "all";
  const filteredCv = useMemo(() => {
    const q = cvSearch.trim().toLowerCase();
    return cvList.filter((doc) => {
      if (!matchesStatusFilter(doc, cvStatusFilter)) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.subtitle.toLowerCase().includes(q) ||
        doc.roleKey.toLowerCase().includes(q) ||
        (doc.versionLabel || "").toLowerCase().includes(q)
      );
    });
  }, [cvList, cvSearch, cvStatusFilter]);

  return (
    <div className="space-y-6">
      <ConfirmImpactModal pendingDelete={pendingDelete} onCancel={() => setPendingDelete(null)} />

      {/* Subtab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3 dark:border-line/40">
        <button
          type="button"
          onClick={() => setSubTab("certificates")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "certificates"
              ? "bg-brand text-white shadow-xs"
              : "border border-line text-body hover:text-ink dark:border-line/40"
          }`}
        >
          <Award className="size-4" />
          <span>Sertifikasi ({certList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("achievements")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "achievements"
              ? "bg-brand text-white shadow-xs"
              : "border border-line text-body hover:text-ink dark:border-line/40"
          }`}
        >
          <Trophy className="size-4" />
          <span>Prestasi & Rekognisi ({achList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("cv")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "cv"
              ? "bg-brand text-white shadow-xs"
              : "border border-line text-body hover:text-ink dark:border-line/40"
          }`}
        >
          <FileText className="size-4" />
          <span>Berkas CV & PDF ({cvList.length})</span>
        </button>
      </div>

      {/* ===================== SUBTAB 1: CERTIFICATES ===================== */}
      {subTab === "certificates" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Manajemen Sertifikat Terverifikasi
              </h2>
              <p className="text-xs text-muted">
                Kelola sertifikat, logo lembaga penerbit, masa berlaku, preview gambar/PDF, dan kontrol unduh
              </p>
            </div>
            <button
              type="button"
              onClick={addCertificate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Sertifikat</span>
            </button>
          </div>

          <AdminSearchFilterBar
            search={certSearch}
            onSearchChange={(val) => {
              setCertSearch(val);
              setCertPage(1);
            }}
            searchPlaceholder="Cari judul sertifikat, penerbit, ID kredensial..."
            filterValue={certCategoryFilter}
            onFilterChange={(val) => {
              setCertCategoryFilter(val);
              setCertPage(1);
            }}
            filterOptions={[
              { value: "all", label: "Semua Kategori" },
              { value: "design", label: "Desain & UX" },
              { value: "frontend", label: "Frontend & Web" },
              { value: "systems", label: "Sistem & Jaringan" },
            ]}
            statusFilter={certStatusFilter}
            onStatusFilterChange={(val) => {
              setCertStatusFilter(val);
              setCertPage(1);
            }}
            totalCount={certList.length}
            filteredCount={filteredCerts.length}
          />

          {pagedCerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted dark:border-line/40">
              {certList.length === 0
                ? 'Belum ada sertifikat. Klik "Tambah Sertifikat" untuk menambahkan.'
                : "Tidak ada sertifikat yang sesuai filter."}
            </div>
          ) : (
            <div className="space-y-4">
              {pagedCerts.map((cert) => {
                const rawIndex = certList.findIndex((c) => c.id === cert.id);

                return (
                  <div
                    key={cert.id}
                    {...(!isCertFiltered ? certDrag.getDragProps(rawIndex) : {})}
                    className={`rounded-2xl border bg-white p-5 transition dark:bg-[#0c0e17] ${
                      certDrag.dragIndex === rawIndex
                        ? "border-brand opacity-70"
                        : "border-line dark:border-line/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                      <div className="flex items-center gap-2.5">
                        {cert.issuerLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cert.issuerLogo}
                            alt={cert.issuer}
                            className="size-7 rounded border border-line object-contain bg-white p-0.5 dark:border-line/40"
                          />
                        )}
                        <div>
                          <h3 className="font-display text-sm font-bold text-ink">
                            {cert.title || "Sertifikat Tanpa Judul"}
                          </h3>
                          <p className="text-[11px] text-muted">
                            {cert.issuer} · {cert.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-ink dark:border-line/40">
                          <input
                            type="checkbox"
                            checked={Boolean(cert.featured)}
                            onChange={(e) => updateCertificate(cert.id, { featured: e.target.checked })}
                            className="size-3.5 rounded text-amber-500"
                          />
                          <Star className="size-3 text-amber-500" />
                          <span>Unggulan</span>
                        </label>

                        <AdminItemActionBar
                          published={cert.published}
                          visible={cert.visible}
                          onTogglePublished={() =>
                            updateCertificate(cert.id, { published: cert.published === false })
                          }
                          onToggleVisible={() =>
                            updateCertificate(cert.id, { visible: cert.visible === false })
                          }
                          onMoveUp={() => moveCertificate(cert.id, "up")}
                          onMoveDown={() => moveCertificate(cert.id, "down")}
                          disableMoveUp={isCertFiltered || rawIndex <= 0}
                          disableMoveDown={isCertFiltered || rawIndex >= certList.length - 1}
                          onDelete={() => requestDeleteCertificate(cert)}
                          dragHandleProps={!isCertFiltered ? certDrag.getHandleProps(rawIndex) : undefined}
                        />
                      </div>
                    </div>

                    {(!cert.title?.trim() || !cert.issuer?.trim()) && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>Judul sertifikat dan nama penerbit wajib diisi.</span>
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink">Judul Sertifikat *</label>
                        <input
                          type="text"
                          value={cert.title}
                          onChange={(e) => updateCertificate(cert.id, { title: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Lembaga Penerbit Resmi *</label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => updateCertificate(cert.id, { issuer: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Kategori Kompetensi</label>
                        <select
                          value={cert.category}
                          onChange={(e) =>
                            updateCertificate(cert.id, {
                              category: e.target.value as CertificateItem["category"],
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                        >
                          <option value="design">Desain & UX</option>
                          <option value="frontend">Frontend & Web</option>
                          <option value="systems">Sistem & Jaringan</option>
                          <option value="all">Umum / Lintas Bidang</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Tanggal / Tahun Terbit</label>
                        <input
                          type="text"
                          value={cert.date}
                          onChange={(e) => updateCertificate(cert.id, { date: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="2025 / Mei 2025"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Tanggal Kedaluwarsa (Opsional)</label>
                        <input
                          type="text"
                          value={cert.expiryDate || ""}
                          onChange={(e) => updateCertificate(cert.id, { expiryDate: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="Kosongkan jika seumur hidup"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">ID Kredensial</label>
                        <input
                          type="text"
                          value={cert.credentialId || ""}
                          onChange={(e) => updateCertificate(cert.id, { credentialId: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="BNSP-xxx / DICODING-xxx"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-ink">Tautan Verifikasi Online (URL)</label>
                        <input
                          type="url"
                          value={cert.credentialUrl || ""}
                          onChange={(e) => updateCertificate(cert.id, { credentialUrl: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex items-end pb-1">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                          <input
                            type="checkbox"
                            checked={cert.allowDownload !== false}
                            onChange={(e) =>
                              updateCertificate(cert.id, { allowDownload: e.target.checked })
                            }
                            className="size-4 rounded border-line text-brand"
                          />
                          <span>Izinkan Pratinjau & Unduh PDF</span>
                        </label>
                      </div>

                      <div>
                        <MediaFieldControl
                          label="Logo Penerbit (Square)"
                          value={cert.issuerLogo || ""}
                          onChange={(url) => updateCertificate(cert.id, { issuerLogo: url })}
                          folder="certificates"
                          fieldKey={`cert-issuer-${cert.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="image/webp,image/png,image/jpeg,image/svg+xml"
                          previewShape="square"
                        />
                      </div>

                      <div>
                        <MediaFieldControl
                          label="Gambar / Thumbnail Sertifikat"
                          value={cert.image || ""}
                          onChange={(url) => updateCertificate(cert.id, { image: url })}
                          folder="certificates"
                          fieldKey={`cert-img-${cert.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="image/webp,image/png,image/jpeg"
                          previewShape="wide"
                        />
                      </div>

                      <div>
                        <MediaFieldControl
                          label="Dokumen PDF Sertifikat"
                          value={cert.credentialPdf || ""}
                          onChange={(url) => updateCertificate(cert.id, { credentialPdf: url })}
                          folder="certificates"
                          fieldKey={`cert-pdf-${cert.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="application/pdf"
                          placeholder="/api/r2-file?key=certificates/..."
                          previewShape="wide"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-ink">Deskripsi Singkat (ID)</label>
                          <textarea
                            rows={2}
                            value={cert.desc || ""}
                            onChange={(e) => updateCertificate(cert.id, { desc: e.target.value })}
                            className={`mt-1 ${inputClass}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink">Short Description (EN)</label>
                          <textarea
                            rows={2}
                            value={cert.descEn || ""}
                            onChange={(e) => updateCertificate(cert.id, { descEn: e.target.value })}
                            className={`mt-1 ${inputClass}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AdminPaginationBar
            page={safeCertPage}
            totalPages={certTotalPages}
            onPageChange={setCertPage}
          />
        </div>
      ) : subTab === "achievements" ? (
        /* ===================== SUBTAB 2: ACHIEVEMENTS ===================== */
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Manajemen Prestasi & Rekognisi
              </h2>
              <p className="text-xs text-muted">
                Kelola penghargaan, kompetisi, logo penyelenggara, dokumentasi gambar, dan PDF bukti
              </p>
            </div>
            <button
              type="button"
              onClick={addAchievement}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Prestasi</span>
            </button>
          </div>

          <AdminSearchFilterBar
            search={achSearch}
            onSearchChange={(val) => {
              setAchSearch(val);
              setAchPage(1);
            }}
            searchPlaceholder="Cari judul prestasi, penyelenggara..."
            filterValue={achCategoryFilter}
            onFilterChange={(val) => {
              setAchCategoryFilter(val);
              setAchPage(1);
            }}
            filterOptions={[
              { value: "all", label: "Semua Kategori" },
              { value: "award", label: "Penghargaan / Award" },
              { value: "competition", label: "Kompetisi / Kejuaraan" },
              { value: "leadership", label: "Kepemimpinan Organisasi" },
              { value: "program", label: "Program Terpilih / Beasiswa" },
              { value: "ambassador", label: "Duta / Brand Ambassador" },
            ]}
            statusFilter={achStatusFilter}
            onStatusFilterChange={(val) => {
              setAchStatusFilter(val);
              setAchPage(1);
            }}
            totalCount={achList.length}
            filteredCount={filteredAch.length}
          />

          {pagedAch.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted dark:border-line/40">
              {achList.length === 0
                ? 'Belum ada prestasi. Klik "Tambah Prestasi" untuk menambahkan.'
                : "Tidak ada prestasi yang sesuai filter."}
            </div>
          ) : (
            <div className="space-y-4">
              {pagedAch.map((ach) => {
                const rawIndex = achList.findIndex((a) => a.id === ach.id);

                return (
                  <div
                    key={ach.id}
                    {...(!isAchFiltered ? achDrag.getDragProps(rawIndex) : {})}
                    className={`rounded-2xl border bg-white p-5 transition dark:bg-[#0c0e17] ${
                      achDrag.dragIndex === rawIndex
                        ? "border-brand opacity-70"
                        : "border-line dark:border-line/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                      <div className="flex items-center gap-2.5">
                        {ach.organizerLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ach.organizerLogo}
                            alt={ach.organizer}
                            className="size-7 rounded border border-line object-contain bg-white p-0.5 dark:border-line/40"
                          />
                        )}
                        <div>
                          <h3 className="font-display text-sm font-bold text-ink">
                            {ach.title || "Prestasi Baru"}
                          </h3>
                          <p className="text-[11px] text-muted">
                            {ach.organizer} · {ach.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-ink dark:border-line/40">
                          <input
                            type="checkbox"
                            checked={Boolean(ach.featured)}
                            onChange={(e) => updateAchievement(ach.id, { featured: e.target.checked })}
                            className="size-3.5 rounded text-amber-500"
                          />
                          <Star className="size-3 text-amber-500" />
                          <span>Unggulan</span>
                        </label>

                        <AdminItemActionBar
                          published={ach.published}
                          visible={ach.visible}
                          onTogglePublished={() =>
                            updateAchievement(ach.id, { published: ach.published === false })
                          }
                          onToggleVisible={() =>
                            updateAchievement(ach.id, { visible: ach.visible === false })
                          }
                          onMoveUp={() => moveAchievement(ach.id, "up")}
                          onMoveDown={() => moveAchievement(ach.id, "down")}
                          disableMoveUp={isAchFiltered || rawIndex <= 0}
                          disableMoveDown={isAchFiltered || rawIndex >= achList.length - 1}
                          onDelete={() => requestDeleteAchievement(ach)}
                          dragHandleProps={!isAchFiltered ? achDrag.getHandleProps(rawIndex) : undefined}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink">Judul Prestasi (ID) *</label>
                        <input
                          type="text"
                          value={ach.title}
                          onChange={(e) => updateAchievement(ach.id, { title: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Achievement Title (EN)</label>
                        <input
                          type="text"
                          value={ach.titleEn || ""}
                          onChange={(e) => updateAchievement(ach.id, { titleEn: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Penyelenggara / Institusi *</label>
                        <input
                          type="text"
                          value={ach.organizer}
                          onChange={(e) => updateAchievement(ach.id, { organizer: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Kategori Pengakuan</label>
                        <select
                          value={ach.category}
                          onChange={(e) =>
                            updateAchievement(ach.id, {
                              category: e.target.value as AchievementItem["category"],
                            })
                          }
                          className={`mt-1.5 ${inputClass}`}
                        >
                          <option value="award">Penghargaan / Award</option>
                          <option value="competition">Kompetisi / Kejuaraan</option>
                          <option value="leadership">Kepemimpinan Organisasi</option>
                          <option value="program">Program Terpilih / Beasiswa</option>
                          <option value="ambassador">Duta / Brand Ambassador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Tanggal / Tahun</label>
                        <input
                          type="text"
                          value={ach.date}
                          onChange={(e) => updateAchievement(ach.id, { date: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Tautan Bukti (URL)</label>
                        <input
                          type="url"
                          value={ach.evidenceUrl || ""}
                          onChange={(e) => updateAchievement(ach.id, { evidenceUrl: e.target.value })}
                          className={`mt-1.5 ${inputClass}`}
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <MediaFieldControl
                          label="Logo Penyelenggara"
                          value={ach.organizerLogo || ""}
                          onChange={(url) => updateAchievement(ach.id, { organizerLogo: url })}
                          folder="achievements"
                          fieldKey={`ach-org-${ach.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="image/webp,image/png,image/jpeg,image/svg+xml"
                          previewShape="square"
                        />
                      </div>

                      <div>
                        <MediaFieldControl
                          label="Foto / Gambar Dokumentasi"
                          value={ach.image || ""}
                          onChange={(url) => updateAchievement(ach.id, { image: url })}
                          folder="achievements"
                          fieldKey={`ach-img-${ach.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="image/webp,image/png,image/jpeg"
                          previewShape="wide"
                        />
                      </div>

                      <div>
                        <MediaFieldControl
                          label="Dokumen PDF Bukti"
                          value={ach.evidencePdf || ""}
                          onChange={(url) => updateAchievement(ach.id, { evidencePdf: url })}
                          folder="achievements"
                          fieldKey={`ach-pdf-${ach.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="application/pdf"
                          previewShape="wide"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-ink">Deskripsi Prestasi (ID)</label>
                          <textarea
                            rows={3}
                            value={ach.desc}
                            onChange={(e) => updateAchievement(ach.id, { desc: e.target.value })}
                            className={`mt-1.5 ${inputClass}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-ink">Achievement Description (EN)</label>
                          <textarea
                            rows={3}
                            value={ach.descEn || ""}
                            onChange={(e) => updateAchievement(ach.id, { descEn: e.target.value })}
                            className={`mt-1.5 ${inputClass}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AdminPaginationBar
            page={safeAchPage}
            totalPages={achTotalPages}
            onPageChange={setAchPage}
          />
        </div>
      ) : (
        /* ===================== SUBTAB 3: CV DOCS & SETTINGS ===================== */
        <div className="space-y-6">
          {/* Global CV Settings Panel */}
          <div className="rounded-2xl border border-line bg-surface/50 p-5 dark:border-line/40 dark:bg-slate-900/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3 dark:border-line/40">
              <div>
                <h2 className="font-display text-sm font-bold text-ink">
                  Pengaturan Folder 3D & Keamanan Unduhan CV
                </h2>
                <p className="text-xs text-muted">
                  Mengatur label seksi `#cv` serta mengizinkan/mengunci endpoint unduhan `/api/cv-pdf?download=1` secara global
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs dark:border-line/40 dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={cvSettings.allowDownload !== false}
                  onChange={(e) => updateCvSettings({ allowDownload: e.target.checked })}
                  className="size-4 rounded text-brand focus:ring-brand"
                />
                {cvSettings.allowDownload === false && <Lock className="size-3.5 text-amber-500" />}
                <span>Izinkan Unduhan PDF Publik</span>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-ink">Label Folder 3D</label>
                <input
                  type="text"
                  value={cvSettings.folderLabel || ""}
                  onChange={(e) => updateCvSettings({ folderLabel: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="CV & Berkas Karier"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Teks Petunjuk (ID)</label>
                <input
                  type="text"
                  value={cvSettings.folderHintId || ""}
                  onChange={(e) => updateCvSettings({ folderHintId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Pilih peran untuk melihat pratinjau CV"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Hint Text (EN)</label>
                <input
                  type="text"
                  value={cvSettings.folderHintEn || ""}
                  onChange={(e) => updateCvSettings({ folderHintEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Select a role to preview resume"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Label Tombol Pratinjau (ID)</label>
                <input
                  type="text"
                  value={cvSettings.previewCtaId || ""}
                  onChange={(e) => updateCvSettings({ previewCtaId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Lihat CV"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Preview Button Label (EN)</label>
                <input
                  type="text"
                  value={cvSettings.previewCtaEn || ""}
                  onChange={(e) => updateCvSettings({ previewCtaEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="View CV"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-ink">Label Unduh (ID)</label>
                  <input
                    type="text"
                    value={cvSettings.downloadLabelId || ""}
                    onChange={(e) => updateCvSettings({ downloadLabelId: e.target.value })}
                    className={`mt-1 ${inputClass}`}
                    placeholder="Unduh PDF"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink">Download (EN)</label>
                  <input
                    type="text"
                    value={cvSettings.downloadLabelEn || ""}
                    onChange={(e) => updateCvSettings({ downloadLabelEn: e.target.value })}
                    className={`mt-1 ${inputClass}`}
                    placeholder="Download PDF"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Daftar Dokumen & Jalur CV ({cvList.length})
              </h2>
              <p className="text-xs text-muted">
                Kelola dokumen CV per peran, urutan halaman pratinjau WebGL Paper, metadata versi, dan kontrol akses
              </p>
            </div>
            <button
              type="button"
              onClick={addCvDoc}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Dokumen CV</span>
            </button>
          </div>

          <AdminSearchFilterBar
            search={cvSearch}
            onSearchChange={setCvSearch}
            searchPlaceholder="Cari roleKey, judul dokumen, versi..."
            statusFilter={cvStatusFilter}
            onStatusFilterChange={setCvStatusFilter}
            totalCount={cvList.length}
            filteredCount={filteredCv.length}
          />

          <div className="space-y-5">
            {filteredCv.map((doc) => {
              const rawIndex = cvList.findIndex((d) => d.id === doc.id);

              return (
                <div
                  key={doc.id}
                  {...(!isCvFiltered ? cvDrag.getDragProps(rawIndex) : {})}
                  className={`rounded-2xl border bg-white p-5 shadow-2xs transition dark:bg-[#0c0e17] ${
                    cvDrag.dragIndex === rawIndex
                      ? "border-brand opacity-70"
                      : "border-line dark:border-line/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="size-3.5 rounded-full border border-line"
                        style={{ backgroundColor: doc.color || "#1b45c4" }}
                      />
                      <div>
                        <h3 className="font-display text-sm font-bold text-ink">
                          {doc.title || doc.roleKey}
                        </h3>
                        <p className="font-mono text-[11px] text-muted">
                          roleKey: {doc.roleKey} {doc.versionLabel ? `· ${doc.versionLabel}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewCvRole(doc.roleKey as RoleKey)}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand/10"
                      >
                        <FileText className="size-3.5" />
                        <span>Tes Pratinjau</span>
                      </button>

                      <AdminItemActionBar
                        published={doc.published}
                        visible={doc.visible}
                        onTogglePublished={() =>
                          updateCvDoc(doc.id, { published: doc.published === false })
                        }
                        onToggleVisible={() =>
                          updateCvDoc(doc.id, { visible: doc.visible === false })
                        }
                        onMoveUp={() => moveCvDoc(doc.id, "up")}
                        onMoveDown={() => moveCvDoc(doc.id, "down")}
                        disableMoveUp={isCvFiltered || rawIndex <= 0}
                        disableMoveDown={isCvFiltered || rawIndex >= cvList.length - 1}
                        onDelete={() => requestDeleteCvDoc(doc)}
                        dragHandleProps={!isCvFiltered ? cvDrag.getHandleProps(rawIndex) : undefined}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink">Role Key (Slug Peran) *</label>
                      <input
                        type="text"
                        value={doc.roleKey}
                        onChange={(e) =>
                          updateCvDoc(doc.id, { roleKey: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })
                        }
                        className={`mt-1 ${inputClass}`}
                        placeholder="frontend / uiux / graphic / itsupport"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Judul Dokumen CV *</label>
                      <input
                        type="text"
                        value={doc.title}
                        onChange={(e) => updateCvDoc(doc.id, { title: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Subjudul / Spesialisasi</label>
                      <input
                        type="text"
                        value={doc.subtitle}
                        onChange={(e) => updateCvDoc(doc.id, { subtitle: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Versi Dokumen</label>
                      <input
                        type="text"
                        value={doc.versionLabel || ""}
                        onChange={(e) => updateCvDoc(doc.id, { versionLabel: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                        placeholder="v2025.2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Tanggal Pembaruan</label>
                      <input
                        type="text"
                        value={doc.updatedAt || ""}
                        onChange={(e) => updateCvDoc(doc.id, { updatedAt: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                        placeholder="2025-05-01"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Nama Berkas Saat Diunduh</label>
                      <input
                        type="text"
                        value={doc.downloadFilename || ""}
                        onChange={(e) => updateCvDoc(doc.id, { downloadFilename: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                        placeholder="CV-ZakariaMP-Frontend.pdf"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Warna Aksen Kartu</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={doc.color || "#1b45c4"}
                          onChange={(e) => updateCvDoc(doc.id, { color: e.target.value })}
                          className="size-9 cursor-pointer rounded-lg border border-line bg-transparent p-0.5"
                        />
                        <input
                          type="text"
                          value={doc.color || "#1b45c4"}
                          onChange={(e) => updateCvDoc(doc.id, { color: e.target.value })}
                          className={`flex-1 ${inputClass}`}
                        />
                      </div>
                    </div>

                    <div className="flex items-end pb-1">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                        <input
                          type="checkbox"
                          checked={doc.allowDownload !== false}
                          onChange={(e) => updateCvDoc(doc.id, { allowDownload: e.target.checked })}
                          className="size-4 rounded border-line text-brand"
                        />
                        <span>Izinkan Unduh Dokumen Ini</span>
                      </label>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 grid gap-4 sm:grid-cols-2">
                      <MediaFieldControl
                        label="Berkas PDF ATS Resmi *"
                        value={doc.pdfUrl || ""}
                        onChange={(url) => updateCvDoc(doc.id, { pdfUrl: url })}
                        folder="cv"
                        fieldKey={`cv-pdf-${doc.id}`}
                        uploadAndSet={uploadAndSet}
                        uploadingImage={uploadingImage}
                        config={config}
                        accept="application/pdf"
                        placeholder="/cv-ats-zakariamp-2025.pdf"
                        previewShape="wide"
                      />

                      <MediaFieldControl
                        label="Thumbnail Sampul Lembar CV"
                        value={doc.thumbnailUrl || ""}
                        onChange={(url) => updateCvDoc(doc.id, { thumbnailUrl: url })}
                        folder="cv"
                        fieldKey={`cv-thumb-${doc.id}`}
                        uploadAndSet={uploadAndSet}
                        uploadingImage={uploadingImage}
                        config={config}
                        accept="image/webp,image/png,image/jpeg"
                        placeholder="/cv-page-1.png"
                        previewShape="portrait"
                      />
                    </div>

                    {/* Multi-page Preview Images Manager */}
                    <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-line bg-surface/50 p-3.5 dark:border-line/30 dark:bg-slate-900/40">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted">
                          Halaman Pratinjau Lembar CV ({doc.pages?.length || 0} Halaman)
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-surface dark:border-line/40 dark:bg-slate-800">
                            <Upload className="size-3 text-brand" />
                            <span>
                              {uploadingImage === `cv-page-add-${doc.id}`
                                ? "Mengunggah..."
                                : "Unggah Halaman Baru"}
                            </span>
                            <input
                              type="file"
                              accept="image/webp,image/png,image/jpeg"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  void uploadAndSet(
                                    f,
                                    "cv",
                                    (url) =>
                                      updateCvDoc(doc.id, {
                                        pages: [...(doc.pages || []), url],
                                      }),
                                    `cv-page-add-${doc.id}`
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              updateCvDoc(doc.id, {
                                pages: [...(doc.pages || []), "/cv-page-1.png"],
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-surface dark:border-line/40 dark:bg-slate-800"
                          >
                            <Plus className="size-3" />
                            <span>Tambah Baris URL</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {(doc.pages || []).map((pageUrl, pIdx) => (
                          <div
                            key={`${doc.id}-pg-${pIdx}`}
                            className="rounded-xl border border-line bg-white p-2 dark:border-line/40 dark:bg-slate-950 space-y-2"
                          >
                            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-line/50 bg-slate-100 dark:bg-slate-900">
                              {pageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={pageUrl}
                                  alt={`Halaman ${pIdx + 1}`}
                                  className="size-full object-contain"
                                />
                              ) : null}
                            </div>
                            <input
                              type="text"
                              value={pageUrl}
                              onChange={(e) => {
                                const nextPages = [...(doc.pages || [])];
                                nextPages[pIdx] = e.target.value;
                                updateCvDoc(doc.id, { pages: nextPages });
                              }}
                              className="w-full rounded-lg border border-line px-2 py-1 font-mono text-[10px] text-body dark:border-line/40 dark:bg-slate-900"
                              placeholder="/cv-page-1.png"
                            />
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveCvPage(doc, pIdx, "left")}
                                  disabled={pIdx === 0}
                                  className="rounded p-1 text-muted hover:bg-surface disabled:opacity-30"
                                >
                                  <ChevronLeft className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveCvPage(doc, pIdx, "right")}
                                  disabled={pIdx >= (doc.pages?.length || 1) - 1}
                                  className="rounded p-1 text-muted hover:bg-surface disabled:opacity-30"
                                >
                                  <ChevronRight className="size-3.5" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCvDoc(doc.id, {
                                    pages: (doc.pages || []).filter((_, idx) => idx !== pIdx),
                                  })
                                }
                                className="rounded p-1 text-muted hover:text-red-500"
                                title="Hapus halaman"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Role-specific Metadata */}
                    <div>
                      <label className="block text-xs font-semibold text-ink">Keahlian Utama (pisah koma)</label>
                      <input
                        type="text"
                        value={(doc.skills || []).join(", ")}
                        onChange={(e) =>
                          updateCvDoc(doc.id, {
                            skills: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Perangkat / Tools (pisah koma)</label>
                      <input
                        type="text"
                        value={(doc.tools || []).join(", ")}
                        onChange={(e) =>
                          updateCvDoc(doc.id, {
                            tools: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Proyek Unggulan Terkait (1 per baris)</label>
                      <textarea
                        rows={2}
                        value={(doc.keyProjects || []).join("\n")}
                        onChange={(e) =>
                          updateCvDoc(doc.id, {
                            keyProjects: e.target.value
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-semibold text-ink">Ringkasan Tanggung Jawab / Poin CV (1 per baris)</label>
                      <textarea
                        rows={3}
                        value={(doc.responsibilities || []).join("\n")}
                        onChange={(e) =>
                          updateCvDoc(doc.id, {
                            responsibilities: e.target.value
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TabCredentials;
