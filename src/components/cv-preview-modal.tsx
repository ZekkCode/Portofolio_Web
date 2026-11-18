"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileWarning,
  Lock,
  RotateCcw,
  X,
} from "lucide-react";
import { useLenis } from "lenis/react";
import { useSiteConfig } from "@/lib/site-store";
import { getPublishedCvDocs, getPublishedCvSettings } from "@/lib/content/selectors";
import { resolveCvDocumentInfo, summarizeCvCollection } from "@/lib/content/cv-documents";
import type { CvDocConfig, SiteConfig } from "@/lib/site-config";
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
  configOverride?: Partial<SiteConfig>;
  includeDrafts?: boolean;
}

export function CvPreviewModal({
  isOpen,
  initialRole = "all",
  onClose,
  configOverride,
  includeDrafts = false,
}: CvPreviewModalProps) {
  const { i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const storeConfig = useSiteConfig();
  const config = configOverride ?? storeConfig;
  const lenis = useLenis();

  const docs = useMemo<CvDocConfig[]>(() => {
    if (!includeDrafts) {
      return getPublishedCvDocs(config, locale);
    }
    const isEn = locale === "en";
    const rawList = Array.isArray(config?.cvDocs) ? [...config.cvDocs] : [];
    rawList.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    return rawList.map((doc) => ({
      ...doc,
      title: isEn && doc.titleEn ? doc.titleEn : doc.title,
      subtitle: isEn && doc.subtitleEn ? doc.subtitleEn : doc.subtitle,
      description: isEn && doc.descriptionEn ? doc.descriptionEn : doc.description,
      summary: isEn && doc.summaryEn ? doc.summaryEn : doc.summary || doc.description,
      responsibilities:
        isEn && doc.responsibilitiesEn && doc.responsibilitiesEn.length > 0
          ? doc.responsibilitiesEn
          : doc.responsibilities,
    }));
  }, [config, locale, includeDrafts]);

  const cvSettings = useMemo(() => getPublishedCvSettings(config, locale), [config, locale]);
  const collectionSummary = useMemo(
    () => summarizeCvCollection(docs, config?.cvSettings),
    [docs, config?.cvSettings]
  );

  const resolveInitialState = useCallback(
    (role: RoleKey) => {
      if (docs.length === 0) return { docKey: "frontend", pageIdx: 0 };
      const targetDoc =
        role === "all" || role === "combined"
          ? docs.find((d) => Boolean(d.pdfUrl?.trim())) || docs[0]
          : docs.find((d) => d.roleKey === role || d.id === role) || docs[0];
      const info =
        collectionSummary.resolutionsById[targetDoc.id] ||
        resolveCvDocumentInfo(targetDoc, docs, config?.cvSettings);
      const pages = info.previewPages;
      let initialPage = 0;
      if (role !== "all" && role !== "combined" && info.thumbnailUrl && pages.length > 0) {
        const matchIdx = pages.indexOf(info.thumbnailUrl);
        if (matchIdx >= 0) initialPage = matchIdx;
      }
      return { docKey: targetDoc.roleKey, pageIdx: initialPage };
    },
    [docs, collectionSummary, config?.cvSettings]
  );

  const [activeRole, setActiveRole] = useState<RoleKey>(() => resolveInitialState(initialRole).docKey);
  const [prevInitialRole, setPrevInitialRole] = useState<RoleKey>(initialRole);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);
  const [currentPage, setCurrentPage] = useState(() => resolveInitialState(initialRole).pageIdx);
  const [crumpleResetKey, setCrumpleResetKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [unavailableMap, setUnavailableMap] = useState<Record<string, boolean>>({});
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
    docs.find((d) => d.roleKey === activeRole || d.id === activeRole) ||
    docs[0] ||
    null;

  const currentInfo = useMemo(() => {
    if (!currentDoc) return null;
    return (
      collectionSummary.resolutionsById[currentDoc.id] ||
      resolveCvDocumentInfo(currentDoc, docs, config?.cvSettings)
    );
  }, [currentDoc, collectionSummary, docs, config?.cvSettings]);

  const fallbackDetail = ROLE_DETAILS[activeRole] || ROLE_DETAILS.frontend;
  const pagesList = useMemo(
    () => (currentInfo ? currentInfo.previewPages : []),
    [currentInfo]
  );

  const totalPages = pagesList.length;
  const safePageIdx = Math.min(Math.max(currentPage, 0), Math.max(0, totalPages - 1));

  const switchRole = (roleKey: string) => {
    setActiveRole(roleKey);
    const target = docs.find((d) => d.roleKey === roleKey || d.id === roleKey);
    const info = target
      ? collectionSummary.resolutionsById[target.id] ||
        resolveCvDocumentInfo(target, docs, config?.cvSettings)
      : null;
    if (info?.previewMode === "images" && info.thumbnailUrl && info.previewPages.length > 0) {
      const thumbPos = info.previewPages.indexOf(info.thumbnailUrl);
      setCurrentPage(thumbPos >= 0 ? thumbPos : 0);
    } else {
      setCurrentPage(0);
    }
  };

  const effectiveKey = currentDoc?.roleKey || activeRole || "frontend";
  const isDraftOverride = Boolean(includeDrafts && configOverride);
  const inlineEndpointUrl = `/api/cv-pdf?role=${encodeURIComponent(effectiveKey)}${
    includeDrafts ? "&includeDrafts=1" : ""
  }`;
  const downloadEndpointUrl = `/api/cv-pdf?role=${encodeURIComponent(effectiveKey)}&download=1${
    includeDrafts ? "&includeDrafts=1" : ""
  }`;

  const directLocalOrR2Url =
    isDraftOverride &&
    currentInfo?.hasPdf &&
    (currentInfo.pdfUrl.startsWith("/api/r2-file") ||
      (currentInfo.pdfUrl.startsWith("/") && !currentInfo.pdfUrl.startsWith("//")))
      ? currentInfo.pdfUrl
      : "";

  const previewTargetUrl = directLocalOrR2Url || inlineEndpointUrl;
  const downloadTargetUrl =
    isDraftOverride && directLocalOrR2Url
      ? directLocalOrR2Url.startsWith("/api/r2-file")
        ? `${directLocalOrR2Url}${directLocalOrR2Url.includes("?") ? "&" : "?"}download=1`
        : directLocalOrR2Url
      : downloadEndpointUrl;
  const pdfCheckKey = currentDoc && currentInfo?.hasPdf ? `${currentDoc.id}::${currentInfo.pdfUrl}::${previewTargetUrl}` : "";

  useEffect(() => {
    if (!isOpen || !currentInfo?.hasPdf || !pdfCheckKey) return;
    const rawPdf = currentInfo.pdfUrl.trim();
    // Lewati HEAD probe jika sumbernya data URI (inline PDF) atau URL eksternal cross-origin
    if (rawPdf.toLowerCase().startsWith("data:") || /^https?:\/\//i.test(rawPdf)) {
      return;
    }

    const controller = new AbortController();
    fetch(previewTargetUrl, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => {
        if (res.status === 404) {
          setUnavailableMap((prev) => ({ ...prev, [pdfCheckKey]: true }));
        } else if (res.ok) {
          setUnavailableMap((prev) => {
            if (!prev[pdfCheckKey]) return prev;
            const next = { ...prev };
            delete next[pdfCheckKey];
            return next;
          });
        }
      })
      .catch(() => {
        // Biarkan pratinjau berjalan normal saat jaringan sementara terputus
      });

    return () => controller.abort();
  }, [isOpen, currentInfo, pdfCheckKey, previewTargetUrl]);

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
  const isTablet = viewport.w >= 640 && viewport.w < 1024;
  const verticalPadding = isMobile ? 140 : 160;
  const horizontalPadding = isMobile ? 24 : 64;
  const availH = Math.max(280, viewport.h - verticalPadding);
  const availW = Math.max(260, viewport.w - horizontalPadding);
  const maxWidthCap = isMobile ? 360 : isTablet ? 520 : 640;
  const idealWFromHeight = Math.floor(availH / 1.414);
  const paperWidth = Math.round(Math.min(maxWidthCap, Math.min(availW, idealWFromHeight)));
  const paperHeight = Math.round(paperWidth * 1.414);

  const isMissingOnDisk = Boolean(pdfCheckKey && unavailableMap[pdfCheckKey]);
  const isPdfMissing = !currentDoc || !currentInfo || !currentInfo.hasPdf || isMissingOnDisk;
  const activePreviewMode = isPdfMissing ? "missing" : currentInfo.previewMode;

  const currentTitle = currentDoc?.title || fallbackDetail.title;
  const permissionEnabled = includeDrafts
    ? Boolean(currentInfo?.hasPdf && !isMissingOnDisk)
    : Boolean(currentInfo?.allowDownload && !isMissingOnDisk);
  const canDownload = permissionEnabled && !isPdfMissing;

  const isDownloadLockedByPolicy = Boolean(
    currentInfo?.hasPdf &&
      !isMissingOnDisk &&
      !includeDrafts &&
      (cvSettings.allowDownload === false || currentDoc?.allowDownload === false)
  );

  const isExternalHttpPdf = Boolean(
    currentInfo?.hasPdf &&
      /^https?:\/\//i.test(currentInfo.pdfUrl) &&
      !currentInfo.pdfUrl.includes(".r2.cloudflarestorage.com")
  );
  const pdfEmbedUrl = isDraftOverride && currentInfo?.pdfUrl.startsWith("data:")
    ? ""
    : previewTargetUrl;

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
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Top Floating Bar */}
      <div
        className={`fixed top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 z-30 flex items-center justify-between gap-3 pointer-events-none transition-opacity duration-200 ${
          isDragging ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Role Switcher Pills */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-white/20 bg-black/70 p-1 backdrop-blur-md shadow-lg max-w-[calc(100vw-120px)] sm:max-w-none overflow-x-auto scrollbar-none">
          {docs.length > 1 ? (
            docs.map((doc) => {
              const selected = doc.roleKey === currentDoc?.roleKey;
              const docRes = collectionSummary.resolutionsById[doc.id];
              const docNoPdf = docRes && !docRes.hasPdf;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => switchRole(doc.roleKey)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    selected
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: docNoPdf
                        ? "#94a3b8"
                        : doc.color || "#1b45c4",
                    }}
                  />
                  <span>{doc.title}</span>
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
            <span className="hidden md:inline-flex items-center px-2 font-mono text-[10px] text-white/70 whitespace-nowrap">
              {[currentDoc.versionLabel, currentDoc.updatedAt].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        {/* Actions: Flatten & Close */}
        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
          {activePreviewMode === "images" && (
            <button
              type="button"
              onClick={() => setCrumpleResetKey((k) => k + 1)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/20 bg-black/70 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all duration-150 hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 shadow-lg"
              title={locale === "en" ? "Flatten Paper" : "Ratakan Lembar Kertas"}
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">{locale === "en" ? "Flatten" : "Ratakan"}</span>
            </button>
          )}

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="flex min-h-[40px] min-w-[40px] size-10 items-center justify-center rounded-xl border border-white/20 bg-black/70 text-white backdrop-blur-md transition-all duration-150 hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 shadow-lg"
            aria-label={locale === "en" ? "Close CV preview" : "Tutup pratinjau CV"}
          >
            <X className="size-4.5" />
          </button>
        </div>
      </div>

      {/* Center Interactive Paper / Live PDF / Missing State */}
      <div className="fixed inset-x-0 top-16 sm:top-20 bottom-16 sm:bottom-20 z-10 pointer-events-none flex items-center justify-center px-4">
        {activePreviewMode === "images" && pagesList[safePageIdx] ? (
          hasWebGL && !reducedMotion ? (
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
          )
        ) : activePreviewMode === "pdf-embed" && !isExternalHttpPdf && pdfEmbedUrl ? (
          <div className="pointer-events-auto w-full max-w-3xl h-[68vh] sm:h-[74vh] mt-6 overflow-hidden rounded-2xl border border-white/20 bg-slate-950/90 shadow-2xl">
            <iframe
              key={`${currentDoc?.id || effectiveKey}-${pdfEmbedUrl}`}
              src={pdfEmbedUrl}
              title={`Pratinjau PDF ${currentTitle}`}
              className="h-full w-full border-0 bg-white"
            />
          </div>
        ) : activePreviewMode === "pdf-embed" ? (
          <div className="pointer-events-auto max-w-md rounded-2xl border border-white/20 bg-black/75 p-6 text-center text-white backdrop-blur-md shadow-xl">
            <FileText className="mx-auto mb-3 size-9 text-sky-300" />
            <p className="text-sm font-semibold">{currentTitle}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/75">
              {locale === "en"
                ? `Document ready (${currentInfo?.downloadFilename}). Preview opens via the PDF button below.`
                : `Dokumen siap (${currentInfo?.downloadFilename}). Buka berkas PDF langsung melalui tombol di bawah.`}
            </p>
          </div>
        ) : (
          <div
            role="status"
            className="pointer-events-auto max-w-md rounded-2xl border border-amber-300/30 bg-black/80 p-6 text-center text-white backdrop-blur-md shadow-xl"
          >
            <FileWarning className="mx-auto mb-3 size-9 text-amber-300" />
            <p className="text-sm font-semibold">
              {locale === "en"
                ? "CV PDF Unavailable"
                : "Berkas PDF CV Belum Tersedia"}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/75">
              {locale === "en"
                ? `No downloadable PDF document is currently attached or found for "${currentTitle}".`
                : `Berkas PDF CV untuk peran "${currentTitle}" belum terpasang atau tidak ditemukan di penyimpanan.`}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Floating Controls */}
      <div
        className={`fixed bottom-4 sm:bottom-5 left-4 sm:left-6 right-4 sm:right-6 z-30 pointer-events-none flex items-center justify-between gap-3 max-w-2xl mx-auto transition-opacity duration-200 ${
          isDragging ? "opacity-0" : "opacity-100"
        }`}
      >
        {activePreviewMode === "images" && totalPages > 1 ? (
          <div className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-white/20 bg-black/70 px-2 py-1 backdrop-blur-md text-white select-none shadow-lg">
            <button
              type="button"
              onClick={prevPage}
              disabled={safePageIdx === 0}
              className="flex min-h-[38px] min-w-[38px] size-9.5 items-center justify-center rounded-lg text-white/80 transition-all duration-150 hover:bg-white/20 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
              className="flex min-h-[38px] min-w-[38px] size-9.5 items-center justify-center rounded-lg text-white/80 transition-all duration-150 hover:bg-white/20 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={locale === "en" ? "Next page" : "Halaman berikutnya"}
              title={locale === "en" ? "Next Page" : "Halaman Berikutnya"}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : (
          <div />
        )}

        {canDownload && currentInfo ? (
          <a
            href={downloadTargetUrl}
            download={currentInfo.downloadFilename}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto inline-flex min-h-[40px] h-10 items-center gap-2 rounded-xl border border-brand-light/30 bg-brand px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <FileText className="size-4 text-sky-200" />
            <span>{cvSettings.downloadLabel || "Buka PDF"}</span>
            <ArrowUpRight className="size-3.5 text-white/80" />
          </a>
        ) : isDownloadLockedByPolicy ? (
          <div
            role="status"
            className="pointer-events-auto inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/20 bg-black/70 px-4 py-2 text-xs font-medium text-white/85 backdrop-blur-md shadow-lg"
          >
            <Lock className="size-3.5 text-amber-300 shrink-0" />
            <span>
              {locale === "en"
                ? "PDF download disabled by owner"
                : "Unduhan PDF dinonaktifkan oleh pemilik"}
            </span>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

export default CvPreviewModal;
