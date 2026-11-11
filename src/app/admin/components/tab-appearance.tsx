"use client";

import { useState } from "react";
import Lanyard from "@/components/lanyard";
import ProfileCard from "@/components/profile-card";
import type { SiteConfig, LanyardConfig, ProfileCardConfig } from "@/lib/site-store";
import { Upload, Sparkles, Layers, Sliders, Eye } from "lucide-react";

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
    title: "Tekstur & Gambar Kartu",
    fields: [
      {
        key: "frontImage",
        label: "Gambar depan",
        kind: "image",
        hint: "Rasio kartu ≈ 0.71 (mis. 640×900). PNG/JPG otomatis dikonversi ke WebP.",
      },
      {
        key: "backImage",
        label: "Gambar belakang",
        kind: "image",
        hint: "Kosong = pakai gambar depan. PNG/JPG otomatis dikonversi ke WebP.",
      },
      {
        key: "strapImage",
        label: "Gambar tali",
        kind: "image",
        hint: "Gambar lebar, diulang sepanjang tali. PNG/JPG otomatis dikonversi ke WebP.",
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
      { key: "cornerRadius", label: "Corner radius", kind: "range", min: 0.05, max: 0.8, step: 0.01 },
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
}: TabAppearanceProps) {
  const [subTab, setSubTab] = useState<"lanyard" | "profileCard">("lanyard");

  const updateLanyard = <K extends keyof LanyardConfig>(key: K, value: LanyardConfig[K]) => {
    setDraft({ ...config, lanyard: { ...config.lanyard, [key]: value } });
    setStatus("Draft Lanyard 3D diubah");
  };

  const updateProfileCard = <K extends keyof ProfileCardConfig>(key: K, value: ProfileCardConfig[K]) => {
    setDraft({ ...config, profileCard: { ...config.profileCard, [key]: value } });
    setStatus("Draft Profile Card diubah");
  };

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
          Hologram Profile Card (Hero)
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
                        <div className="flex items-center justify-between text-xs text-ink font-medium">
                          <label htmlFor={`field-${field.key}`}>{field.label}</label>
                          {field.kind === "range" && (
                            <span className="font-mono text-xs text-brand font-bold">
                              {typeof value === "number" ? value.toFixed(2) : String(value)}
                            </span>
                          )}
                        </div>

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
                          <div className="mt-1.5 space-y-2">
                            <input
                              id={`field-${field.key}`}
                              type="text"
                              value={String(value ?? "")}
                              onChange={(e) => updateLanyard(field.key, e.target.value as never)}
                              placeholder="https://... atau path WebP"
                              className={inputClass}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:bg-surface dark:border-line/40 dark:bg-slate-800 transition">
                                <Upload className="size-3.5 text-brand" />
                                <span>{uploadingImage === field.key ? "Memproses..." : "Unggah WebP"}</span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      void uploadAndSet(
                                        file,
                                        "lanyard",
                                        (url) => updateLanyard(field.key, url as never),
                                        field.key
                                      );
                                    }
                                  }}
                                />
                              </label>
                              {value && (
                                <button
                                  type="button"
                                  onClick={() => updateLanyard(field.key, "" as never)}
                                  className="rounded-xl px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                            {field.hint && <p className="text-[11px] text-muted">{field.hint}</p>}
                          </div>
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
            <div className="mt-3 aspect-square w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950">
              <Lanyard
                {...config.lanyard}
                frontImage={config.lanyard.frontImage || undefined}
                backImage={config.lanyard.backImage || undefined}
                strapImage={config.lanyard.strapImage || undefined}
              />
            </div>
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Foto & Aset Profile Card</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold text-muted">Foto Avatar Profil</label>
                  <input
                    type="text"
                    value={config.profileCard.avatarUrl}
                    onChange={(e) => updateProfileCard("avatarUrl", e.target.value)}
                    placeholder="/profile.webp atau URL Cloud"
                    className={inputClass}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:bg-surface dark:border-line/40 dark:bg-slate-800 transition">
                      <Upload className="size-3.5 text-brand" />
                      <span>{uploadingImage === "avatarUrl" ? "Memproses..." : "Unggah Avatar (WebP)"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void uploadAndSet(
                              file,
                              "profile",
                              (url) => updateProfileCard("avatarUrl", url),
                              "avatarUrl"
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Efek Hologram & Interaksi 3D</h3>
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
            <div className="mt-3 flex items-center justify-center p-4">
              <ProfileCard {...config.profileCard} />
            </div>
            <p className="mt-2 text-center text-[11px] text-muted">
              Gerakkan kursor di atas kartu untuk melihat efek glare hologram dan 3D tilt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
