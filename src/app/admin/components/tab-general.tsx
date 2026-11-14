"use client";

import type { SiteConfig, SocialLinkItem } from "@/lib/site-store";
import { Plus, Trash2, Upload, User, Globe, Mail, Share2, BarChart2 } from "lucide-react";

interface TabGeneralProps {
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

export function TabGeneral({
  config,
  setDraft,
  setStatus,
  uploadAndSet,
  uploadingImage,
  inputClass,
}: TabGeneralProps) {
  const profile = config.generalProfile;
  const stats = config.stats;

  const updateProfile = (updates: Partial<typeof profile>) => {
    setDraft({
      ...config,
      generalProfile: { ...profile, ...updates },
    });
    setStatus("Profil umum diperbarui di draft");
  };

  const updateStats = (updates: Partial<typeof stats>) => {
    setDraft({
      ...config,
      stats: { ...stats, ...updates },
    });
    setStatus("Pengaturan statistik diperbarui di draft");
  };

  const addSocial = () => {
    const newSoc: SocialLinkItem = {
      id: "soc-" + Date.now(),
      platform: "custom",
      label: "Platform Baru",
      href: "https://",
      visible: true,
    };
    updateProfile({ socials: [...(profile.socials || []), newSoc] });
  };

  const updateSocial = (id: string, updates: Partial<SocialLinkItem>) => {
    const list = (profile.socials || []).map((s) => (s.id === id ? { ...s, ...updates } : s));
    updateProfile({ socials: list });
  };

  const deleteSocial = (id: string) => {
    const list = (profile.socials || []).filter((s) => s.id !== id);
    updateProfile({ socials: list });
  };

  return (
    <div className="space-y-8">
      {/* 1. Identitas & Persona */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
        <div className="flex items-center gap-2.5 border-b border-line pb-4 dark:border-line/40">
          <User className="size-5 text-brand dark:text-blue-400" />
          <h2 className="font-display text-base font-bold text-ink">Identitas & Persona</h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-ink">Nama Lengkap</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="Zakaria Mujur Prasetyo"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Nama Panggilan / Nickname</label>
            <input
              type="text"
              value={profile.nickname}
              onChange={(e) => updateProfile({ nickname: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="Zekk"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Nama Brand / Inisial</label>
            <input
              type="text"
              value={profile.brand}
              onChange={(e) => updateProfile({ brand: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="ZekkTech"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Foto Profil Utama</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                value={profile.avatarUrl}
                onChange={(e) => updateProfile({ avatarUrl: e.target.value })}
                className={`flex-1 ${inputClass}`}
                placeholder="/profile.webp atau URL gambar"
              />
              <label
                className={`flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-semibold text-ink hover:bg-surface dark:border-line/40 ${
                  uploadingImage === "avatarUrl" ? "opacity-50" : ""
                }`}
              >
                <Upload className="size-3.5" />
                <span>Unggah</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      void uploadAndSet(f, "avatar", (url) => updateProfile({ avatarUrl: url }), "avatarUrl");
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Peran Profesional (ID)</label>
            <input
              type="text"
              value={profile.roles}
              onChange={(e) => updateProfile({ roles: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="UI/UX Designer & Frontend Developer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Professional Roles (EN)</label>
            <input
              type="text"
              value={profile.rolesEn}
              onChange={(e) => updateProfile({ rolesEn: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="UI/UX Designer & Frontend Developer"
            />
          </div>
        </div>
      </div>

      {/* 2. Hero & Biografi */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
        <div className="flex items-center gap-2.5 border-b border-line pb-4 dark:border-line/40">
          <Globe className="size-5 text-brand dark:text-blue-400" />
          <h2 className="font-display text-base font-bold text-ink">Deskripsi Hero & Biografi</h2>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink">Deskripsi Hero (ID)</label>
              <textarea
                rows={3}
                value={profile.heroDesc}
                onChange={(e) => updateProfile({ heroDesc: e.target.value })}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Hero Description (EN)</label>
              <textarea
                rows={3}
                value={profile.heroDescEn}
                onChange={(e) => updateProfile({ heroDescEn: e.target.value })}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink">Biografi Paragraf 1 (ID)</label>
              <textarea
                rows={4}
                value={profile.bio[0] || ""}
                onChange={(e) => {
                  const newBio = [...profile.bio];
                  newBio[0] = e.target.value;
                  updateProfile({ bio: newBio });
                }}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Biography Paragraph 1 (EN)</label>
              <textarea
                rows={4}
                value={profile.bioEn[0] || ""}
                onChange={(e) => {
                  const newBioEn = [...profile.bioEn];
                  newBioEn[0] = e.target.value;
                  updateProfile({ bioEn: newBioEn });
                }}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink">Biografi Paragraf 2 (ID)</label>
              <textarea
                rows={4}
                value={profile.bio[1] || ""}
                onChange={(e) => {
                  const newBio = [...profile.bio];
                  newBio[1] = e.target.value;
                  updateProfile({ bio: newBio });
                }}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Biography Paragraph 2 (EN)</label>
              <textarea
                rows={4}
                value={profile.bioEn[1] || ""}
                onChange={(e) => {
                  const newBioEn = [...profile.bioEn];
                  newBioEn[1] = e.target.value;
                  updateProfile({ bioEn: newBioEn });
                }}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Kontak Publik & Lokasi */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
        <div className="flex items-center gap-2.5 border-b border-line pb-4 dark:border-line/40">
          <Mail className="size-5 text-brand dark:text-blue-400" />
          <h2 className="font-display text-base font-bold text-ink">Kontak Publik & Status</h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-ink">Alamat Email Publik</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => updateProfile({ email: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="zakariamujur6@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Nomor WhatsApp / Kontak</label>
            <input
              type="text"
              value={profile.whatsapp}
              onChange={(e) => updateProfile({ whatsapp: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="https://wa.me/..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Lokasi Basis (ID)</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => updateProfile({ location: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="Mojokerto, Jawa Timur"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Base Location (EN)</label>
            <input
              type="text"
              value={profile.locationEn}
              onChange={(e) => updateProfile({ locationEn: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="Mojokerto, East Java, Indonesia"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Status Ketersediaan (ID)</label>
            <input
              type="text"
              value={profile.availability}
              onChange={(e) => updateProfile({ availability: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="Terbuka untuk kolaborasi & proyek freelance"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Availability Status (EN)</label>
            <input
              type="text"
              value={profile.availabilityEn}
              onChange={(e) => updateProfile({ availabilityEn: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="Open for collaboration & freelance projects"
            />
          </div>
        </div>
      </div>

      {/* 4. Tautan Media Sosial */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
        <div className="flex items-center justify-between border-b border-line pb-4 dark:border-line/40">
          <div className="flex items-center gap-2.5">
            <Share2 className="size-5 text-brand dark:text-blue-400" />
            <h2 className="font-display text-base font-bold text-ink">Kanal Media Sosial</h2>
          </div>
          <button
            type="button"
            onClick={addSocial}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-ink"
          >
            <Plus className="size-3.5" />
            <span>Tambah Sosial</span>
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {(profile.socials || []).map((soc) => (
            <div
              key={soc.id}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-line/60 bg-surface/40 p-3.5 dark:border-line/30 dark:bg-slate-900/40"
            >
              <div className="w-full sm:w-36">
                <input
                  type="text"
                  value={soc.label}
                  onChange={(e) => updateSocial(soc.id, { label: e.target.value })}
                  className={inputClass}
                  placeholder="Label (mis. GitHub)"
                />
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  value={soc.href}
                  onChange={(e) => updateSocial(soc.id, { href: e.target.value })}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                <label className="flex items-center gap-1.5 text-xs text-body">
                  <input
                    type="checkbox"
                    checked={soc.visible !== false}
                    onChange={(e) => updateSocial(soc.id, { visible: e.target.checked })}
                    className="size-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span>Tampilkan</span>
                </label>

                <button
                  type="button"
                  onClick={() => deleteSocial(soc.id)}
                  className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  title="Hapus tautan sosial"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Mesin Statistik Pengalaman */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
        <div className="flex items-center gap-2.5 border-b border-line pb-4 dark:border-line/40">
          <BarChart2 className="size-5 text-brand dark:text-blue-400" />
          <h2 className="font-display text-base font-bold text-ink">Mesin Metrik & Statistik Pengalaman</h2>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink">
              <input
                type="radio"
                name="statsMode"
                checked={stats?.mode !== "manual"}
                onChange={() => updateStats({ mode: "auto" })}
                className="size-4 text-brand focus:ring-brand"
              />
              <span>Kalkulasi Otomatis (Turunan langsung dari proyek & sertifikat terverifikasi)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-ink">
              <input
                type="radio"
                name="statsMode"
                checked={stats?.mode === "manual"}
                onChange={() => updateStats({ mode: "manual" })}
                className="size-4 text-brand focus:ring-brand"
              />
              <span>Override Manual</span>
            </label>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Mode otomatis menjamin anti-slop: total proyek dan sertifikat dihitung langsung dari data yang dipublikasikan
            tanpa klaim angka berlebihan.
          </p>

          {stats?.mode === "manual" && (
            <div className="grid gap-4 sm:grid-cols-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Jumlah Proyek</label>
                <input
                  type="number"
                  value={stats.projectsCount}
                  onChange={(e) => updateStats({ projectsCount: Number(e.target.value) })}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Jumlah Sertifikat</label>
                <input
                  type="number"
                  value={stats.certificatesCount}
                  onChange={(e) => updateStats({ certificatesCount: Number(e.target.value) })}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Tahun Pengalaman</label>
                <input
                  type="text"
                  value={stats.experienceYears}
                  onChange={(e) => updateStats({ experienceYears: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="6+"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Organisasi Aktif</label>
                <input
                  type="number"
                  value={stats.organizationsCount}
                  onChange={(e) => updateStats({ organizationsCount: Number(e.target.value) })}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TabGeneral;
