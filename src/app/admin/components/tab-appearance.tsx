"use client";

import { useState, useEffect } from "react";
import type { AdminNavigationTarget } from "../admin-navigation";
import Lanyard from "@/components/lanyard";
import ProfileCard from "@/components/profile-card";
import { MediaFieldControl } from "./MediaFieldControl";
import type { SiteConfig, LanyardConfig, ProfileCardConfig, SeoConfig } from "@/lib/site-store";
import {
  DEFAULT_PORTRAIT_AVATAR_URL,
  resolveLanyardImages,
  resolveProfileCardAvatar,
  resolveProfileCardImageFit,
  resolveProfileCardMiniAvatar,
} from "@/lib/content/identity-images";
import { Sparkles, Layers, Search, ExternalLink } from "lucide-react";

interface TabAppearanceProps {
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
  navigationTarget?: AdminNavigationTarget | null;
}

type FieldKind = "range" | "select" | "color" | "toggle" | "image";

type Field = {
  key: keyof LanyardConfig;
  label: string;
  kind: FieldKind;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: readonly string[];
};

const LANYARD_GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Tekstur & Gambar Kartu ID Lanyard (Terpisah dari Avatar Orang)",
    fields: [
      {
        key: "frontImage",
        label: "Gambar Depan Lanyard — Kartu Frontend Dev (1457:2048)",
        kind: "image",
        hint: "Kartu ID depan 3D (Frontend Dev). Rasio ≈ 0.71 (1457×2048). Kosong = fallback ke /card-front-v2.webp. Tidak dipakai untuk avatar Hologram.",
      },
      {
        key: "backImage",
        label: "Gambar Belakang Lanyard — Kartu Graphic Designer (1457:2048)",
        kind: "image",
        hint: "Kartu ID belakang 3D (Graphic Designer). Rasio ≈ 0.71 (1457×2048). Kosong = fallback ke /card-back-v2.webp.",
      },
      {
        key: "strapImage",
        label: "Tekstur Tali Lanyard (Opsional)",
        kind: "image",
        hint: "Gambar memanjang (wide), diulang sepanjang tali lanyard 3D. PNG/JPG otomatis dikonversi ke WebP.",
      },
      { key: "imageFit", label: "Image fit", kind: "select", options: ["cover", "contain"] },
    ],
  },
  {
    title: "Bentuk & Finishing Kartu",
    fields: [
      { key: "cardColor", label: "Warna kartu", kind: "color" },
      { key: "orientation", label: "Orientasi", kind: "select", options: ["portrait", "landscape"] },
      {
        key: "finish",
        label: "Finishing",
        kind: "select",
        options: ["glossy", "matte", "holographic", "metallic"],
      },
      { key: "metal", label: "Warna klip logam", kind: "select", options: ["graphite", "silver", "gold"] },
      { key: "cornerRadius", label: "Corner radius", kind: "range", min: 0.05, max: 1.0, step: 0.01 },
      { key: "size", label: "Ukuran kartu", kind: "range", min: 0.2, max: 0.8, step: 0.01 },
      { key: "anchor", label: "Posisi gantung", kind: "select", options: ["left", "center", "right"] },
    ],
  },
  {
    title: "Tali Gantung (Strap)",
    fields: [
      { key: "strapColor", label: "Warna tali", kind: "color" },
      { key: "strapLength", label: "Panjang tali", kind: "range", min: 0.2, max: 1.5, step: 0.01 },
      { key: "strapWidth", label: "Lebar tali", kind: "range", min: 0.3, max: 1.5, step: 0.01 },
    ],
  },
  {
    title: "Fisika & Interaksi Three.js",
    fields: [
      { key: "gravity", label: "Gravitasi", kind: "range", min: 0, max: 3, step: 0.05 },
      { key: "damping", label: "Damping (redaman)", kind: "range", min: 0.05, max: 0.95, step: 0.01 },
      { key: "elasticity", label: "Elastisitas", kind: "range", min: 0.05, max: 0.95, step: 0.01 },
      { key: "breeze", label: "Angin sepoi", kind: "range", min: 0, max: 1, step: 0.02 },
      { key: "interactive", label: "Bisa ditarik kursor", kind: "toggle" },
      { key: "intro", label: "Animasi jatuh awal", kind: "toggle" },
    ],
  },
];

export function TabAppearance({
  config,
  setDraft,
  setStatus,
  uploadAndSet,
  uploadingImage,
  inputClass,
  navigationTarget,
}: TabAppearanceProps) {
  const [subTab, setSubTab] = useState<"lanyard" | "profileCard" | "seo">("lanyard");

  useEffect(() => {
    if (!navigationTarget || navigationTarget.tab !== "appearance") return;
    if (
      navigationTarget.subTab === "lanyard" ||
      navigationTarget.subTab === "profileCard" ||
      navigationTarget.subTab === "seo"
    ) {
      setSubTab(navigationTarget.subTab);
    }
  }, [navigationTarget]);

  const updateLanyard = <K extends keyof LanyardConfig>(key: K, value: LanyardConfig[K]) => {
    setDraft({ ...config, lanyard: { ...config.lanyard, [key]: value } });
    setStatus("Draft Lanyard 3D diubah");
  };

  const updateProfileCard = <K extends keyof ProfileCardConfig>(key: K, value: ProfileCardConfig[K]) => {
    setDraft({ ...config, profileCard: { ...config.profileCard, [key]: value } });
    setStatus("Draft Profile Card diubah");
  };

  const seo: SeoConfig = config.seo || {};
  const updateSeo = (updates: Partial<SeoConfig>) => {
    setDraft({ ...config, seo: { ...seo, ...updates } });
    setStatus("Pengaturan SEO & Metadata diubah di draft");
  };

  const serpTitle =
    seo.metaTitle ||
    `${config.generalProfile?.name || "Zakaria Mujur Prasetyo"} | ${config.generalProfile?.roles || "UI/UX & Frontend"}`;
  const serpDesc =
    seo.metaDesc ||
    config.generalProfile?.heroDesc ||
    "Portfolio resmi Zakaria Mujur Prasetyo (ZekkTech).";
  const serpHost = seo.canonicalUrl || config.generalProfile?.site || "https://zakariamp.id";

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-3">
        <button
          type="button"
          onClick={() => setSubTab("lanyard")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "lanyard"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <Sparkles className="size-4" />
          3D Interactive Lanyard (Hero)
        </button>
        <button
          type="button"
          onClick={() => setSubTab("profileCard")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "profileCard"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <Layers className="size-4" />
          Hologram Profile Card (Kontak)
        </button>
        <button
          type="button"
          onClick={() => setSubTab("seo")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "seo"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <Search className="size-4" />
          SEO, OpenGraph &amp; Schema
        </button>
      </div>

      {/* ===================== SUBTAB 1: LANYARD 3D ===================== */}
      {subTab === "lanyard" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-5">
            {LANYARD_GROUPS.map((group) => (
              <section
                key={group.title}
                className="rounded-2xl border border-line/70 bg-white/70 p-5 shadow-sm dark:border-line/40 dark:bg-slate-900/60"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{group.title}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {group.fields.map((field) => {
                    const value = config.lanyard[field.key];
                    return (
                      <div key={field.key} className={field.kind === "image" ? "sm:col-span-2" : ""}>
                        {field.kind !== "image" && (
                          <div className="flex items-center justify-between text-xs text-ink font-medium">
                            <label htmlFor={`field-${field.key}`}>{field.label}</label>
                            {field.kind === "range" && (
                              <span className="font-mono text-xs text-brand font-bold">
                                {typeof value === "number" ? value.toFixed(2) : String(value)}
                              </span>
                            )}
                          </div>
                        )}

                        {field.kind === "range" && (
                          <input
                            id={`field-${field.key}`}
                            type="range"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={Number(value ?? 0)}
                            onChange={(e) => updateLanyard(field.key, Number(e.target.value))}
                            className="mt-2 w-full accent-brand"
                          />
                        )}

                        {field.kind === "select" && (
                          <select
                            id={`field-${field.key}`}
                            value={String(value)}
                            onChange={(e) => updateLanyard(field.key, e.target.value as never)}
                            className={`mt-1.5 ${inputClass}`}
                          >
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {field.kind === "color" && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <input
                              id={`field-${field.key}`}
                              type="color"
                              value={String(value)}
                              onChange={(e) => updateLanyard(field.key, e.target.value as never)}
                              className="size-9 cursor-pointer rounded-xl border border-line bg-transparent p-0.5"
                            />
                            <input
                              type="text"
                              value={String(value)}
                              onChange={(e) => updateLanyard(field.key, e.target.value as never)}
                              className={inputClass}
                            />
                          </div>
                        )}

                        {field.kind === "toggle" && (
                          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-ink">
                            <input
                              id={`field-${field.key}`}
                              type="checkbox"
                              checked={Boolean(value)}
                              onChange={(e) => updateLanyard(field.key, e.target.checked as never)}
                              className="size-4 rounded text-brand focus:ring-brand"
                            />
                            <span>{Boolean(value) ? "Aktif" : "Nonaktif"}</span>
                          </label>
                        )}

                        {field.kind === "image" && (
                          <MediaFieldControl
                            label={field.label}
                            value={String(value ?? "")}
                            onChange={(url) => updateLanyard(field.key, url as never)}
                            folder="lanyard"
                            fieldKey={field.key}
                            uploadAndSet={uploadAndSet}
                            uploadingImage={uploadingImage}
                            config={config}
                            accept="image/png,image/jpeg,image/webp"
                            placeholder={
                              field.key === "frontImage"
                                ? "/card-front-v2.webp"
                                : field.key === "backImage"
                                  ? "/card-back-v2.webp"
                                  : "https://... atau path WebP"
                            }
                            previewShape={field.key === "strapImage" ? "wide" : "portrait"}
                            helpText={field.hint}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Sticky 3D Lanyard Preview */}
          <div className="sticky top-24 self-start rounded-2xl border border-line/70 bg-white/70 p-4 shadow-sm dark:border-line/40 dark:bg-slate-900/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Pratinjau Fisika 3D Lanyard</h3>
            {(() => {
              const resolvedLanyard = resolveLanyardImages({ lanyard: config.lanyard });
              return (
                <>
                  <div className="mt-3 aspect-square w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950">
                    <Lanyard
                      {...config.lanyard}
                      frontImage={resolvedLanyard.frontImage}
                      backImage={resolvedLanyard.backImage}
                      strapImage={resolvedLanyard.strapImage || undefined}
                    />
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-xl border border-line/70 bg-surface/60 p-2.5 text-[11px] dark:border-line/40">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolvedLanyard.frontImage}
                        alt="Preview sisi depan lanyard"
                        className="aspect-[1457/2048] w-8 shrink-0 rounded border border-line object-cover bg-slate-900"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">Depan</div>
                        <div className="truncate font-mono text-[10px] text-muted">
                          {resolvedLanyard.frontImage}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolvedLanyard.backImage}
                        alt="Preview sisi belakang lanyard"
                        className="aspect-[1457/2048] w-8 shrink-0 rounded border border-line object-cover bg-slate-900"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">Belakang</div>
                        <div className="truncate font-mono text-[10px] text-muted">
                          {resolvedLanyard.backImage}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
            <p className="mt-2 text-center text-[11px] text-muted">
              Tarik kartu dengan mouse / kursor untuk menguji interaksi spring physics.
            </p>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 2: PROFILE CARD ===================== */}
      {subTab === "profileCard" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-line/70 bg-white/70 p-5 shadow-sm dark:border-line/40 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Foto &amp; Aset Hologram Profile Card</h3>
              <p className="mt-1 text-[11px] text-muted">
                Slot potret khusus manusia (terpisah dari desain kartu ID Lanyard &amp; About). Kosongkan override untuk mewarisi Potret Profil Global.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2" data-admin-field="profileCard.avatarUrl">
                  <MediaFieldControl
                    label="Potret Utama Hologram Card (Avatar Orang — Kosong = ikut Potret Profil Global)"
                    value={config.profileCard.avatarUrl || ""}
                    onChange={(url) => updateProfileCard("avatarUrl", url)}
                    folder="profile"
                    fieldKey="avatarUrl"
                    uploadAndSet={uploadAndSet}
                    uploadingImage={uploadingImage}
                    config={config}
                    accept="image/webp,image/png,image/jpeg"
                    placeholder="/profile.webp atau kosongkan untuk ikut Potret Profil Global"
                    previewShape="portrait"
                    helpText="Khusus foto potret manusia (rasio 4:5, disarankan ≥ 600×750 px). Fallback ke Potret Profil Global / /profile.webp — bukan ID card."
                  />
                  {config.profileCard.avatarUrl && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateProfileCard("avatarUrl", "")}
                        className="inline-flex items-center rounded-xl border border-line/70 px-2.5 py-1 text-[11px] font-medium text-muted hover:text-ink dark:border-line/40"
                      >
                        Kosongkan (Ikuti Potret Profil Global)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProfileCard("avatarUrl", DEFAULT_PORTRAIT_AVATAR_URL)}
                        className="inline-flex items-center rounded-xl border border-line/70 px-2.5 py-1 text-[11px] font-medium text-muted hover:text-ink dark:border-line/40"
                      >
                        Gunakan /profile.webp
                      </button>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2" data-admin-field="profileCard.miniAvatarUrl">
                  <MediaFieldControl
                    label="Avatar Kecil Footer Hologram Card (Kosong = ikut Potret Utama)"
                    value={config.profileCard.miniAvatarUrl || ""}
                    onChange={(url) => updateProfileCard("miniAvatarUrl", url)}
                    folder="profile"
                    fieldKey="miniAvatarUrl"
                    uploadAndSet={uploadAndSet}
                    uploadingImage={uploadingImage}
                    config={config}
                    accept="image/webp,image/png,image/jpeg"
                    placeholder="Kosongkan agar otomatis mengikuti potret utama Hologram Card"
                    previewShape="avatar"
                    helpText="Foto bulat kecil di kiri bawah Hologram Card (rasio 1:1). Kosong = mengikuti potret utama Hologram Card."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">Nama Tampilan</label>
                  <input
                    type="text"
                    value={config.profileCard.name}
                    onChange={(e) => updateProfileCard("name", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">Judul Peran (Roles)</label>
                  <input
                    type="text"
                    value={config.profileCard.title}
                    onChange={(e) => updateProfileCard("title", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">Username Handle</label>
                  <input
                    type="text"
                    value={config.profileCard.handle}
                    onChange={(e) => updateProfileCard("handle", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">Status Aktivitas</label>
                  <input
                    type="text"
                    value={config.profileCard.status}
                    onChange={(e) => updateProfileCard("status", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">Teks Tombol Kontak</label>
                  <input
                    type="text"
                    value={config.profileCard.contactText || ""}
                    onChange={(e) => updateProfileCard("contactText", e.target.value)}
                    placeholder="Hubungi"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">Warna Status Dot</label>
                  <input
                    type="text"
                    value={config.profileCard.statusColor || "#10b981"}
                    onChange={(e) => updateProfileCard("statusColor", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-line/70 bg-white/70 p-5 shadow-sm dark:border-line/40 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Efek Hologram &amp; Interaksi 3D</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted">
                    <span>Intensitas Hologram</span>
                    <span className="font-mono text-brand">{config.profileCard.holo}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.profileCard.holo}
                    onChange={(e) => updateProfileCard("holo", parseFloat(e.target.value))}
                    className="w-full accent-brand"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted">
                    <span>Intensitas Glare Pantulan</span>
                    <span className="font-mono text-brand">{config.profileCard.glare}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.profileCard.glare}
                    onChange={(e) => updateProfileCard("glare", parseFloat(e.target.value))}
                    className="w-full accent-brand"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted">
                    <span>Kekuatan Kemiringan (Tilt)</span>
                    <span className="font-mono text-brand">{config.profileCard.tiltStrength}</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={config.profileCard.tiltStrength}
                    onChange={(e) => updateProfileCard("tiltStrength", parseInt(e.target.value, 10))}
                    className="w-full accent-brand"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">Penyesuaian Foto (Image Fit)</label>
                  <select
                    value={config.profileCard.imageFit}
                    onChange={(e) => updateProfileCard("imageFit", e.target.value as "cover" | "contain")}
                    className={inputClass}
                  >
                    <option value="cover">Cover (Isi Penuh Frame)</option>
                    <option value="contain">Contain (Utuh Tanpa Crop)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted">Tema Visual</label>
                  <select
                    value={config.profileCard.theme}
                    onChange={(e) => updateProfileCard("theme", e.target.value as "dark" | "light")}
                    className={inputClass}
                  >
                    <option value="dark">Dark Theme</option>
                    <option value="light">Light Theme</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* Sticky Profile Card Preview */}
          <div className="sticky top-24 self-start rounded-2xl border border-line/70 bg-white/70 p-4 shadow-sm dark:border-line/40 dark:bg-slate-900/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Pratinjau Hologram Profile Card</h3>
            {(() => {
              const imageContext = {
                profileCard: config.profileCard,
                generalProfile: config.generalProfile,
                lanyard: config.lanyard,
              };
              const avatarResolution = resolveProfileCardAvatar(imageContext);
              const miniResolution = resolveProfileCardMiniAvatar(imageContext);
              const fitResolution = resolveProfileCardImageFit(imageContext);
              return (
                <>
                  <div className="mt-3 flex items-center justify-center p-4">
                    <ProfileCard
                      {...config.profileCard}
                      avatarUrl={avatarResolution.url}
                      secondaryAvatarUrl={config.profileCard.secondaryAvatarUrl || "/card-back-v2.webp"}
                      miniAvatarUrl={miniResolution.url}
                      imageFit={fitResolution}
                    />
                  </div>
                  <div className="mt-2 space-y-1.5 rounded-xl border border-line/70 bg-surface/60 p-3 text-[11px] dark:border-line/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Potret utama aktif:</span>
                      <code className="truncate font-mono text-[10px] text-brand">{avatarResolution.url}</code>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Avatar mini footer:</span>
                      <code className="truncate font-mono text-[10px] text-ink">{miniResolution.url}</code>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Sumber fallback:</span>
                      <span className="font-medium text-ink">{avatarResolution.source}</span>
                    </div>
                    {(avatarResolution.rejectedCardUrl || miniResolution.rejectedCardUrl) && (
                      <p className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        Aset ID card ({avatarResolution.rejectedCardUrl || miniResolution.rejectedCardUrl}) diabaikan untuk avatar orang; menampilkan fallback potret {avatarResolution.url}.
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
            <p className="mt-2 text-center text-[11px] text-muted">
              Gerakkan kursor di atas kartu untuk melihat efek glare hologram dan 3D tilt.
            </p>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 3: SEO & OPENGRAPH ===================== */}
      {subTab === "seo" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line/70 bg-white/80 p-5 shadow-sm dark:border-line/40 dark:bg-slate-900/60 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">SEO Global, OpenGraph &amp; Schema.org</h3>
                <p className="text-xs text-muted">
                  Diterapkan langsung ke tag judul halaman, meta OpenGraph/Twitter, `robots.txt`, `sitemap.xml`, dan JSON-LD `Person`
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={seo.robotsIndex !== false}
                  onChange={(e) => updateSeo({ robotsIndex: e.target.checked })}
                  className="size-4 rounded text-brand"
                />
                <span>Izinkan Pengindeksan (`index, follow`)</span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Meta Title Utama (ID)</label>
                <input
                  type="text"
                  data-admin-field="seo.metaTitle"
                  value={seo.metaTitle || ""}
                  onChange={(e) => updateSeo({ metaTitle: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="Zakaria Mujur Prasetyo | UI/UX & Frontend"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Meta Title (EN)</label>
                <input
                  type="text"
                  value={seo.metaTitleEn || ""}
                  onChange={(e) => updateSeo({ metaTitleEn: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="Zakaria Mujur Prasetyo | Portfolio"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Meta Description (ID)</label>
                <textarea
                  rows={3}
                  data-admin-field="seo.metaDesc"
                  value={seo.metaDesc || ""}
                  onChange={(e) => updateSeo({ metaDesc: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="Ringkasan profil untuk hasil pencarian Google..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Meta Description (EN)</label>
                <textarea
                  rows={3}
                  value={seo.metaDescEn || ""}
                  onChange={(e) => updateSeo({ metaDescEn: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="English meta description..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Canonical Site URL</label>
                <input
                  type="url"
                  data-admin-field="seo.canonicalUrl"
                  value={seo.canonicalUrl || ""}
                  onChange={(e) => updateSeo({ canonicalUrl: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="https://zakariamp.id"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Schema.org `jobTitle`</label>
                <input
                  type="text"
                  value={seo.personJobTitle || ""}
                  onChange={(e) => updateSeo({ personJobTitle: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="UI/UX Designer, Frontend Developer & Graphic Designer"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink">Kata Kunci SEO (`keywords`, pisah koma)</label>
                <input
                  type="text"
                  value={(seo.keywords || []).join(", ")}
                  onChange={(e) =>
                    updateSeo({
                      keywords: e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean),
                    })
                  }
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="Zakaria Mujur Prasetyo, ZekkTech, Frontend Developer, UI/UX Designer"
                />
              </div>

              <div data-admin-field="seo.ogImage">
                <MediaFieldControl
                  label="Gambar OpenGraph / Share Card (`og:image`, default `/opengraph-image`)"
                  value={seo.ogImage || ""}
                  onChange={(url) => updateSeo({ ogImage: url })}
                  folder="seo"
                  fieldKey="seo-og-img"
                  uploadAndSet={uploadAndSet}
                  uploadingImage={uploadingImage}
                  config={config}
                  accept="image/webp,image/png,image/jpeg"
                  placeholder="/opengraph-image"
                  previewShape="wide"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Alt Text Gambar OpenGraph</label>
                <input
                  type="text"
                  value={seo.ogImageAlt || ""}
                  onChange={(e) => updateSeo({ ogImageAlt: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="Zakaria Mujur Prasetyo - ZekkTech Portfolio"
                />
              </div>
            </div>
          </div>

          {/* ===================== Webmaster & IndexNow Verification ===================== */}
          <div className="rounded-2xl border border-line/70 bg-white/70 p-5 shadow-sm dark:border-line/40 dark:bg-slate-900/60">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-ink">Verifikasi Mesin Pencari &amp; IndexNow</h3>
              <p className="mt-0.5 text-xs text-muted">
                Integrasi token webmaster resmi untuk Google, Bing, Yandex, serta protokol notifikasi instan IndexNow.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink">
                  Google Search Console (Meta Verification Token)
                </label>
                <input
                  type="text"
                  value={seo.googleVerification || ""}
                  onChange={(e) => updateSeo({ googleVerification: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="Contoh: vW9kL... (isi token tanpa tag html)"
                  maxLength={128}
                />
                <p className="mt-1 text-[11px] text-muted">
                  Menghasilkan tag &lt;meta name=&quot;google-site-verification&quot; content=&quot;...&quot; /&gt; di HTML server.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Bing Webmaster Tools (Meta Verification Token: msvalidate.01)
                </label>
                <input
                  type="text"
                  value={seo.bingVerification || ""}
                  onChange={(e) => updateSeo({ bingVerification: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="Contoh: 1A2B3C4D5E6F... (32 karakter hex)"
                  maxLength={128}
                />
                <p className="mt-1 text-[11px] text-muted">
                  Menghasilkan tag &lt;meta name=&quot;msvalidate.01&quot; content=&quot;...&quot; /&gt;.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Yandex Webmaster (Meta Verification Token: yandex-verification)
                </label>
                <input
                  type="text"
                  value={seo.yandexVerification || ""}
                  onChange={(e) => updateSeo({ yandexVerification: e.target.value })}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="Contoh: yandex-verification token..."
                  maxLength={128}
                />
                <p className="mt-1 text-[11px] text-muted">
                  Menghasilkan tag &lt;meta name=&quot;yandex-verification&quot; content=&quot;...&quot; /&gt;.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink">
                    IndexNow API Key (Bing &amp; Yandex Instant Push)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                        .map((b) => b.toString(16).padStart(2, "0"))
                        .join("");
                      updateSeo({ indexNowKey: randomKey });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Generate Random Key
                  </button>
                </div>
                <input
                  type="text"
                  value={seo.indexNowKey || ""}
                  onChange={(e) => updateSeo({ indexNowKey: e.target.value })}
                  className={`mt-1.5 ${inputClass} font-mono`}
                  placeholder="32 karakter hex, contoh: c74384950e3b4a2e850b106366dbad2b"
                  maxLength={128}
                />
                <p className="mt-1 text-[11px] text-muted">
                  {seo.indexNowKey ? (
                    <>
                      Key file aktif di:{" "}
                      <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">
                        {`${serpHost}/${seo.indexNowKey}.txt`}
                      </code>
                    </>
                  ) : (
                    "Masukkan atau generate key untuk mengaktifkan berkas verifikasi /{key}.txt dan submit otomatis saat publikasi."
                  )}
                </p>
              </div>

              {/* Status Tautan Mesin Pencari */}
              <div className="mt-4 rounded-xl border border-line/40 bg-slate-50/60 p-3 text-xs dark:bg-slate-950/40">
                <span className="font-semibold text-ink">URL Sitemap &amp; Robots:</span>
                <div className="mt-1 flex flex-wrap gap-3">
                  <a
                    href={`${serpHost}/sitemap.xml`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <span>{`${serpHost}/sitemap.xml`}</span>
                    <ExternalLink className="size-3" />
                  </a>
                  <a
                    href={`${serpHost}/robots.txt`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <span>{`${serpHost}/robots.txt`}</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Live SERP Preview */}
          <div className="rounded-2xl border border-line/70 bg-white/70 p-5 shadow-sm dark:border-line/40 dark:bg-slate-900/60">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
              Simulasi Cuplikan Pencarian Google (SERP Preview)
            </h4>
            <div className="max-w-2xl rounded-xl border border-line/50 bg-slate-50 p-4 font-sans dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {config.generalProfile?.brand || "ZekkTech"}
                </span>
                <span>{serpHost}</span>
              </div>
              <div className="mt-1 text-base font-medium text-blue-700 dark:text-blue-400">
                {serpTitle}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                {serpDesc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
