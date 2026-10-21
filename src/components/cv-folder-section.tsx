"use client";

import { useState } from "react";
import Folder, { type FolderEntry } from "@/components/folder";
import { CvPreviewModal, type RoleKey, ROLE_DETAILS } from "@/components/cv-preview-modal";
import { Parallax } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";

interface RoleCardProps {
  roleKey: Exclude<RoleKey, "all">;
  onOpen: () => void;
}

function RoleCvPaper({ roleKey, onOpen }: RoleCardProps) {
  const detail = ROLE_DETAILS[roleKey];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className="relative flex h-full w-full flex-col justify-between overflow-hidden p-3 text-left select-none transition-colors border border-slate-200/70"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)",
      }}
    >
      {/* Top Accent Stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: detail.color }}
      />

      {/* Header Info */}
      <div className="pt-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-slate-500">
            Curriculum Vitae
          </span>
          <span
            className="rounded px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: detail.color }}
          >
            {detail.title}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white font-black text-xs"
            style={{ backgroundColor: detail.color }}
          >
            {detail.title.charAt(0)}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 leading-tight text-xs truncate">
              Zakaria Mujur P.
            </h4>
            <p className="text-xs font-medium text-slate-500 truncate">
              {detail.subtitle}
            </p>
          </div>
        </div>

        {/* Mini simulated CV separator */}
        <div className="my-2 h-px w-full bg-slate-200/80" />

        {/* Skill tags */}
        <div className="flex flex-wrap gap-1">
          {detail.tools.slice(0, 3).map((tool) => (
            <span
              key={tool}
              className="rounded bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-xs font-medium text-slate-700 leading-none"
            >
              {tool}
            </span>
          ))}
        </div>

        {/* Mini highlight bullet */}
        <p className="mt-2 text-xs leading-snug text-slate-600 line-clamp-3">
          {detail.desc}
        </p>
      </div>

      {/* Footer Callout */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          zekktech.biz.id
        </span>
        <span
          className="inline-flex items-center gap-0.5 text-xs font-semibold hover:underline"
          style={{ color: detail.color }}
        >
          Lihat Profil →
        </span>
      </div>
    </div>
  );
}

export function CvFolderSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("all");
  const [folderMode, setFolderMode] = useState<"flap" | "book">("flap");
  const [folderVariant, setFolderVariant] = useState<"solid" | "glass">("glass");

  const openPreview = (role: RoleKey) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  const roleKeys: Exclude<RoleKey, "all">[] = ["graphic", "uiux", "frontend", "itsupport"];

  const folderItems: FolderEntry[] = roleKeys.map((key) => ({
    content: <RoleCvPaper roleKey={key} onOpen={() => openPreview(key)} />,
  }));

  return (
    <section id="cv" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <SectionTitle
        title="Berkas Karir & Kurikulum Vitae"
        desc="Empat lembar rekam jejak teknis: Desain Grafis, UI/UX, Frontend Development, dan Dukungan Sistem IT. Tarik dokumen atau pilih tombol untuk pratinjau data lengkap."
      />

      {/* Main Interactive Stage Box */}
      <div className="relative mt-8 overflow-hidden rounded-3xl border border-line bg-white/95 p-6 sm:p-10 backdrop-blur-sm">
        {/* Decorative Grid Lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#0a0a14 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden="true"
        />

        {/* Top Controls Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <p className="text-xs font-semibold text-ink">
              Folder Berkas CV Interaktif
            </p>
            <span className="hidden sm:inline text-xs text-body">• Tarik, buka flap, atau klik lembar CV</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switch: Flap vs Book */}
            <div className="flex rounded-full border border-line bg-white p-0.5 text-xs font-medium text-body">
              <button
                type="button"
                onClick={() => setFolderMode("flap")}
                className={`rounded-full px-2.5 py-1 text-xs transition ${
                  folderMode === "flap"
                    ? "bg-brand text-white font-semibold shadow-xs"
                    : "hover:text-ink"
                }`}
              >
                Flap
              </button>
              <button
                type="button"
                onClick={() => setFolderMode("book")}
                className={`rounded-full px-2.5 py-1 text-xs transition ${
                  folderMode === "book"
                    ? "bg-brand text-white font-semibold shadow-xs"
                    : "hover:text-ink"
                }`}
              >
                Buku
              </button>
            </div>

            {/* Variant Switch: Glass vs Solid */}
            <div className="flex rounded-full border border-line bg-white p-0.5 text-xs font-medium text-body">
              <button
                type="button"
                onClick={() => setFolderVariant("glass")}
                className={`rounded-full px-2.5 py-1 text-xs transition ${
                  folderVariant === "glass"
                    ? "bg-brand text-white font-semibold shadow-xs"
                    : "hover:text-ink"
                }`}
              >
                Kaca
              </button>
              <button
                type="button"
                onClick={() => setFolderVariant("solid")}
                className={`rounded-full px-2.5 py-1 text-xs transition ${
                  folderVariant === "solid"
                    ? "bg-brand text-white font-semibold shadow-xs"
                    : "hover:text-ink"
                }`}
              >
                Solid
              </button>
            </div>

            {/* Direct Open Button */}
            <button
              type="button"
              onClick={() => openPreview("all")}
              className="rounded-full bg-ink px-3.5 py-1 text-xs font-semibold text-white transition hover:bg-black"
            >
              Buka Semua CV →
            </button>
          </div>
        </div>
        {/* Center 3D Folder Container */}
        <Parallax speed={-0.03}>
          <div className="relative z-10 flex min-h-[340px] sm:min-h-[390px] items-center justify-center pt-8 pb-14">
            <Folder
              label="CV / Zekk"
              color="#1b45c4"
              mode={folderMode}
              variant={folderVariant}
              defaultOpen={true}
              size={1.25}
              items={folderItems}
              paperColor="#ffffff"
              tabPosition="right"
              layout="spread"
              openOn="click"
              draggable={true}
              zoomOnClick={true}
              peek={true}
              intro={true}
              tilt={0.6}
              bounce={0.35}
              speed={1}
              frost={0.3}
              theme="dark"
              onItemClick={(_item, index) => {
                const key = roleKeys[index] ?? "all";
                openPreview(key);
              }}
            />
          </div>
        </Parallax>

        {/* Bottom Role Quick-Access Badges */}
        <div className="relative z-10 mt-2 border-t border-line/70 pt-5">
          <p className="text-center text-sm font-medium text-body mb-3">
            Atau pilih langsung per bidang untuk pratinjau:
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {roleKeys.map((key) => {
              const detail = ROLE_DETAILS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openPreview(key)}
                  className="group flex flex-col rounded-2xl border border-line bg-white/90 p-3.5 text-left transition duration-200 hover:-translate-y-1 hover:border-brand/40 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex size-7 items-center justify-center rounded-lg text-white font-black text-xs"
                      style={{ backgroundColor: detail.color }}
                    >
                      {detail.title.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-brand transition-colors">
                      Lihat CV →
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-ink">{detail.title}</h4>
                  <p className="mt-0.5 text-xs text-body line-clamp-1">{detail.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CV Preview Modal */}
      <CvPreviewModal
        isOpen={modalOpen}
        initialRole={selectedRole}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}

export default CvFolderSection;
