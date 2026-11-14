"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import type { FolderEntry } from "@/components/folder";
import type { RoleKey } from "@/components/cv-preview-modal";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { usePrefetchOnIntent } from "@/hooks/use-prefetch-on-intent";
import { useSiteConfig } from "@/lib/site-store";
import {
  getPublishedCvDocs,
  getPublishedCvSettings,
  getPublishedSectionMeta,
} from "@/lib/content/selectors";
import { ArrowUpRight, FileText } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const CvPreviewModal = dynamic(
  () => import("@/components/cv-preview-modal").then((m) => m.CvPreviewModal),
  { ssr: false }
);

// Dynamically code-split the 3D folder component for capable devices
const DynamicFolder = dynamic(() => import("@/components/folder"), {
  ssr: false,
});

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface CvPageInfo {
  page: number;
  roleKey: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
}

/**
 * Lightweight, accessible HTML/CSS document folder preview for limited devices.
 */
export function StaticCvFolder({
  isOpen,
  pages,
  folderLabel = "CV / Zekk",
  hintLabel = "Klik lembar untuk pratinjau",
  onOpenPreview,
}: {
  isOpen: boolean;
  pages: CvPageInfo[];
  folderLabel?: string;
  hintLabel?: string;
  onOpenPreview: (role: RoleKey) => void;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xl mx-auto py-6 select-none">
      <div className="relative w-[320px] sm:w-[420px] aspect-[1.3/1] rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 p-4 shadow-2xl border border-white/20 dark:border-white/10 flex flex-col justify-between overflow-hidden">
        {/* Top Folder Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-blue-400" />
            <span className="font-mono text-xs font-bold text-sky-200">{folderLabel}</span>
          </div>
          <span className="text-[11px] font-mono font-medium text-sky-300/80">
            {pages.length} Dokumen
          </span>
        </div>

        {/* Fanned Document Cards Container */}
        <div className="relative h-44 sm:h-52 w-full my-auto flex items-center justify-center">
          {pages.map((p, idx) => {
            const center = (pages.length - 1) / 2;
            const rot = (idx - center) * 3;
            const yShift = isOpen ? (idx % 2 === 0 ? -16 : -24) : 0;
            const xShift = isOpen ? (idx - center) * 22 : 0;
            return (
              <div
                key={`${p.roleKey}-${idx}`}
                onClick={() => onOpenPreview(p.roleKey)}
                style={{
                  transform: `translate3d(${xShift}px, ${yShift}px, 0) rotate(${isOpen ? rot : 0}deg)`,
                  zIndex: idx + 1,
                }}
                className="absolute w-[200px] sm:w-[240px] aspect-[1/1.35] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg p-3 cursor-pointer transition-all duration-500 ease-out hover:scale-105 hover:z-20"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    Hal {p.page}
                  </span>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                </div>
                <div className="mt-2 space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {p.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {p.subtitle}
                  </p>
                </div>
                <div className="relative mt-2.5 h-16 sm:h-20 w-full rounded-md overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.title}
                    className="size-full object-cover object-top opacity-85"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Folder Bottom Bar */}
        <div className="flex items-center justify-between border-t border-white/15 pt-2 text-[10px] text-sky-200/80 font-mono">
          <span>ATS Verified</span>
          <span>{hintLabel}</span>
        </div>
      </div>
    </div>
  );
}

function ThemedFolder(props: Omit<ComponentProps<typeof DynamicFolder>, "color" | "theme">) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <DynamicFolder
      {...props}
      color={isDark ? "#2563eb" : "#1b45c4"}
      theme={isDark ? "dark" : "light"}
    />
  );
}

export function CvFolderSection() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const config = useSiteConfig();

  const sectionMeta = getPublishedSectionMeta(config, "cv", locale);
  const cvDocs = useMemo(() => getPublishedCvDocs(config, locale), [config, locale]);
  const cvSettings = useMemo(() => getPublishedCvSettings(config, locale), [config, locale]);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("all");

  const { intentProps: cvIntentProps } = usePrefetchOnIntent(
    () => import("@/components/cv-preview-modal"),
    { key: "cv-preview-modal" }
  );
  const [isFolderOpen, setIsFolderOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // GSAP ScrollTrigger: tutup di atas, buka otomatis di tengah, tutup saat scroll lewat ke bawah
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof window === "undefined") return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 70%",
      end: "bottom 20%",
      onEnter: () => setIsFolderOpen(true),
      onLeave: () => setIsFolderOpen(false),
      onEnterBack: () => setIsFolderOpen(true),
      onLeaveBack: () => setIsFolderOpen(false),
    });

    if (trigger.isActive) {
      queueMicrotask(() => setIsFolderOpen(true));
    }

    return () => {
      trigger.kill();
    };
  }, []);

  const openPreview = (role: RoleKey) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  const cvPages: CvPageInfo[] = useMemo(() => {
    return cvDocs.map((doc, idx) => ({
      page: idx + 1,
      roleKey: doc.roleKey,
      title: doc.title,
      subtitle: doc.subtitle || doc.description || "",
      image: doc.thumbnailUrl || doc.pages?.[0] || "/cv-page-1.png",
      color: doc.color || "#1b45c4",
    }));
  }, [cvDocs]);

  const folderItems: FolderEntry[] = useMemo(() => {
    return cvPages.map((item) => ({
      image: item.image,
      title: item.title,
      description: item.subtitle,
      alt: `Curriculum Vitae - ${item.title}`,
    }));
  }, [cvPages]);

  const headingTitle = sectionMeta.title || t("cv.title");
  const headingDesc = sectionMeta.desc || t("cv.desc");

  return (
    <section id="cv" ref={sectionRef} className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <div id="resume" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          eyebrow={sectionMeta.eyebrow || undefined}
          title={headingTitle}
          desc={headingDesc}
        />
      </ScrollReveal>

      {cvPages.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line/80 bg-white/50 p-10 text-center dark:border-line/40 dark:bg-[#111422]/50">
          <p className="text-sm font-medium text-muted">
            {locale === "en"
              ? "No curriculum vitae documents are currently published."
              : "Belum ada berkas CV yang dipublikasikan saat ini."}
          </p>
        </div>
      ) : (
        <div
          ref={stageRef}
          className="relative z-[2] mt-8 flex min-h-[400px] sm:min-h-[460px] flex-col items-center justify-center py-6 [contain:layout_style]"
        >
          <div className="relative flex w-full items-center justify-center">
            <ThemedFolder
              label={cvSettings.folderLabel || "CV / Zekk"}
              mode="flap"
              variant="solid"
              open={isFolderOpen}
              onOpenChange={setIsFolderOpen}
              size={isMobile ? 0.95 : 1.25}
              items={folderItems}
              paperColor="#ffffff"
              tabPosition="right"
              layout="spread"
              openOn="click"
              draggable={true}
              zoomOnClick={false}
              peek={true}
              intro={false}
              tilt={isMobile ? 0.35 : 0.6}
              bounce={0.35}
              speed={1.15}
              frost={0.3}
              onItemClick={(_item, index) => {
                const item = cvPages[index];
                if (item) {
                  openPreview(item.roleKey);
                }
              }}
            />

            {/* Floating Center Button */}
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <button
                type="button"
                onClick={() => openPreview("all")}
                {...cvIntentProps}
                className="pointer-events-auto group inline-flex min-h-[44px] h-11 items-center gap-2.5 rounded-xl border border-brand-light/30 bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <FileText className="size-4 text-sky-200 transition-transform group-hover:scale-110 motion-reduce:transform-none" />
                <span>{cvSettings.previewCta || t("cv.viewCv", "Lihat CV")}</span>
                <ArrowUpRight className="size-4 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
              </button>
            </div>
          </div>

          {cvSettings.folderHint && (
            <p className="mt-4 text-center text-xs text-muted">
              {cvSettings.folderHint}
            </p>
          )}
        </div>
      )}

      {/* CV Preview Modal (lazy-loaded on demand) */}
      {modalOpen && (
        <CvPreviewModal
          isOpen={modalOpen}
          initialRole={selectedRole}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}

export default CvFolderSection;
