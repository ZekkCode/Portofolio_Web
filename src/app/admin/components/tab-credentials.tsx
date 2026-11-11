"use client";

import { useState } from "react";
import type { SiteConfig, CertificateItem, AchievementItem, CvDocConfig } from "@/lib/site-store";
import type { RoleKey } from "@/components/cv-preview-modal";
import { Plus, Trash2, ChevronUp, ChevronDown, Award, Trophy, FileText, Upload, ExternalLink, Star } from "lucide-react";

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

  // ===================== CERTIFICATES CRUD =====================
  const addCertificate = () => {
    const curYear = new Date().getFullYear();
    const newCert: CertificateItem = {
      id: "cert-" + Date.now(),
      title: "Nama Sertifikat / Kredensial",
      issuer: "Lembaga Penerbit Resmi",
      date: `${curYear}`,
      credentialUrl: "",
      credentialPdf: "",
      credentialId: "",
      category: "design",
      featured: false,
      published: true,
      sortOrder: (config.certificates?.length || 0) + 1,
    };
    setDraft({ ...config, certificates: [...(config.certificates || []), newCert] });
    setStatus("Sertifikat baru ditambahkan");
  };

  const updateCertificate = (id: string, updates: Partial<CertificateItem>) => {
    setDraft({
      ...config,
      certificates: (config.certificates || []).map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
    setStatus("Data sertifikat diperbarui");
  };

  const deleteCertificate = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus sertifikat ini?")) return;
    setDraft({
      ...config,
      certificates: (config.certificates || []).filter((c) => c.id !== id),
    });
    setStatus("Sertifikat dihapus");
  };

  const moveCertificate = (id: string, direction: "up" | "down") => {
    const list = [...(config.certificates || [])];
    const index = list.findIndex((c) => c.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, certificates: list });
    setStatus("Urutan sertifikat diubah");
  };

  // ===================== ACHIEVEMENTS CRUD =====================
  const addAchievement = () => {
    const curYear = new Date().getFullYear();
    const newAch: AchievementItem = {
      id: "ach-" + Date.now(),
      title: "Nama Prestasi / Rekognisi",
      titleEn: "Achievement Title",
      organizer: "Nama Penyelenggara / Organisasi",
      category: "award",
      date: `${curYear}`,
      desc: "Penjelasan pencapaian, peran, atau seleksi program...",
      descEn: "Details regarding the award, competition, or recognition...",
      evidenceUrl: "",
      featured: false,
      published: true,
      sortOrder: (config.achievements?.length || 0) + 1,
    };
    setDraft({ ...config, achievements: [...(config.achievements || []), newAch] });
    setStatus("Prestasi baru ditambahkan");
  };

  const updateAchievement = (id: string, updates: Partial<AchievementItem>) => {
    setDraft({
      ...config,
      achievements: (config.achievements || []).map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
    setStatus("Data prestasi diperbarui");
  };

  const deleteAchievement = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Hapus prestasi ini?")) return;
    setDraft({
      ...config,
      achievements: (config.achievements || []).filter((a) => a.id !== id),
    });
    setStatus("Prestasi dihapus");
  };

  const moveAchievement = (id: string, direction: "up" | "down") => {
    const list = [...(config.achievements || [])];
    const index = list.findIndex((a) => a.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setDraft({ ...config, achievements: list });
    setStatus("Urutan prestasi diubah");
  };

  // ===================== CV DOCS =====================
  const updateCvDoc = (roleKey: Exclude<RoleKey, "all">, updates: Partial<CvDocConfig>) => {
    const existing = config.cvDocs.find((d) => d.roleKey === roleKey);
    let newDocs = [...config.cvDocs];
    if (existing) {
      newDocs = newDocs.map((d) => (d.roleKey === roleKey ? { ...d, ...updates } : d));
    } else {
      newDocs.push({
        id: roleKey,
        roleKey,
        title: "",
        subtitle: "",
        color: "#1b45c4",
        pdfUrl: "",
        pages: [],
        ...updates,
      });
    }
    setDraft({ ...config, cvDocs: newDocs });
    setStatus(`CV Dokumen (${roleKey}) diperbarui di draft`);
  };

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex items-center gap-2 border-b border-line pb-3 dark:border-line/40">
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
          <span>Sertifikasi ({config.certificates?.length || 0})</span>
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
          <span>Prestasi & Rekognisi ({config.achievements?.length || 0})</span>
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
          <span>Berkas CV & PDF ({config.cvDocs?.length || 0})</span>
        </button>
      </div>

      {subTab === "certificates" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Manajemen Sertifikat Terverifikasi</h2>
              <p className="text-xs text-muted">Ditampilkan pada seksi Sertifikasi dengan filter kategori</p>
            </div>
            <button
              type="button"
              onClick={addCertificate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Sertifikat</span>
            </button>
          </div>

          <div className="space-y-4">
            {(config.certificates || []).map((cert, idx) => (
              <div
                key={cert.id}
                className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                    <h3 className="font-display text-sm font-bold text-ink">{cert.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-body">
                      <input
                        type="checkbox"
                        checked={cert.published !== false}
                        onChange={(e) => updateCertificate(cert.id, { published: e.target.checked })}
                        className="size-4 rounded border-line text-brand focus:ring-brand"
                      />
                      <span>Publik</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => moveCertificate(cert.id, "up")}
                      disabled={idx === 0}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCertificate(cert.id, "down")}
                      disabled={idx === (config.certificates?.length || 0) - 1}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCertificate(cert.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink">Judul Sertifikat</label>
                    <input
                      type="text"
                      value={cert.title}
                      onChange={(e) => updateCertificate(cert.id, { title: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Lembaga Penerbit Resmi</label>
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
                      onChange={(e) => updateCertificate(cert.id, { category: e.target.value as any })}
                      className={`mt-1.5 ${inputClass}`}
                    >
                      <option value="design">Desain & UX</option>
                      <option value="frontend">Frontend & Web</option>
                      <option value="systems">Sistem & Jaringan</option>
                      <option value="all">Semua Kategori</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Tahun / Tanggal Terbit</label>
                    <input
                      type="text"
                      value={cert.date}
                      onChange={(e) => updateCertificate(cert.id, { date: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="2024"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">ID Kredensial (Opsional)</label>
                    <input
                      type="text"
                      value={cert.credentialId || ""}
                      onChange={(e) => updateCertificate(cert.id, { credentialId: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="BNSP-xxx / DICODING-xxx"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Tautan Verifikasi Online (URL)</label>
                    <input
                      type="text"
                      value={cert.credentialUrl || ""}
                      onChange={(e) => updateCertificate(cert.id, { credentialUrl: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink">Berkas Bukti PDF / Gambar</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="text"
                        value={cert.credentialPdf || cert.image || ""}
                        onChange={(e) =>
                          updateCertificate(cert.id, { credentialPdf: e.target.value, image: e.target.value })
                        }
                        className={`flex-1 ${inputClass}`}
                        placeholder="URL PDF atau gambar kredensial"
                      />
                      <label
                        className={`flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-semibold text-ink hover:bg-surface dark:border-line/40 ${
                          uploadingImage === `cert-${cert.id}` ? "opacity-50" : ""
                        }`}
                      >
                        <Upload className="size-3.5" />
                        <span>Unggah Berkas</span>
                        <input
                          type="file"
                          accept="application/pdf,image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              void uploadAndSet(
                                f,
                                "certificates",
                                (url) => updateCertificate(cert.id, { credentialPdf: url, image: url }),
                                `cert-${cert.id}`
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : subTab === "achievements" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Manajemen Prestasi & Rekognisi</h2>
              <p className="text-xs text-muted">Ditampilkan pada seksi Prestasi & Rekognisi</p>
            </div>
            <button
              type="button"
              onClick={addAchievement}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Prestasi</span>
            </button>
          </div>

          <div className="space-y-4">
            {(config.achievements || []).map((ach, idx) => (
              <div
                key={ach.id}
                className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">#{idx + 1}</span>
                    <h3 className="font-display text-sm font-bold text-ink">{ach.title}</h3>
                    <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand dark:bg-blue-500/10 dark:text-blue-300 uppercase">
                      {ach.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-body">
                      <input
                        type="checkbox"
                        checked={ach.featured}
                        onChange={(e) => updateAchievement(ach.id, { featured: e.target.checked })}
                        className="size-4 rounded border-line text-amber-500 focus:ring-amber-500"
                      />
                      <Star className="size-3 text-amber-500" />
                      <span>Featured</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs text-body">
                      <input
                        type="checkbox"
                        checked={ach.published !== false}
                        onChange={(e) => updateAchievement(ach.id, { published: e.target.checked })}
                        className="size-4 rounded border-line text-brand focus:ring-brand"
                      />
                      <span>Publik</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => moveAchievement(ach.id, "up")}
                      disabled={idx === 0}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAchievement(ach.id, "down")}
                      disabled={idx === (config.achievements?.length || 0) - 1}
                      className="rounded-lg p-1.5 text-body hover:bg-surface disabled:opacity-30 dark:hover:bg-slate-900"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAchievement(ach.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink">Judul Prestasi (ID)</label>
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
                    <label className="block text-xs font-semibold text-ink">Penyelenggara / Institusi</label>
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
                      onChange={(e) => updateAchievement(ach.id, { category: e.target.value as any })}
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
                    <label className="block text-xs font-semibold text-ink">Tanggal / Periode</label>
                    <input
                      type="text"
                      value={ach.date}
                      onChange={(e) => updateAchievement(ach.id, { date: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="2024"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink">Tautan Bukti / Dokumentasi (URL)</label>
                    <input
                      type="text"
                      value={ach.evidenceUrl || ""}
                      onChange={(e) => updateAchievement(ach.id, { evidenceUrl: e.target.value })}
                      className={`mt-1.5 ${inputClass}`}
                      placeholder="https://..."
                    />
                  </div>

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
            ))}
          </div>
        </div>
      ) : (
        /* CV Docs Subtab */
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-base font-bold text-ink">Dokumen CV Resmi (4 Jalur Karier)</h2>
            <p className="text-xs text-muted">
              Kelola berkas PDF ATS dan pratinjau lembar interaktif Three.js WebGL Paper
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(
              [
                { roleKey: "graphic", label: "Desainer Grafis & Multimedia" },
                { roleKey: "uiux", label: "UI/UX Designer & Product" },
                { roleKey: "frontend", label: "Frontend Web Developer" },
                { roleKey: "itsupport", label: "IT Support & Systems Specialist" },
              ] as const
            ).map((item) => {
              const doc = config.cvDocs.find((d) => d.roleKey === item.roleKey);
              const pdfUrl = doc?.pdfUrl || "/cv-ats-zakariamp-2025.pdf";

              return (
                <div
                  key={item.roleKey}
                  className="rounded-2xl border border-line bg-white p-5 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]"
                >
                  <div className="flex items-center justify-between border-b border-line pb-3 dark:border-line/40">
                    <h3 className="font-display text-sm font-bold text-ink">{item.label}</h3>
                    <button
                      type="button"
                      onClick={() => setPreviewCvRole(item.roleKey)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      <FileText className="size-3.5" />
                      <span>Tes Pratinjau</span>
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink">Judul Dokumen</label>
                      <input
                        type="text"
                        value={doc?.title || ""}
                        onChange={(e) => updateCvDoc(item.roleKey, { title: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Subjudul</label>
                      <input
                        type="text"
                        value={doc?.subtitle || ""}
                        onChange={(e) => updateCvDoc(item.roleKey, { subtitle: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink">Berkas PDF ATS Resmi</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={pdfUrl}
                          onChange={(e) => updateCvDoc(item.roleKey, { pdfUrl: e.target.value })}
                          className={`flex-1 ${inputClass}`}
                        />
                        <label
                          className={`flex min-h-[36px] cursor-pointer items-center gap-1 rounded-xl border border-line px-2.5 text-xs font-semibold text-ink hover:bg-surface dark:border-line/40 ${
                            uploadingImage === `cv-${item.roleKey}` ? "opacity-50" : ""
                          }`}
                        >
                          <Upload className="size-3" />
                          <span>PDF</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                void uploadAndSet(
                                  f,
                                  "cv",
                                  (url) => updateCvDoc(item.roleKey, { pdfUrl: url }),
                                  `cv-${item.roleKey}`
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
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
