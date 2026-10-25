"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { profile } from "@/lib/profile";
import { useSiteConfig } from "@/lib/site-store";

export type RoleKey = "all" | "graphic" | "uiux" | "frontend" | "itsupport";

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
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);

  if (initialRole !== prevInitialRole) {
    setPrevInitialRole(initialRole);
    setActiveRole(initialRole);
    setCurrentPage(0);
  }

  // Handle active doc info
  const effectiveKey: Exclude<RoleKey, "all"> = activeRole === "all" ? "frontend" : activeRole;
  const currentDoc = cvDocs.find((d) => d.roleKey === effectiveKey);
  const currentDetail = ROLE_DETAILS[effectiveKey];

  // Number of pages
  const totalPages = currentDoc?.pages && currentDoc.pages.length > 0
    ? currentDoc.pages.length
    : (currentDoc?.pageCount || 2);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  // Keyboard navigation & Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prevPage();
      else if (e.key === "ArrowRight") nextPage();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, prevPage, nextPage]);

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
      <div className="relative flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl dark:border-line/60 dark:bg-[#0c0e17]">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-line/40 dark:bg-[#0c0e17]/95">
          <div className="flex items-center gap-2.5">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: currentDoc?.color || currentDetail.color }}
              aria-hidden="true"
            />
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-body uppercase">
                Berkas CV • zekktech.biz.id
              </p>
              <h2 id="cv-modal-title" className="text-sm font-bold text-ink sm:text-base">
                {profile.name} — <span style={{ color: currentDoc?.color || currentDetail.color }}>{currentDoc?.title || currentDetail.title}</span>
              </h2>
            </div>
          </div>

          {/* Navigation Controls: Slide pages, Zoom, Print/Download, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Page Slider Controls (Active when multi-page) */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 rounded-full border border-line bg-slate-100/90 px-2 py-1 text-xs dark:border-line/50 dark:bg-slate-900/90">
                <button
                  type="button"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="rounded-full p-1 text-body transition hover:bg-white hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Halaman Sebelumnya (←)"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="font-mono text-[11px] font-semibold text-ink px-1.5">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={nextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="rounded-full p-1 text-body transition hover:bg-white hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Halaman Berikutnya (→)"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-xs dark:border-line/50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))}
                className="rounded px-1.5 py-0.5 text-body hover:text-ink font-bold"
                title="Perkecil (-)"
              >
                -
              </button>
              <span className="font-mono text-[10px] text-body">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                className="rounded px-1.5 py-0.5 text-body hover:text-ink font-bold"
                title="Perbesar (+)"
              >
                +
              </button>
            </div>

            {/* Print / Download Button */}
            {currentDoc?.pdfUrl ? (
              <a
                href={currentDoc.pdfUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-brand-ink"
              >
                Unduh PDF
              </a>
            ) : (
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-body transition hover:border-ink/40 hover:text-ink sm:inline-flex items-center gap-1.5 dark:border-line/40 dark:bg-slate-900"
                title="Cetak / PDF"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Cetak / PDF
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 sm:size-9 items-center justify-center rounded-full border border-line bg-white text-body transition hover:bg-slate-100 hover:text-ink dark:border-line/40 dark:bg-slate-900"
              aria-label="Tutup modal"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-line bg-slate-50/70 px-4 py-2 sm:px-6 no-scrollbar gap-1.5 dark:border-line/40 dark:bg-[#141824]">
          {(["all", "frontend", "uiux", "graphic", "itsupport"] as RoleKey[]).map((key) => {
            const isAll = key === "all";
            const roleDetail = !isAll ? ROLE_DETAILS[key] : null;
            const doc = !isAll ? cvDocs.find((d) => d.roleKey === key) : null;
            const title = isAll ? "Semua Berkas" : (doc?.title || roleDetail?.title || key);
            const isSelected = activeRole === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => switchRole(key)}
                className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition ${
                  isSelected
                    ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                    : "border border-line bg-white/80 text-body hover:border-brand/40 hover:text-ink dark:border-line/50 dark:bg-[#191e32]"
                }`}
              >
                {title}
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

          {/* If custom PDF URL is provided, show embedded PDF */}
          {currentDoc?.pdfUrl && !currentDoc.pages?.length ? (
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
                    {/* Render custom uploaded pages OR high-fidelity clean demo CV pages */}
                    {currentDoc?.pages && currentDoc.pages.length > 0 ? (
                      currentDoc.pages.map((pageImg, idx) => (
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
                      ))
                    ) : (
                      /* Demo Pages: Page 1, Page 2, (Page 3) */
                      [
                        // --- HALAMAN 1: IDENTITAS & KOMPETENSI INTI ---
                        <div key="page-1" className="w-full shrink-0 flex justify-center p-1 sm:p-2">
                          <article
                            className="relative aspect-[1/1.414] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-2xl text-slate-900 select-text flex flex-col justify-between"
                            style={{
                              background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
                            }}
                          >
                            {/* Document Accent Top Bar */}
                            <div
                              className="absolute top-0 left-0 right-0 h-2"
                              style={{ backgroundColor: currentDoc?.color || currentDetail.color }}
                            />

                            <div>
                              {/* Header Dokumen CV */}
                              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
                                <div>
                                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                                    {profile.name}
                                  </h1>
                                  <p
                                    className="mt-1 text-sm sm:text-base font-bold"
                                    style={{ color: currentDoc?.color || currentDetail.color }}
                                  >
                                    {currentDoc?.title || currentDetail.title} • {currentDoc?.subtitle || currentDetail.subtitle}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {profile.location} · Mahasiswa S1 Teknik Informatika (2024–Sekarang) · Freelancer sejak 2020
                                  </p>
                                </div>
                                <div className="text-right text-xs text-slate-600 space-y-1">
                                  <p className="font-semibold">{profile.contact.email}</p>
                                  <p className="font-medium">{profile.contact.whatsapp}</p>
                                  <p className="font-mono text-[11px] text-slate-400">zekktech.biz.id</p>
                                </div>
                              </div>

                              {/* Ringkasan Eksekutif & Filosofi */}
                              <div className="mt-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Ringkasan Profesional
                                </h3>
                                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-700">
                                  {currentDetail.desc}
                                </p>
                              </div>

                              {/* Keahlian Utama & Tools */}
                              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div>
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Keahlian Kunci
                                  </h3>
                                  <ul className="mt-2 space-y-1 text-xs text-slate-700">
                                    {currentDetail.skills.map((s) => (
                                      <li key={s} className="flex items-center gap-1.5">
                                        <span className="size-1 rounded-full bg-slate-400" />
                                        <span>{s}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Perangkat & Stack
                                  </h3>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {currentDetail.tools.map((t) => (
                                      <span
                                        key={t}
                                        className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-800"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Tanggung Jawab & Kontribusi */}
                              <div className="mt-5 border-t border-slate-100 pt-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Tanggung Jawab Lapangan
                                </h3>
                                <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                                  {currentDetail.responsibilities.map((r) => (
                                    <li key={r} className="flex items-start gap-2">
                                      <span className="font-bold text-slate-400">•</span>
                                      <span>{r}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Document Footer Page 1 */}
                            <div className="mt-6 border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                              <span>Curriculum Vitae — {profile.name}</span>
                              <span className="font-mono font-semibold">Halaman 1 dari {totalPages}</span>
                            </div>
                          </article>
                        </div>,

                        // --- HALAMAN 2: PENGALAMAN KERJA & PORTOFOLIO ---
                        <div key="page-2" className="w-full shrink-0 flex justify-center p-1 sm:p-2">
                          <article
                            className="relative aspect-[1/1.414] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-2xl text-slate-900 select-text flex flex-col justify-between"
                            style={{
                              background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
                            }}
                          >
                            {/* Document Accent Top Bar */}
                            <div
                              className="absolute top-0 left-0 right-0 h-2"
                              style={{ backgroundColor: currentDoc?.color || currentDetail.color }}
                            />

                            <div>
                              <div className="border-b border-slate-200 pb-3">
                                <h2 className="font-display text-lg font-bold text-slate-950">
                                  Rekam Jejak Lapangan & Portofolio Proyek
                                </h2>
                                <p className="text-xs text-slate-500">
                                  Pengalaman profesional, kontribusi organisasi, dan studi kasus sistem nyata.
                                </p>
                              </div>

                              {/* Portofolio Proyek Terpilih */}
                              <div className="mt-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Proyek Terpilih Sesuai Spesialisasi
                                </h3>
                                <div className="mt-2.5 space-y-2.5">
                                  {currentDetail.keyProjects.map((p) => (
                                    <div key={p.name} className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 text-xs">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-slate-900">{p.name}</h4>
                                        {p.url && (
                                          <a
                                            href={p.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] font-semibold text-brand hover:underline"
                                          >
                                            GitHub Repo →
                                          </a>
                                        )}
                                      </div>
                                      <p className="mt-1 text-slate-600 leading-relaxed text-[11px] sm:text-xs">{p.desc}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Riwayat Pengalaman Kerja */}
                              <div className="mt-5 border-t border-slate-100 pt-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Riwayat Kerja & Kepemimpinan
                                </h3>
                                <div className="mt-2.5 space-y-3">
                                  {profile.experience.slice(0, 3).map((exp) => (
                                    <div key={exp.org} className="border-l-2 border-slate-200 pl-3">
                                      <div className="flex items-center justify-between">
                                        <p className="font-bold text-xs text-slate-900">{exp.role}</p>
                                        <span className="text-[10px] font-mono text-slate-500">{exp.period}</span>
                                      </div>
                                      <p className="text-[11px] font-medium text-slate-600">{exp.org} • {exp.place}</p>
                                      <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{exp.desc}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Pendidikan Formal */}
                              <div className="mt-5 border-t border-slate-100 pt-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Pendidikan Formal
                                </h3>
                                <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="font-bold text-slate-900">S1 Teknik Informatika</p>
                                    <p className="text-slate-600">Universitas Trunojoyo Madura</p>
                                    <p className="text-[10px] text-slate-400">2024 - Sekarang</p>
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">SMK Jurusan Multimedia</p>
                                    <p className="text-slate-600">Lulusan 2024</p>
                                    <p className="text-[10px] text-slate-400">Grafis, Animasi, Video, Hardware</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Document Footer Page 2 */}
                            <div className="mt-6 border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                              <span>Curriculum Vitae — {profile.name}</span>
                              <span className="font-mono font-semibold">Halaman 2 dari {totalPages}</span>
                            </div>
                          </article>
                        </div>,

                        // --- HALAMAN 3 (JIKA 3 HALAMAN): SERTIFIKASI & PRESTASI ---
                        totalPages >= 3 && (
                          <div key="page-3" className="w-full shrink-0 flex justify-center p-1 sm:p-2">
                            <article
                              className="relative aspect-[1/1.414] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-2xl text-slate-900 select-text flex flex-col justify-between"
                              style={{
                                background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
                              }}
                            >
                              {/* Document Accent Top Bar */}
                              <div
                                className="absolute top-0 left-0 right-0 h-2"
                                style={{ backgroundColor: currentDoc?.color || currentDetail.color }}
                              />

                              <div>
                                <div className="border-b border-slate-200 pb-3">
                                  <h2 className="font-display text-lg font-bold text-slate-950">
                                    Lampiran Sertifikasi & Dokumen Kompetensi
                                  </h2>
                                  <p className="text-xs text-slate-500">
                                    Total 29 sertifikat terverifikasi di bidang rekayasa web, visual digital, dan administrasi sistem.
                                  </p>
                                </div>

                                <div className="mt-4 space-y-3">
                                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h4 className="text-xs font-bold text-slate-900">29 Sertifikat Pelatihan & Keikutsertaan</h4>
                                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                                      Meliputi pelatihan web development modern, UI/UX design thinking, seminar open source Linux,
                                      dan workshop keahlian jaringan dasar.
                                    </p>
                                  </div>

                                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h4 className="text-xs font-bold text-slate-900">Verifikasi Berkas Asli</h4>
                                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                                      Dokumen lengkap sertifikat, transkrip nilai, dan surat rekomendasi dapat diakses melalui portal blog resmi:
                                    </p>
                                    <a
                                      href="https://zekktech.biz.id"
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                                    >
                                      https://zekktech.biz.id →
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Document Footer Page 3 */}
                              <div className="mt-6 border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                                <span>Curriculum Vitae — {profile.name}</span>
                                <span className="font-mono font-semibold">Halaman 3 dari {totalPages}</span>
                              </div>
                            </article>
                          </div>
                        ),
                      ].filter(Boolean)
                    )}
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
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-body hover:border-brand/40 hover:text-ink disabled:opacity-30 dark:border-line/40 dark:bg-slate-900"
              >
                ← Sebelumnya
              </button>
              <button
                type="button"
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-body hover:border-brand/40 hover:text-ink disabled:opacity-30 dark:border-line/40 dark:bg-slate-900"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CvPreviewModal;
