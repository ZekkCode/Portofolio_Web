"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ChevronLeft, ChevronRight, FileText, RotateCcw, X } from "lucide-react";
import { useLenis } from "lenis/react";
import { useSiteConfig } from "@/lib/site-store";
import { getPublishedCvDocs, getPublishedCvSettings } from "@/lib/content/selectors";
import type { PaperCrumpleProps } from "@/components/paper-crumple";

const PaperCrumple = dynamic<PaperCrumpleProps>(
  () => import("@/components/paper-crumple"),
  { ssr: false }
);

export type RoleKey = string;

export const ROLE_TO_PAGE_INDEX: Record<string, number> = {
  all: 0,
  graphic: 0,
  uiux: 1,
  frontend: 2,
  itsupport: 3,
};

export const PAGE_INDEX_TO_ROLE: Record<number, string> = {
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

export const ROLE_DETAILS: Record<string, RoleDetail> = {
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
    responsibilities: [],
    keyProjects: [],
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
    desc: "Mendesain antarmuka produk digital (web & mobile) yang berpusat pada pengguna.",
    skills: ["User Journey & Flow", "Wireframing & Lo-Fi", "High-Fidelity Prototyping", "Design System & Tokens"],
    tools: ["Figma", "Adobe XD", "FigJam", "Whimsical", "Component Libraries"],
    responsibilities: [],
    keyProjects: [],
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
    desc: "Mengembangkan aplikasi web modern yang cepat, interaktif, responsif, dan aksesibel.",
    skills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Three.js & WebGL"],
    tools: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Three.js", "VS Code", "GitHub"],
    responsibilities: [],
    keyProjects: [],
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
    desc: "Memiliki keahlian perakitan hardware PC, Linux OS, jaringan dasar, dan otomasi bot.",
    skills: ["Hardware Assembly", "Linux & Windows", "Network Basics", "Automation Scripting"],
    tools: ["Ubuntu / Debian Linux", "Windows OS", "Python", "Bash"],
    responsibilities: [],
    keyProjects: [],
  },
};

interface CvPreviewModalProps {
  isOpen: boolean;
  initialRole?: RoleKey;
  onClose: () => void;
}

export function CvPreviewModal({ isOpen, initialRole = "all", onClose }: CvPreviewModalProps) {
  const { i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const config = useSiteConfig();
  const lenis = useLenis();

  const docs = useMemo(() => getPublishedCvDocs(config, locale), [config, locale]);
  const cvSettings = useMemo(() => getPublishedCvSettings(config, locale), [config, locale]);

  const resolveInitialState = useCallback(
    (role: RoleKey) => {
      if (docs.length === 0) return { docKey: "frontend", pageIdx: 0 };
      const targetDoc =
        role === "all"
          ? docs[0]
          : docs.find((d) => d.roleKey === role) || docs[0];
      const pages =
        targetDoc.pages && targetDoc.pages.length > 0
          ? targetDoc.pages
          : [targetDoc.thumbnailUrl || "/cv-page-1.png"];
      let initialPage = 0;
      if (role !== "all" && targetDoc.thumbnailUrl) {
        const matchIdx = pages.indexOf(targetDoc.thumbnailUrl);
        if (matchIdx >= 0) initialPage = matchIdx;
      }
      return { docKey: targetDoc.roleKey, pageIdx: initialPage };
    },
    [docs]
  );

  const [activeRole, setActiveRole] = useState<RoleKey>(() => resolveInitialState(initialRole).docKey);
  const [prevInitialRole, setPrevInitialRole] = useState<RoleKey>(initialRole);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);
  const [currentPage, setCurrentPage] = useState(() => resolveInitialState(initialRole).pageIdx);
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

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const openerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      openerRef.current = (document.activeElement as HTMLElement) || null;
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [isOpen, lenis]);

  if (isOpen && (!prevIsOpen || initialRole !== prevInitialRole)) {
    const next = resolveInitialState(initialRole);
    setPrevIsOpen(isOpen);
    setPrevInitialRole(initialRole);
    setActiveRole(next.docKey);
    setCurrentPage(next.pageIdx);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const handleClose = useCallback(() => {
    onClose();
    if (openerRef.current) {
      setTimeout(() => openerRef.current?.focus(), 50);
    }
  }, [onClose]);

  const currentDoc =
    docs.find((d) => d.roleKey === activeRole) ||
    docs[0] ||
    null;

  const fallbackDetail = ROLE_DETAILS[activeRole] || ROLE_DETAILS.frontend;

  const pagesList = useMemo(() => {
    if (currentDoc?.pages && currentDoc.pages.length > 0) return currentDoc.pages;
    if (currentDoc?.thumbnailUrl) return [currentDoc.thumbnailUrl];
    return ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"];
  }, [currentDoc]);

  const totalPages = pagesList.length;
  const safePageIdx = Math.min(Math.max(currentPage, 0), Math.max(0, totalPages - 1));

  const switchRole = (roleKey: string) => {
    setActiveRole(roleKey);
    const target = docs.find((d) => d.roleKey === roleKey);
    if (target?.thumbnailUrl && target.pages?.length) {
      const thumbPos = target.pages.indexOf(target.thumbnailUrl);
      setCurrentPage(thumbPos >= 0 ? thumbPos : 0);
    } else {
      setCurrentPage(0);
    }
  };

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

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
      } else if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusables = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href]:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
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

  if (!isOpen || !mounted) return null;

  const isMobile = viewport.w < 640;
  const maxW = isMobile ? Math.min(viewport.w - 32, 330) : 400;
  const maxH = isMobile ? Math.min(viewport.h - 160, 480) : Math.min(viewport.h - 140, 580);
  const paperWidth = Math.round(Math.min(maxW, maxH / 1.414));
  const paperHeight = Math.round(paperWidth * 1.414);

  const effectiveKey = currentDoc?.roleKey || activeRole || "frontend";
  const storedPdfUrl = currentDoc?.pdfUrl?.trim() || "";
  const isDirectHttpR2 =
    /^https?:\/\//i.test(storedPdfUrl) &&
    !storedPdfUrl.includes(".r2.cloudflarestorage.com") &&
    !storedPdfUrl.startsWith("/api/r2-file");

  const pdfHref = isDirectHttpR2
    ? storedPdfUrl
    : `/api/cv-pdf?role=${encodeURIComponent(effectiveKey)}`;

  const currentTitle = currentDoc?.title || fallbackDetail.title;
  const canDownload = currentDoc ? currentDoc.allowDownload !== false : cvSettings.allowDownload !== false;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Tampilan Lembar CV Interaktif"
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
    >
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Top Floating Bar */}
      <div
        className={`fixed top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none transition-opacity duration-200 ${
          isDragging ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Role Switcher Pills / Title */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/20 bg-black/55 p-1 backdrop-blur-md shadow-md">
          {docs.length > 1 ? (
            docs.map((doc) => {
              const selected = doc.roleKey === currentDoc?.roleKey;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => switchRole(doc.roleKey)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selected
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: doc.color || "#1b45c4" }}
                  />
                  <span className="truncate max-w-[130px] sm:max-w-none">{doc.title}</span>
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 text-white text-xs font-semibold">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: currentDoc?.color || fallbackDetail.color }}
              />
              <span>{currentTitle}</span>
            </div>
          )}

          {(currentDoc?.versionLabel || currentDoc?.updatedAt) && (
            <span className="hidden md:inline-flex items-center px-2 font-mono text-[10px] text-white/70">
              {[currentDoc.versionLabel, currentDoc.updatedAt].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        {/* Actions: Flatten & Close */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCrumpleResetKey((k) => k + 1)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all duration-150 hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            title={locale === "en" ? "Flatten Paper" : "Ratakan Lembar Kertas"}
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">{locale === "en" ? "Flatten" : "Ratakan"}</span>
          </button>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="flex min-h-[44px] min-w-[44px] size-11 items-center justify-center rounded-xl border border-white/20 bg-black/60 text-white backdrop-blur-md transition-all duration-150 hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            aria-label={locale === "en" ? "Close CV preview" : "Tutup pratinjau CV"}
          >
            <X className="size-4.5" />
          </button>
        </div>
      </div>

      {/* Center Interactive Paper */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        {hasWebGL && !reducedMotion ? (
          <PaperCrumple
            className="pointer-events-auto h-full w-full"
            src={pagesList[safePageIdx]}
            alt={`Curriculum Vitae ${currentTitle} Halaman ${safePageIdx + 1}`}
            width={paperWidth}
            height={paperHeight}
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
          <div className="relative flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pagesList[safePageIdx]}
              alt={`Curriculum Vitae ${currentTitle} Halaman ${safePageIdx + 1}`}
              style={{ width: paperWidth, height: paperHeight }}
              className="rounded-lg shadow-2xl object-contain bg-white pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* Bottom Floating Controls */}
      <div
        className={`fixed bottom-5 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-30 pointer-events-none flex flex-wrap items-center justify-between gap-3 max-w-2xl mx-auto transition-opacity duration-200 ${
          isDragging ? "opacity-0" : "opacity-100"
        }`}
      >
        {totalPages > 1 ? (
          <div className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-2.5 py-1.5 backdrop-blur-md text-white select-none">
            <button
              type="button"
              onClick={prevPage}
              disabled={safePageIdx === 0}
              className="flex min-h-[44px] min-w-[44px] size-11 items-center justify-center rounded-xl text-white/80 transition-all duration-150 hover:bg-white/20 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={locale === "en" ? "Previous page" : "Halaman sebelumnya"}
              title={locale === "en" ? "Previous Page" : "Halaman Sebelumnya"}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-mono text-xs font-bold px-2 tracking-wider">
              Hal {safePageIdx + 1} {locale === "en" ? "of" : "dari"} {totalPages}
            </span>
            <button
              type="button"
              onClick={nextPage}
              disabled={safePageIdx >= totalPages - 1}
              className="flex min-h-[44px] min-w-[44px] size-11 items-center justify-center rounded-xl text-white/80 transition-all duration-150 hover:bg-white/20 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={locale === "en" ? "Next page" : "Halaman berikutnya"}
              title={locale === "en" ? "Next Page" : "Halaman Berikutnya"}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : (
          <div />
        )}

        {canDownload && (
          <a
            href={pdfHref}
            download={currentDoc?.downloadFilename || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto inline-flex min-h-[44px] h-11 items-center gap-2 rounded-xl border border-brand-light/30 bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <FileText className="size-4 text-sky-200" />
            <span>{cvSettings.downloadLabel || "Buka PDF"}</span>
            <ArrowUpRight className="size-3.5 text-white/80" />
          </a>
        )}
      </div>
    </div>,
    document.body
  );
}

export default CvPreviewModal;
