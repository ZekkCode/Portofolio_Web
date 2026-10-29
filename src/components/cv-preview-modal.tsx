"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles, RotateCcw, FileText } from "lucide-react";
import { profile } from "@/lib/profile";
import { useSiteConfig } from "@/lib/site-store";
import PaperCrumple from "@/components/paper-crumple";

export type RoleKey = "all" | "graphic" | "uiux" | "frontend" | "itsupport";

export const ROLE_TO_PAGE_INDEX: Record<RoleKey, number> = {
  all: 0,
  graphic: 0,
  uiux: 1,
  frontend: 2,
  itsupport: 3,
};

export const PAGE_INDEX_TO_ROLE: Record<number, Exclude<RoleKey, "all">> = {
  0: "graphic",
  1: "uiux",
  2: "frontend",
  3: "itsupport",
};

export interface RoleDetail {
  key: RoleKey;
  title: string;
  badge: string;
  subtitle: string;
  color: string;
  textColor: string;
  bgLight: string;
  borderColor: string;
  desc: string;
  skills: string[];
  tools: string[];
  responsibilities: string[];
  keyProjects: { name: string; desc: string; url?: string }[];
}

export const ROLE_DETAILS: Record<Exclude<RoleKey, "all">, RoleDetail> = {
  graphic: {
    key: "graphic",
    title: "Desainer Grafis",
    badge: "Visual Arts & Branding",
    subtitle: "Multimedia & Visual Identity",
    color: "#0284c7",
    textColor: "text-sky-700",
    bgLight: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    desc: "Berpengalaman merancang identitas visual, branding brand/UMKM, materi publikasi sosial media, infografis, dan aset multimedia kreatif dengan prinsip estetika komunikasi visual.",
    skills: ["Branding & Logo Design", "Digital Illustration", "Social Media Content", "Print & Poster Design", "Typography & Color Theory", "Video Editing Basics"],
    tools: ["Adobe Photoshop", "Adobe Illustrator", "Figma", "CorelDRAW", "CapCut", "Filmora"],
    responsibilities: [
      "Merancang konsep visual kreatif dan konsisten untuk kebutuhan organisasi dan klien.",
      "Mengelola produksi media publikasi digital untuk event kampus dan komunitas.",
      "Menyusun pedoman identitas brand (color palette, typography, visual assets).",
    ],
    keyProjects: [
      { name: "Visual Identity HIMATIF UTM", desc: "Perancangan grafis event seminar, workshop, dan konten media sosial." },
      { name: "Infografis KOALISI Linux", desc: "Materi visual edukasi open source dan kesadaran keamanan digital." },
      { name: "Branding GDGoC UTM", desc: "Aset kreatif promosi kegiatan komunitas developer kampus." },
    ],
  },
  uiux: {
    key: "uiux",
    title: "UI/UX Designer",
    badge: "User Interface & Experience",
    subtitle: "Product Design & Prototyping",
    color: "#0284c7",
    textColor: "text-sky-600",
    bgLight: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    desc: "Mendesain antarmuka produk digital (web & mobile) yang berpusat pada pengguna (user-centered design), mulai dari wireframing, perancangan design system, hingga interactive prototype yang mudah digunakan.",
    skills: ["User Journey & Flow", "Wireframing & Lo-Fi", "High-Fidelity Prototyping", "Design System & Tokens", "Usability Heuristics", "Responsive Layout"],
    tools: ["Figma", "Adobe XD", "FigJam", "Whimsical", "Component Libraries"],
    responsibilities: [
      "Melakukan riset kebutuhan pengguna dan menerjemahkannya ke dalam user flow terstruktur.",
      "Membangun komponen UI yang konsisten dan reusable dengan auto-layout Figma.",
      "Menghubungkan desainer dengan developer agar implementasi kode selaras dengan desain.",
    ],
    keyProjects: [
      { name: "Trevio Hotel Booking System", desc: "UI aplikasi pemesanan kamar hotel multi-properti dengan verifikasi pembayaran.", url: "https://github.com/Buthzz/trevio-project" },
      { name: "SIGAP-Pangan", desc: "Antarmuka platform pelaporan dan peringatan rantai logistik pangan.", url: "https://github.com/ZekkCode/SIGAP-Pangan" },
      { name: "TOEL Online Test", desc: "UI simulasi ujian TOEFL web untuk mahasiswa dengan navigasi soal adaptif.", url: "https://github.com/ZekkCode/OnlineTest-TOEFL_DPW" },
    ],
  },
  frontend: {
    key: "frontend",
    title: "Frontend Developer",
    badge: "Modern Web Engineering",
    subtitle: "Next.js, React & 3D Interactive",
    color: "#1b45c4",
    textColor: "text-brand",
    bgLight: "bg-brand/10",
    borderColor: "border-brand/30",
    desc: "Mengembangkan aplikasi web modern yang cepat, interaktif, responsif, dan aksesibel. Menggabungkan Next.js App Router, React, Tailwind CSS, TypeScript, serta visual 3D WebGL / Three.js.",
    skills: ["Next.js (App Router, Turbopack)", "React 19 & Hooks", "TypeScript Strict Mode", "Tailwind CSS v4", "Three.js & WebGL Shaders", "State Management & Sync"],
    tools: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Three.js", "VS Code", "GitHub"],
    responsibilities: [
      "Mengembangkan arsitektur frontend modular berbasis komponen dan clean code.",
      "Mengoptimalkan performa web (Core Web Vitals), aksesibilitas, dan SEO teknis.",
      "Mengintegrasikan efek interaktif mutakhir (3D physics lanyard, canvas particle grid, card tilt).",
    ],
    keyProjects: [
      { name: "ZekkTech Portfolio 3D", desc: "Portofolio modern Next.js 16 + Tailwind v4 + Three.js Lanyard + React Bits Folder.", url: "https://github.com/ZekkCode" },
      { name: "Mesin Pencari TP/TF-IDF", desc: "Aplikasi Information Retrieval kalkulasi Cosine Similarity & TF-IDF.", url: "https://github.com/ZekkCode/information-retrieval" },
      { name: "ZEDD Download Manager", desc: "Alat utilitas download sinkronisasi eksternal.", url: "https://github.com/ZekkCode/ZEDD-Zekk-External-Downloader-Drive" },
    ],
  },
  itsupport: {
    key: "itsupport",
    title: "IT Support & Systems",
    badge: "Hardware, Linux & Automation",
    subtitle: "Troubleshooting & Infrastructure",
    color: "#d97706",
    textColor: "text-amber-600",
    bgLight: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    desc: "Mempunyai dasar kuat di bidang hardware, perakitan komputer (PC assembly), troubleshooting perangkat keras & lunak, instalasi dan administrasi sistem operasi Linux, serta otomasi bot.",
    skills: ["Hardware Assembly & Rakit PC", "OS Maintenance (Linux & Windows)", "Network Basics (LAN, IP, DNS)", "Telegram Bot API Automation", "CLI Scripting & yt-dlp", "Troubleshooting Perangkat Lab"],
    tools: ["Ubuntu / Debian Linux", "Windows OS", "Python", "Bash", "yt-dlp", "Hardware Diagnostic Tools"],
    responsibilities: [
      "Merakit dan menganalisis kompatibilitas spesifikasi PC sesuai kebutuhan komputasi.",
      "Melakukan diagnosis serta pemecahan masalah hardware, peripheral, dan jaringan.",
      "Mengembangkan skrip otomatisasi bot untuk mempercepat alur kerja digital.",
    ],
    keyProjects: [
      { name: "ZekkStore Telegram Bot", desc: "Bot otomatis transaksi produk digital berbasis Python & Telegram Bot API.", url: "https://github.com/ZekkCode/BotZekkStoreTelegram" },
      { name: "Network Capture Downloader", desc: "Tutorial dan skrip ekstraksi video streaming HLS (.m3u8) dengan yt-dlp.", url: "https://github.com/ZekkCode/Download-Video-Lewat-Network-Capture" },
      { name: "Linux Workstation Lab Setup", desc: "Konfigurasi lingkungan distro Linux open source untuk komunitas KOALISI." },
    ],
  },
};

interface CvPreviewModalProps {
  isOpen: boolean;
  initialRole?: RoleKey;
  onClose: () => void;
}

export function CvPreviewModal({ isOpen, initialRole = "all", onClose }: CvPreviewModalProps) {
  const { cvDocs } = useSiteConfig();
  const [activeRole, setActiveRole] = useState<RoleKey>(initialRole);
  const [prevInitialRole, setPrevInitialRole] = useState<RoleKey>(initialRole);
  const [currentPage, setCurrentPage] = useState(() => ROLE_TO_PAGE_INDEX[initialRole] ?? 0);
  const [zoom, setZoom] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [modalMode, setModalMode] = useState<"doc" | "crumple">("doc");
  const [crumpleResetKey, setCrumpleResetKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (initialRole !== prevInitialRole) {
    setPrevInitialRole(initialRole);
    setActiveRole(initialRole);
    setCurrentPage(ROLE_TO_PAGE_INDEX[initialRole] ?? 0);
    setModalMode("doc");
  }

  // Active role mapped from current page index
  const pageRole = PAGE_INDEX_TO_ROLE[currentPage] || "frontend";
  const effectiveKey: Exclude<RoleKey, "all"> = activeRole === "all" ? pageRole : activeRole;
  const currentDoc = cvDocs.find((d) => d.roleKey === effectiveKey);
  const currentDetail = ROLE_DETAILS[effectiveKey];

  const pagesList = currentDoc?.pages && currentDoc.pages.length > 0
    ? currentDoc.pages
    : ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"];

  const totalPages = pagesList.length;
  const paperWidth = isMobile ? 300 : 420;
  const paperHeight = isMobile ? 424 : 594;
  const sceneHeight = isMobile ? 520 : 660;

  const prevPage = () => {
    setCurrentPage((p) => {
      const next = Math.max(0, p - 1);
      setActiveRole(PAGE_INDEX_TO_ROLE[next] || "frontend");
      return next;
    });
  };

  const nextPage = () => {
    setCurrentPage((p) => {
      const next = Math.min(totalPages - 1, p + 1);
      setActiveRole(PAGE_INDEX_TO_ROLE[next] || "frontend");
      return next;
    });
  };

  const goToPage = (pageIdx: number) => {
    setCurrentPage(pageIdx);
    setActiveRole(PAGE_INDEX_TO_ROLE[pageIdx] || "frontend");
  };

  // Keyboard navigation & Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setCurrentPage((p) => Math.max(0, p - 1));
      else if (e.key === "ArrowRight") setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, totalPages]);

  // Reset page when role changes
  const switchRole = (role: RoleKey) => {
    setActiveRole(role);
    setCurrentPage(0);
  };

  // Touch Swipe Handlers for mobile & trackpad
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setTouchDeltaX(e.targetTouches[0].clientX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchDeltaX < -45) {
      nextPage();
    } else if (touchDeltaX > 45) {
      prevPage();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Shell */}
      <div className="relative flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl dark:border-line/60 dark:bg-[#0c0e17]">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-line/40 dark:bg-[#0c0e17]/95">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-1 rounded-full"
              style={{ backgroundColor: currentDoc?.color || currentDetail.color }}
              aria-hidden="true"
            />
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-body uppercase">
                Berkas Karir ATS
              </p>
              <h2 id="cv-modal-title" className="text-sm font-bold text-ink sm:text-base">
                {profile.name} — <span style={{ color: currentDoc?.color || currentDetail.color }}>{currentDoc?.title || currentDetail.title}</span>
              </h2>
            </div>
          </div>

          {/* Navigation Controls: Slide pages, Zoom, Print/Download, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Toggle: Dokumen vs Kertas Remas 3D */}
            <div className="flex rounded-full border border-line bg-slate-100/90 p-0.5 text-xs dark:border-line/50 dark:bg-slate-900/90">
              <button
                type="button"
                onClick={() => setModalMode("doc")}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  modalMode === "doc"
                    ? "bg-white text-ink shadow-2xs dark:bg-[#191e32] dark:text-white"
                    : "text-body hover:text-ink"
                }`}
              >
                Dokumen
              </button>
              <button
                type="button"
                onClick={() => setModalMode("crumple")}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  modalMode === "crumple"
                    ? "bg-white text-ink shadow-2xs dark:bg-[#191e32] dark:text-white"
                    : "text-body hover:text-ink"
                }`}
              >
                <Sparkles className="size-3 text-brand" />
                <span>Remas 3D</span>
              </button>
            </div>

            {/* Page Slider Controls (Active when multi-page) */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 rounded-full border border-line bg-slate-100/90 px-2 py-1 text-xs dark:border-line/50 dark:bg-slate-900/90">
                <button
                  type="button"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="rounded-full p-1 text-body transition hover:bg-white hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="font-mono text-[11px] font-semibold text-ink px-1.5">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={nextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="rounded-full p-1 text-body transition hover:bg-white hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-xs dark:border-line/50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))}
                className="rounded px-1.5 py-0.5 text-body hover:text-ink font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                title="Perkecil (-)"
                aria-label="Perkecil tampilan dokumen"
              >
                -
              </button>
              <span className="font-mono text-[10px] text-body">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                className="rounded px-1.5 py-0.5 text-body hover:text-ink font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                title="Perbesar (+)"
                aria-label="Perbesar tampilan dokumen"
              >
                +
              </button>
            </div>

            {/* Download PDF ATS Button */}
            <a
              href={currentDoc?.pdfUrl || "/cv-ats-zakariamp-2025.pdf"}
              download="CV-ATS-ZakariaMP-2025.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <FileText className="size-3.5" />
              <span>Unduh PDF ATS</span>
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 sm:size-9 items-center justify-center rounded-full border border-line bg-white text-body transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/40 dark:bg-slate-900"
              aria-label="Tutup modal"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Role & Page Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-line bg-slate-50/70 px-4 py-2 sm:px-6 no-scrollbar gap-1.5 dark:border-line/40 dark:bg-[#141824]">
          {[
            { key: "graphic" as RoleKey, page: 0, label: "Hal 1 • Profil & Grafis" },
            { key: "uiux" as RoleKey, page: 1, label: "Hal 2 • UI/UX & Edu" },
            { key: "frontend" as RoleKey, page: 2, label: "Hal 3 • Frontend Dev" },
            { key: "itsupport" as RoleKey, page: 3, label: "Hal 4 • IT Support" },
          ].map((tab) => {
            const isSelected = currentPage === tab.page;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => goToPage(tab.page)}
                className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isSelected
                    ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                    : "border border-line bg-white/80 text-body hover:border-brand/40 hover:text-ink dark:border-line/50 dark:bg-[#191e32]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Center Stage: Document Slider Area */}
        <div
          className="relative flex-1 overflow-auto bg-slate-100/90 p-4 sm:p-6 lg:p-8 dark:bg-[#07080d]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Floating Slider Chevron Arrows (Desktop / Tablet) */}
          {totalPages > 1 && (
            <>
              <button
                type="button"
                onClick={prevPage}
                disabled={currentPage === 0}
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 hidden md:flex size-10 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none dark:border-line/50 dark:bg-[#191e32]"
                aria-label="Halaman sebelumnya"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1}
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 hidden md:flex size-10 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none dark:border-line/50 dark:bg-[#191e32]"
                aria-label="Halaman berikutnya"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {/* 3D Paper Crumple Physics Stage (Spacious, No Constraining Div) */}
          {modalMode === "crumple" ? (
            <div className="mx-auto flex h-full w-full flex-col items-center justify-center py-2">
              <div className="mb-2 flex items-center justify-between w-full max-w-lg px-3 text-xs text-body">
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  <Sparkles className="size-3.5 text-brand" />
                  <span>Simulasi Fisik 3D • Halaman {currentPage + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-[11px] text-muted">Tahan & geser untuk meremas</span>
                  <button
                    type="button"
                    onClick={() => setCrumpleResetKey((k) => k + 1)}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-semibold text-body hover:border-brand/40 hover:text-ink dark:border-line/50 dark:bg-[#191e32]"
                    title="Ratakan Lembar Kertas"
                  >
                    <RotateCcw className="size-3" />
                    <span>Ratakan</span>
                  </button>
                </div>
              </div>

              {/* Seamless Full-Bleed 3D Paper Stage */}
              <div className="relative flex items-center justify-center w-full select-none">
                <PaperCrumple
                  src={pagesList[currentPage]}
                  alt={`Curriculum Vitae Halaman ${currentPage + 1}`}
                  width={paperWidth}
                  height={paperHeight}
                  sceneHeight={sceneHeight}
                  releaseBehavior="restore"
                  crumpleAmount={0.85}
                  crumpleDuration={0.55}
                  releaseDuration={0.4}
                  foldCount={6}
                  foldSharpness={0.6}
                  wrinkleDepth={0.65}
                  creaseStrength={0.18}
                  paperColor="#f8fafc"
                  paperTexture={0.08}
                  draggable
                  returnToOrigin
                  resetKey={crumpleResetKey}
                />
              </div>

              <p className="mt-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Pencet untuk melihat bersih • Tahan & geser kursor / sentuhan untuk meremas kertas
              </p>
            </div>
          ) : currentDoc?.pdfUrl && !currentDoc.pages?.length ? (
            <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center">
              <iframe
                src={currentDoc.pdfUrl}
                className="h-full min-h-[580px] w-full rounded-2xl border border-line bg-white shadow-xl"
                title={currentDoc.title}
              />
            </div>
          ) : (
            /* Multi-Page Slide Track ("bisa digeser kalau halaman lebih dari satu") */
            <div className="mx-auto flex justify-center">
              <div
                className="relative w-full max-w-3xl transition-transform duration-300 ease-out"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                }}
              >
                {/* Pages Horizontal Slider */}
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{
                      transform: `translateX(-${currentPage * 100}%)`,
                    }}
                  >
                    {pagesList.map((pageImg, idx) => (
                      <div key={idx} className="w-full shrink-0 flex justify-center p-2">
                        <div className="relative aspect-[1/1.414] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pageImg}
                            alt={`Halaman ${idx + 1}`}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Pagination & Navigation Strip */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/80 bg-white/95 px-4 py-2.5 sm:px-6 dark:border-line/40 dark:bg-[#0c0e17]/95">
            <div className="flex items-center gap-2">
              <span className="text-xs text-body">Geser layar atau gunakan tombol:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(idx)}
                    className={`h-2 rounded-full transition-all ${
                      currentPage === idx
                        ? "w-6 bg-brand"
                        : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700"
                    }`}
                    title={`Ke Halaman ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevPage}
                disabled={currentPage === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-body hover:border-brand/40 hover:text-ink disabled:opacity-30 dark:border-line/40 dark:bg-slate-900"
              >
                <ChevronLeft className="size-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-body hover:border-brand/40 hover:text-ink disabled:opacity-30 dark:border-line/40 dark:bg-slate-900"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CvPreviewModal;
