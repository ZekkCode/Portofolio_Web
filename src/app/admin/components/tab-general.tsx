"use client";

import { useState, useMemo } from "react";
import type { SiteConfig, SocialLinkItem } from "@/lib/site-store";
import { computeAutoStatsBreakdown } from "@/lib/content/selectors";
import {
  DEFAULT_PORTRAIT_AVATAR_URL,
  resolveAboutPersonaImages,
  resolveGlobalPortrait,
} from "@/lib/content/identity-images";
import { MediaFieldControl } from "./MediaFieldControl";
import { ConfirmImpactModal, type DeleteImpactItem } from "./ConfirmImpactModal";
import { reorderItemsWithSortOrder } from "./AdminListTools";
import {
  Plus,
  Trash2,
  User,
  Globe,
  Mail,
  Share2,
  BarChart2,
  CreditCard,
  ChevronUp,
  ChevronDown,
  MousePointerClick,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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
  const [pendingDelete, setPendingDelete] = useState<DeleteImpactItem | null>(null);

  const autoBreakdown = useMemo(() => computeAutoStatsBreakdown(config), [config]);

  const updateProfile = (updates: Partial<typeof profile>) => {
    setDraft({
      ...config,
      generalProfile: { ...profile, ...updates },
    });
    setStatus("Profil umum diperbarui di draft");
  };

  const updateAboutPersona = (
    updates: Partial<NonNullable<typeof profile.aboutPersona>>
  ) => {
    updateProfile({
      aboutPersona: {
        ...(profile.aboutPersona || {
          frontImage: "",
          backImage: "",
          frontLabelId: "Frontend Dev",
          frontLabelEn: "Frontend Dev",
          frontCaptionId: "Antarmuka web & rekayasa interaktif",
          frontCaptionEn: "Web interfaces & interactive engineering",
          backLabelId: "Graphic Designer",
          backLabelEn: "Graphic Designer",
          backCaptionId: "Identitas visual & sistem multimedia",
          backCaptionEn: "Visual identity & multimedia systems",
        }),
        ...updates,
      },
    });
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
      showInContact: true,
      showInFooter: true,
      sortOrder: (profile.socials?.length || 0) + 1,
    };
    updateProfile({ socials: [...(profile.socials || []), newSoc] });
  };

  const updateSocial = (id: string, updates: Partial<SocialLinkItem>) => {
    const list = (profile.socials || []).map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    updateProfile({ socials: list });
  };

  const requestDeleteSocial = (soc: SocialLinkItem) => {
    setPendingDelete({
      entityType: "Kanal Media Sosial",
      itemName: soc.label || soc.platform,
      impacts: [
        "Tautan ini akan dihapus dari bagian Kontak maupun Footer saat dipublikasikan.",
      ],
      onConfirm: () => {
        const list = (profile.socials || []).filter((s) => s.id !== soc.id);
        updateProfile({ socials: list });
      },
    });
  };

  const moveSocial = (index: number, delta: -1 | 1) => {
    const next = reorderItemsWithSortOrder(profile.socials || [], index, index + delta);
    updateProfile({ socials: next });
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
            <label className="block text-xs font-semibold text-ink">Nama Lengkap (ID)</label>
            <input
              type="text"
              data-admin-field="generalProfile.name"
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="Zakaria Mujur Prasetyo"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Full Name (EN Optional)</label>
            <input
              type="text"
              value={profile.nameEn || ""}
              onChange={(e) => updateProfile({ nameEn: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="Biarkan kosong jika sama"
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
            <label className="block text-xs font-semibold text-ink">Username GitHub</label>
            <input
              type="text"
              value={profile.githubUsername || ""}
              onChange={(e) => updateProfile({ githubUsername: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="ZekkCode"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Tahun Mulai Berkarya (Since)</label>
            <input
              type="text"
              value={profile.since || ""}
              onChange={(e) => updateProfile({ since: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="2020"
            />
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

          <div className="sm:col-span-2">
            {(() => {
              const resolvedPortrait = resolveGlobalPortrait(config);
              return (
                <div className="space-y-2.5" data-admin-field="generalProfile.avatarUrl">
                  <MediaFieldControl
                    label="Potret Profil Global (Avatar Orang — Fallback Utama)"
                    value={profile.avatarUrl}
                    onChange={(url) => updateProfile({ avatarUrl: url })}
                    folder="profile"
                    fieldKey="general-avatar"
                    uploadAndSet={uploadAndSet}
                    uploadingImage={uploadingImage}
                    config={config}
                    previewShape="avatar"
                    placeholder="/profile.webp atau URL potret wajah"
                    helpText="Khusus foto potret wajah (rasio 4:5, disarankan ≥ 600×750 px). Dipakai sebagai fallback utama avatar Hologram Card & profil — jangan diisi gambar ID card."
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2 text-[11px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolvedPortrait.url}
                        alt="Pratinjau potret aktif"
                        className="size-8 shrink-0 rounded-full border border-line object-cover object-[50%_15%] bg-white"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-ink">
                          Potret aktif di publik:{" "}
                          <code className="font-mono text-[10px] text-brand">
                            {resolvedPortrait.url}
                          </code>
                        </div>
                        {resolvedPortrait.rejectedCardUrl ? (
                          <div className="text-amber-700 dark:text-amber-400">
                            Field masih berisi ID card ({resolvedPortrait.rejectedCardUrl}); publik fallback ke {resolvedPortrait.url}.
                          </div>
                        ) : resolvedPortrait.isRepoLowResPortrait ? (
                          <div className="text-muted">
                            Menggunakan potret bawaan /profile.webp (203×250 px). Unggah potret ≥ 600×750 px bila ingin hasil lebih tajam.
                          </div>
                        ) : (
                          <div className="text-muted">
                            Sumber khusus potret aktif (terpisah dari desain ID card).
                          </div>
                        )}
                      </div>
                    </div>
                    {resolvedPortrait.rejectedCardUrl && (
                      <button
                        type="button"
                        onClick={() => updateProfile({ avatarUrl: DEFAULT_PORTRAIT_AVATAR_URL })}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition"
                      >
                        Pakai /profile.webp
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 2. Hero CTA & Biografi */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
        <div className="flex items-center gap-2.5 border-b border-line pb-4 dark:border-line/40">
          <Globe className="size-5 text-brand dark:text-blue-400" />
          <h2 className="font-display text-base font-bold text-ink">Hero, Tombol CTA & Biografi</h2>
        </div>

        <div className="mt-5 space-y-5">
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
                data-admin-field="generalProfile.heroDescEn"
                value={profile.heroDescEn}
                onChange={(e) => updateProfile({ heroDescEn: e.target.value })}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          </div>

          {/* CTA Configuration */}
          <div className="rounded-xl border border-line/60 bg-surface/40 p-4 dark:border-line/30 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-ink">
              <MousePointerClick className="size-4 text-brand" />
              <span>Tombol Aksi Hero (CTA)</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-body">Label CTA Utama (ID)</label>
                <input
                  type="text"
                  value={profile.ctaPrimaryLabelId || "Kirim Email"}
                  onChange={(e) => updateProfile({ ctaPrimaryLabelId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-body">Primary CTA Label (EN)</label>
                <input
                  type="text"
                  value={profile.ctaPrimaryLabelEn || "Send Email"}
                  onChange={(e) => updateProfile({ ctaPrimaryLabelEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-body">Target CTA Utama (URL / mailto:)</label>
                <input
                  type="text"
                  value={profile.ctaPrimaryHref || `mailto:${profile.email}`}
                  onChange={(e) => updateProfile({ ctaPrimaryHref: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-body">Label CTA Sekunder (ID)</label>
                <input
                  type="text"
                  value={profile.ctaSecondaryLabelId || "Folder Berkas Karir"}
                  onChange={(e) => updateProfile({ ctaSecondaryLabelId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-body">Secondary CTA Label (EN)</label>
                <input
                  type="text"
                  value={profile.ctaSecondaryLabelEn || "Career Files"}
                  onChange={(e) => updateProfile({ ctaSecondaryLabelEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-body">Target CTA Sekunder (#anchor / URL)</label>
                <input
                  type="text"
                  value={profile.ctaSecondaryHref || "#cv"}
                  onChange={(e) => updateProfile({ ctaSecondaryHref: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Bio Paragraphs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Paragraf Biografi About Me</span>
              <button
                type="button"
                onClick={() =>
                  updateProfile({
                    bio: [...profile.bio, ""],
                    bioEn: [...profile.bioEn, ""],
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-2.5 py-1 text-[11px] font-semibold text-brand hover:bg-brand/15"
              >
                <Plus className="size-3" />
                <span>Tambah Paragraf Bio</span>
              </button>
            </div>

            {Array.from({
              length: Math.max(profile.bio.length, profile.bioEn.length, 1),
            }).map((_, idx) => (
              <div
                key={idx}
                className="grid gap-3 rounded-xl border border-line/50 p-3 sm:grid-cols-2 dark:border-line/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-ink">
                      Paragraf {idx + 1} (ID)
                    </label>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextId = profile.bio.filter((_, i) => i !== idx);
                          const nextEn = profile.bioEn.filter((_, i) => i !== idx);
                          updateProfile({ bio: nextId, bioEn: nextEn });
                        }}
                        className="text-[10px] font-semibold text-rose-600 hover:underline"
                      >
                        Hapus Baris
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={profile.bio[idx] || ""}
                    onChange={(e) => {
                      const next = [...profile.bio];
                      next[idx] = e.target.value;
                      updateProfile({ bio: next });
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Paragraph {idx + 1} (EN)
                  </label>
                  <textarea
                    rows={3}
                    value={profile.bioEn[idx] || ""}
                    onChange={(e) => {
                      const next = [...profile.bioEn];
                      next[idx] = e.target.value;
                      updateProfile({ bioEn: next });
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2B. Kartu Persona Interaktif di About Me */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
        <div className="flex items-center gap-2.5 border-b border-line pb-4 dark:border-line/40">
          <CreditCard className="size-5 text-brand dark:text-blue-400" />
          <div>
            <h2 className="font-display text-base font-bold text-ink">
              Kartu Persona Interaktif (About Me)
            </h2>
            <p className="text-[11px] text-muted">
              Kartu identitas dua sisi untuk seksi About Me (bukan foto potret avatar). Kosongkan URL jika ingin mengikuti sisi depan/belakang Lanyard 3D.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <MediaFieldControl
            label="Kartu Persona Depan — Frontend Dev (Desain ID Card)"
            value={profile.aboutPersona?.frontImage || ""}
            onChange={(url) => updateAboutPersona({ frontImage: url })}
            folder="lanyard"
            fieldKey="about-persona-front"
            uploadAndSet={uploadAndSet}
            uploadingImage={uploadingImage}
            config={config}
            previewShape="portrait"
            placeholder="/card-front-v2.webp"
            helpText="Kartu depan di seksi About Me (rasio 1457:2048). Kosong = ikut Lanyard Depan (/card-front-v2.webp)."
          />
          <MediaFieldControl
            label="Kartu Persona Belakang — Graphic Designer (Desain ID Card)"
            value={profile.aboutPersona?.backImage || ""}
            onChange={(url) => updateAboutPersona({ backImage: url })}
            folder="lanyard"
            fieldKey="about-persona-back"
            uploadAndSet={uploadAndSet}
            uploadingImage={uploadingImage}
            config={config}
            previewShape="portrait"
            placeholder="/card-back-v2.webp"
            helpText="Kartu belakang di seksi About Me (rasio 1457:2048). Kosong = ikut Lanyard Belakang (/card-back-v2.webp)."
          />
          {(() => {
            const resolvedPersona = resolveAboutPersonaImages(config);
            return (
              <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface/60 p-3 text-[11px]">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedPersona.frontImage}
                    alt="Preview Kartu Frontend About Me"
                    className="aspect-[1457/2048] w-11 shrink-0 rounded-md border border-line object-cover bg-slate-900"
                  />
                  <div>
                    <div className="font-semibold text-ink">Kartu Depan (Frontend Dev)</div>
                    <div className="font-mono text-[10px] text-muted">{resolvedPersona.frontImage}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedPersona.backImage}
                    alt="Preview Kartu Graphic Designer About Me"
                    className="aspect-[1457/2048] w-11 shrink-0 rounded-md border border-line object-cover bg-slate-900"
                  />
                  <div>
                    <div className="font-semibold text-ink">Kartu Belakang (Graphic Designer)</div>
                    <div className="font-mono text-[10px] text-muted">{resolvedPersona.backImage}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-semibold text-ink">Label Tab 1 (ID)</label>
            <input
              type="text"
              value={profile.aboutPersona?.frontLabelId || "Frontend Dev"}
              onChange={(e) => updateAboutPersona({ frontLabelId: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink">Tab 1 Label (EN)</label>
            <input
              type="text"
              value={profile.aboutPersona?.frontLabelEn || "Frontend Dev"}
              onChange={(e) => updateAboutPersona({ frontLabelEn: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink">Keterangan Kartu 1 (ID)</label>
            <input
              type="text"
              value={profile.aboutPersona?.frontCaptionId || ""}
              onChange={(e) => updateAboutPersona({ frontCaptionId: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink">Card 1 Caption (EN)</label>
            <input
              type="text"
              value={profile.aboutPersona?.frontCaptionEn || ""}
              onChange={(e) => updateAboutPersona({ frontCaptionEn: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Label Tab 2 (ID)</label>
            <input
              type="text"
              value={profile.aboutPersona?.backLabelId || "Graphic Designer"}
              onChange={(e) => updateAboutPersona({ backLabelId: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink">Tab 2 Label (EN)</label>
            <input
              type="text"
              value={profile.aboutPersona?.backLabelEn || "Graphic Designer"}
              onChange={(e) => updateAboutPersona({ backLabelEn: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink">Keterangan Kartu 2 (ID)</label>
            <input
              type="text"
              value={profile.aboutPersona?.backCaptionId || ""}
              onChange={(e) => updateAboutPersona({ backCaptionId: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink">Card 2 Caption (EN)</label>
            <input
              type="text"
              value={profile.aboutPersona?.backCaptionEn || ""}
              onChange={(e) => updateAboutPersona({ backCaptionEn: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>
      </div>

      {/* 3. Kontak Publik & Status Ketersediaan */}
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
              data-admin-field="generalProfile.email"
              value={profile.email}
              onChange={(e) => updateProfile({ email: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="zakariamujur6@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Status Indikator Ketersediaan</label>
            <select
              value={profile.availabilityStatus || "available"}
              onChange={(e) =>
                updateProfile({
                  availabilityStatus: e.target.value as
                    | "available"
                    | "busy"
                    | "unavailable"
                    | "hidden",
                })
              }
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="available">Tersedia (Hijau)</option>
              <option value="busy">Sibuk Terbatas (Kuning)</option>
              <option value="unavailable">Tidak Tersedia (Abu)</option>
              <option value="hidden">Sembunyikan Status</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Nomor WhatsApp / URL Kontak</label>
            <input
              type="text"
              value={profile.whatsapp}
              onChange={(e) => updateProfile({ whatsapp: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="https://wa.me/..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">URL Website Utama (Canonical Base)</label>
            <input
              type="text"
              value={profile.site}
              onChange={(e) => updateProfile({ site: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
              placeholder="https://zakariamp.vercel.app"
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
            <label className="block text-xs font-semibold text-ink">Teks Status Ketersediaan (ID)</label>
            <input
              type="text"
              value={profile.availability}
              onChange={(e) => updateProfile({ availability: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Availability Text (EN)</label>
            <input
              type="text"
              value={profile.availabilityEn}
              onChange={(e) => updateProfile({ availabilityEn: e.target.value })}
              className={`mt-1.5 ${inputClass}`}
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
          {(profile.socials || []).map((soc, idx) => (
            <div
              key={soc.id}
              className="space-y-3 rounded-xl border border-line/60 bg-surface/40 p-3.5 dark:border-line/30 dark:bg-slate-900/40"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={soc.platform}
                  onChange={(e) => updateSocial(soc.id, { platform: e.target.value })}
                  className={inputClass}
                >
                  <option value="github">GitHub</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="behance">Behance</option>
                  <option value="dribbble">Dribbble</option>
                  <option value="youtube">YouTube</option>
                  <option value="x">X / Twitter</option>
                  <option value="custom">Kustom</option>
                </select>
                <input
                  type="text"
                  value={soc.label}
                  onChange={(e) => updateSocial(soc.id, { label: e.target.value })}
                  className={inputClass}
                  placeholder="Label (mis. GitHub)"
                />
                <input
                  type="text"
                  value={soc.href}
                  onChange={(e) => updateSocial(soc.id, { href: e.target.value })}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-3 text-xs text-body">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={soc.visible !== false}
                      onChange={(e) => updateSocial(soc.id, { visible: e.target.checked })}
                      className="size-3.5 rounded border-line text-brand"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={soc.showInFooter !== false}
                      onChange={(e) => updateSocial(soc.id, { showInFooter: e.target.checked })}
                      className="size-3.5 rounded border-line text-brand"
                    />
                    <span>Tampil di Footer</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={soc.showInContact !== false}
                      onChange={(e) => updateSocial(soc.id, { showInContact: e.target.checked })}
                      className="size-3.5 rounded border-line text-brand"
                    />
                    <span>Masuk Ledger Kontak</span>
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSocial(idx, -1)}
                    className="rounded-lg border border-line/60 p-1 text-muted hover:text-ink disabled:opacity-35"
                    title="Geser Naik"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (profile.socials?.length || 1) - 1}
                    onClick={() => moveSocial(idx, 1)}
                    className="rounded-lg border border-line/60 p-1 text-muted hover:text-ink disabled:opacity-35"
                    title="Geser Turun"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDeleteSocial(soc)}
                    className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    title="Hapus tautan sosial"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Mesin Statistik Pengalaman (Auto Interval Merge vs Manual) */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-2xs dark:border-line/40 dark:bg-[#0c0e17]">
        <div className="flex items-center gap-2.5 border-b border-line pb-4 dark:border-line/40">
          <BarChart2 className="size-5 text-brand dark:text-blue-400" />
          <h2 className="font-display text-base font-bold text-ink">
            Mesin Metrik & Statistik Pengalaman
          </h2>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink">
              <input
                type="radio"
                name="statsMode"
                checked={stats?.mode !== "manual"}
                onChange={() => updateStats({ mode: "auto" })}
                className="size-4 text-brand focus:ring-brand"
              />
              <span>Kalkulasi Otomatis (Publik & Tampil saja)</span>
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

          {stats?.mode !== "manual" ? (
            <div className="space-y-4 rounded-xl border border-line/60 bg-surface/50 p-4 dark:border-line/30 dark:bg-slate-900/40">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink">
                    Aturan Periode Tumpang Tindih
                  </label>
                  <select
                    value={stats?.overlappingRule || "merge_intervals"}
                    onChange={(e) =>
                      updateStats({
                        overlappingRule: e.target.value as "merge_intervals" | "since_year",
                      })
                    }
                    className={`mt-1 ${inputClass}`}
                  >
                    <option value="merge_intervals">
                      Gabungkan Interval Pengalaman (Anti Hitung Ganda)
                    </option>
                    <option value="since_year">
                      Hitung Sejak Tahun Mulai Berkarya
                    </option>
                  </select>
                </div>

                {stats?.overlappingRule === "since_year" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-ink">
                      Tahun Awal (Since Year)
                    </label>
                    <input
                      type="number"
                      value={stats.sinceYear || 2020}
                      onChange={(e) => updateStats({ sinceYear: Number(e.target.value) })}
                      className={`mt-1 ${inputClass}`}
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs font-medium text-ink pt-4">
                  <input
                    type="checkbox"
                    checked={Boolean(stats?.includeAchievementsInCerts)}
                    onChange={(e) =>
                      updateStats({ includeAchievementsInCerts: e.target.checked })
                    }
                    className="size-4 rounded border-line text-brand"
                  />
                  <span>Gabungkan Prestasi ke Angka Sertifikat</span>
                </label>
              </div>

              {/* Real-time breakdown preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-line/40">
                <div className="rounded-lg bg-white p-2.5 dark:bg-slate-950/60">
                  <span className="text-[10px] text-muted">Proyek Publik</span>
                  <p className="font-mono text-lg font-bold text-ink">
                    {autoBreakdown.projectsCount}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2.5 dark:bg-slate-950/60">
                  <span className="text-[10px] text-muted">Sertifikat Publik</span>
                  <p className="font-mono text-lg font-bold text-ink">
                    {autoBreakdown.certificatesCount}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2.5 dark:bg-slate-950/60">
                  <span className="text-[10px] text-muted">
                    Pengalaman ({autoBreakdown.experienceMonths} bln net)
                  </span>
                  <p className="font-mono text-lg font-bold text-ink">
                    {autoBreakdown.experienceYears}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2.5 dark:bg-slate-950/60">
                  <span className="text-[10px] text-muted">Organisasi Unik</span>
                  <p className="font-mono text-lg font-bold text-ink">
                    {autoBreakdown.organizationsCount}
                  </p>
                </div>
              </div>
              {autoBreakdown.uniqueOrganizations.length > 0 && (
                <p className="text-[11px] text-muted">
                  Entitas unik terhitung (via grup/institusi):{" "}
                  <strong className="text-ink">
                    {autoBreakdown.uniqueOrganizations.join(", ")}
                  </strong>
                </p>
              )}

              {/* Rincian Interval & Record Dikecualikan */}
              <div className="space-y-3 border-t border-line/40 pt-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                  <span>
                    Aturan: <strong className="text-ink">{autoBreakdown.monthCountingRule}</strong>
                  </span>
                  <span className="rounded bg-surface px-2 py-0.5 font-mono text-[10px] text-ink dark:bg-slate-800">
                    Referensi: {autoBreakdown.asOfMonth}
                  </span>
                </div>

                {autoBreakdown.overlappingRule === "merge_intervals" && (
                  <div className="rounded-lg border border-line/60 bg-white/80 p-3 dark:border-line/30 dark:bg-slate-950/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-ink">
                        Interval Tergabung ({autoBreakdown.mergedIntervals.length})
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-brand">
                        Total: {autoBreakdown.experienceMonths} bln net
                      </span>
                    </div>
                    {autoBreakdown.mergedIntervals.length === 0 ? (
                      <p className="mt-1.5 text-[11px] text-muted">
                        Belum ada interval tanggal pengalaman yang valid untuk dihitung.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {autoBreakdown.mergedIntervals.map((interval) => (
                          <li
                            key={`${interval.startYm}-${interval.endYm}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface/60 px-2.5 py-1.5 text-[11px] dark:bg-slate-900/60"
                          >
                            <span className="font-mono font-semibold text-ink">
                              {interval.startYm} s.d. {interval.endYm}
                            </span>
                            <span className="text-muted">
                              {interval.labels.join(" + ")}
                            </span>
                            <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand">
                              {interval.months} bln
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-line/60 bg-white/80 p-3 dark:border-line/30 dark:bg-slate-950/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span>Ikut Dihitung ({autoBreakdown.includedRecords.length})</span>
                    </div>
                    {autoBreakdown.includedRecords.length === 0 ? (
                      <p className="mt-1.5 text-[11px] text-muted">Tidak ada record terhitung.</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {autoBreakdown.includedRecords.map((rec) => (
                          <li
                            key={rec.id}
                            className="rounded-md bg-surface/60 px-2.5 py-1.5 text-[11px] dark:bg-slate-900/60"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-ink">
                                {rec.org || rec.role || rec.id}
                              </span>
                              <span className="font-mono text-[10px] font-semibold text-ink">
                                {rec.months} bln
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                              <span className="font-mono">
                                {rec.startYm} s.d. {rec.endYm}
                              </span>
                              <span>•</span>
                              <span>
                                {rec.dateSource === "structured"
                                  ? "Tanggal terstruktur"
                                  : "Fallback teks periode"}
                              </span>
                              {rec.clampedFutureEnd && (
                                <span className="text-amber-600 dark:text-amber-400">
                                  (dibatasi ke {rec.endYm})
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-lg border border-line/60 bg-white/80 p-3 dark:border-line/30 dark:bg-slate-950/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>Tidak Ikut Dihitung ({autoBreakdown.excludedRecords.length})</span>
                    </div>
                    {autoBreakdown.excludedRecords.length === 0 ? (
                      <p className="mt-1.5 text-[11px] text-muted">
                        Seluruh record pengalaman ikut dihitung.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {autoBreakdown.excludedRecords.map((rec) => (
                          <li
                            key={rec.id}
                            className="rounded-md bg-amber-50/70 px-2.5 py-1.5 text-[11px] dark:bg-amber-950/20"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-ink">
                                {rec.org || rec.role || rec.id}
                              </span>
                              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                                {rec.exclusionReason}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-muted">
                              {rec.exclusionDetail}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
                  placeholder="3+"
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

      <ConfirmImpactModal
        pendingDelete={pendingDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default TabGeneral;
