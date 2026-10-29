"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, FileText, RotateCcw, X } from "lucide-react";
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
    desc: "Berpengalaman merancang identitas visual, branding UMKM, materi publikasi sosial media, infografis, dan aset multimedia kreatif.",
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
    desc: "Mendesain antarmuka produk digital (web & mobile) yang berpusat pada pengguna, mulai dari user journey, design system, hingga interactive prototype.",
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
    desc: "Mengembangkan aplikasi web modern yang cepat, interaktif, responsif, dan aksesibel dengan Next.js App Router, React, TypeScript, dan Three.js.",
    skills: ["Next.js (App Router, Turbopack)", "React 19 & Hooks", "TypeScript Strict Mode", "Tailwind CSS v4", "Three.js & WebGL Shaders", "State Management & Sync"],
    tools: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Three.js", "VS Code", "GitHub"],
    responsibilities: [
      "Mengembangkan arsitektur frontend modular berbasis komponen dan clean code.",
      "Mengoptimalkan performa web (Core Web Vitals), aksesibilitas, dan SEO teknis.",
      "Mengintegrasikan interaksi visual mutakhir (3D physics lanyard, paper crumple, fluid gestures).",
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
    desc: "Memiliki keahlian di bidang perakitan hardware PC, instalasi dan administrasi sistem operasi Linux, troubleshooting jaringan, serta otomasi bot.",
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
  const [crumpleResetKey, setCrumpleResetKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [hasWebGL] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const openerRef = useRef<HTMLElement | null>(null);

  // Deteksi ukuran viewport
  useEffect(() => {
    const update = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Preferensi reduced-motion listener
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, []);

  // Simpan elemen yang membuka modal untuk pengembalian fokus keyboard
  useEffect(() => {
    if (isOpen) {
      openerRef.current = (document.activeElement as HTMLElement) || null;
    }
  }, [isOpen]);

  // Sinkronisasi saat initialRole berubah dari luar
  if (initialRole !== prevInitialRole) {
    setPrevInitialRole(initialRole);
    setActiveRole(initialRole);
    setCurrentPage(ROLE_TO_PAGE_INDEX[initialRole] ?? 0);
  }

  const handleClose = useCallback(() => {
    onClose();
    if (openerRef.current) {
      setTimeout(() => openerRef.current?.focus(), 50);
    }
  }, [onClose]);

  // Resolusi data halaman dan dokumen aktif
  const pageRole = PAGE_INDEX_TO_ROLE[currentPage] || "frontend";
  const effectiveKey: Exclude<RoleKey, "all"> = activeRole === "all" ? pageRole : activeRole;
  const currentDoc = cvDocs.find((d) => d.roleKey === effectiveKey);
  const currentDetail = ROLE_DETAILS[effectiveKey];

  const pagesList =
    currentDoc?.pages && currentDoc.pages.length > 0
      ? currentDoc.pages
      : ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"];

  const totalPages = pagesList.length;

  const prevPage = useCallback(() => {
    setCurrentPage((p) => {
      const next = Math.max(0, p - 1);
      setActiveRole(PAGE_INDEX_TO_ROLE[next] || "frontend");
      return next;
    });
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((p) => {
      const next = Math.min(totalPages - 1, p + 1);
      setActiveRole(PAGE_INDEX_TO_ROLE[next] || "frontend");
      return next;
    });
  }, [totalPages]);

  // Keyboard navigation & Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowLeft") {
        prevPage();
      } else if (e.key === "ArrowRight") {
        nextPage();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose, prevPage, nextPage]);

  if (!isOpen) return null;

  // Ukuran kertas responsif sesuai viewport (rasio A4 = 1 : 1.414)
  const isMobile = viewport.w < 640;
  const maxW = isMobile ? Math.min(viewport.w - 32, 330) : 400;
  const maxH = isMobile ? Math.min(viewport.h - 160, 480) : Math.min(viewport.h - 140, 580);
  const paperWidth = Math.round(Math.min(maxW, maxH / 1.414));
  const paperHeight = Math.round(paperWidth * 1.414);
  const sceneHeight = paperHeight + (isMobile ? 32 : 56);

  // URL PDF yang tersimpan di admin/backend atau Cloudflare R2
  const storedPdfUrl = currentDoc?.pdfUrl?.trim() || "";
  const isDirectHttpR2 =
    /^https?:\/\//i.test(storedPdfUrl) &&
    !storedPdfUrl.includes(".r2.cloudflarestorage.com");

  // Jika URL berupa domain R2 publik langsung, gunakan langsung; jika private/relatif, rute via /api/cv-pdf untuk signed URL aman
  const pdfHref = isDirectHttpR2
    ? storedPdfUrl
    : `/api/cv-pdf?role=${effectiveKey}`;

  const currentTitle = currentDoc?.title || currentDetail.title;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tampilan Lembar CV Interaktif"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Backdrop transparan lembut: meredupkan latar belakang tanpa kotak kartu */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Kontrol Atas Melayang (Transparan, Menghilang Saat Drag) */}
      <div
        className={`fixed top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-30 flex items-center justify-between pointer-events-none transition-opacity duration-200 ${
          isDragging ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Indikator Halaman & Spesialisasi Ringkas */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3.5 py-1.5 backdrop-blur-md shadow-md text-white text-xs font-semibold select-none">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: currentDoc?.color || currentDetail.color }}
          />
          <span>
            Hal {currentPage + 1}/{totalPages} • {currentTitle}
          </span>
        </div>

        {/* Aksi Cepat: Ratakan & Tutup */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCrumpleResetKey((k) => k + 1)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-md transition hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            title="Ratakan Lembar Kertas"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Ratakan</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="flex min-h-[40px] min-w-[40px] size-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md shadow-md transition hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Tutup pratinjau CV"
          >
            <X className="size-4.5" />
          </button>
        </div>
      </div>

      {/* Area Tengah: Lembar Kertas Asli Mengambang Bebas (Tanpa Container Box / Border) */}
      <div className="relative z-10 flex items-center justify-center w-full max-w-full select-none">
        {hasWebGL && !reducedMotion ? (
          <PaperCrumple
            src={pagesList[currentPage]}
            alt={`Curriculum Vitae Zakaria Mujur P. Halaman ${currentPage + 1}`}
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
            paperColor="#ffffff"
            paperTexture={0.06}
            shadow={true}
            shadowOpacity={0.12}
            draggable={true}
            returnToOrigin={true}
            resetKey={crumpleResetKey}
            onStateChange={(state) => {
              setIsDragging(state === "holding");
            }}
          />
        ) : (
          /* Fallback Statis saat WebGL tidak tersedia atau pengguna memilih Reduced Motion */
          <div className="relative flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pagesList[currentPage]}
              alt={`Curriculum Vitae Halaman ${currentPage + 1}`}
              style={{ width: paperWidth, height: paperHeight }}
              className="rounded-lg shadow-2xl object-contain bg-white pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* Kontrol Bawah Melayang: Navigasi Halaman Ringkas & Tombol "Buka PDF" */}
      <div
        className={`fixed bottom-5 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-30 pointer-events-none flex flex-wrap items-center justify-between gap-3 max-w-2xl mx-auto transition-opacity duration-200 ${
          isDragging ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Navigasi Halaman Ringkas (Hanya Muncul Jika Lebih dari 1 Halaman) */}
        {totalPages > 1 ? (
          <div className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-2.5 py-1.5 backdrop-blur-md shadow-lg text-white select-none">
            <button
              type="button"
              onClick={prevPage}
              disabled={currentPage === 0}
              className="flex min-h-[36px] min-w-[36px] size-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Halaman sebelumnya"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-mono text-xs font-bold px-2 tracking-wider">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1}
              className="flex min-h-[36px] min-w-[36px] size-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Halaman berikutnya"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Tombol Mengambang "Buka PDF" — Tautan Asli ke R2 / Dokumen Cloud */}
        <a
          href={pdfHref}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xl shadow-brand/35 backdrop-blur-sm transition-all duration-150 hover:bg-brand-ink hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <FileText className="size-4" />
          <span>Buka PDF</span>
          <ArrowUpRight className="size-3.5 text-white/80" />
        </a>
      </div>
    </div>
  );
}

export default CvPreviewModal;
