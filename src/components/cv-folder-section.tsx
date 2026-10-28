"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import Folder, { type FolderEntry } from "@/components/folder";
import { CvPreviewModal, type RoleKey, ROLE_DETAILS } from "@/components/cv-preview-modal";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function DemoWhitePaper({ roleKey, onClick }: { roleKey: Exclude<RoleKey, "all">; onClick: () => void }) {
  const { t } = useTranslation();
  const detail = ROLE_DETAILS[roleKey];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2px] border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer select-none text-slate-800"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
      }}
      title={`${t("cv.previewDoc")}: ${detail?.title || "Role"}`}
    >
      {/* Mini Document Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: detail?.color || "#1b45c4" }}
            />
            <span className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500">
              CURRICULUM VITAE
            </span>
          </div>
          <span className="rounded bg-slate-100 px-1 py-0.2 text-[7px] sm:text-[8px] font-semibold text-slate-600">
            PDF
          </span>
        </div>

        {/* Candidate & Role Title */}
        <div className="mt-2 text-left">
          <span className="block font-sans text-[10px] sm:text-[11px] font-extrabold text-slate-900 leading-tight">
            Zakaria Mujur P.
          </span>
          <span
            className="block font-sans text-[8px] sm:text-[9px] font-bold leading-tight mt-0.5"
            style={{ color: detail?.color || "#1b45c4" }}
          >
            {detail?.title || "Spesialisasi"}
          </span>
        </div>

        {/* Micro-Skeleton Wireframe Simulation of Document Content */}
        <div className="mt-2 space-y-1 text-left">
          <div className="h-0.8 w-3/4 rounded-full bg-slate-200/80" />
          <div className="h-0.8 w-full rounded-full bg-slate-100" />
          <div className="h-0.8 w-5/6 rounded-full bg-slate-100" />
        </div>

        {/* Skill tags preview */}
        <div className="mt-2 flex flex-wrap gap-1 text-[7px] sm:text-[8px]">
          {detail?.skills?.slice(0, 2).map((s) => (
            <span
              key={s}
              className="rounded bg-slate-50 px-1 py-0.5 font-medium text-slate-600 border border-slate-200/60"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Mini Document Footer */}
      <div className="flex items-center justify-between border-t border-slate-100/90 pt-1 text-[7px] sm:text-[8px] font-medium text-slate-400">
        <span>{t("cv.previewDoc")}</span>
        <span className="font-bold text-sky-600">{t("cv.openDoc")}</span>
      </div>
    </div>
  );
}

export function CvFolderSection() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { cvDocs } = useSiteConfig();
  const mounted = useMounted();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("all");
  const [folderMode, setFolderMode] = useState<"flap" | "book">("flap");
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // GSAP ScrollTrigger: tutup di atas, buka otomatis di tengah, tutup saat scroll lewat ke bawah
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof window === "undefined") return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setIsFolderOpen(true);
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 62%",
      end: "bottom 32%",
      onEnter: () => setIsFolderOpen(true),
      onLeave: () => setIsFolderOpen(false),
      onEnterBack: () => setIsFolderOpen(true),
      onLeaveBack: () => setIsFolderOpen(false),
    });

    if (trigger.isActive) {
      setIsFolderOpen(true);
    }

    return () => {
      trigger.kill();
    };
  }, []);

  const openPreview = (role: RoleKey) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  const roleKeys: Exclude<RoleKey, "all">[] = ["graphic", "uiux", "frontend", "itsupport"];

  const folderItems: FolderEntry[] = roleKeys.map((key) => ({
    content: <DemoWhitePaper roleKey={key} onClick={() => openPreview(key)} />,
  }));

  return (
    <section id="cv" ref={sectionRef} className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <ScrollReveal y={24}>
        <SectionTitle
          title={t("cv.title")}
          desc={t("cv.desc")}
        />
      </ScrollReveal>

      {/* Main Interactive Stage Box */}
      <div
        ref={stageRef}
        className="relative mt-8 overflow-hidden rounded-3xl border border-line/80 bg-white/95 p-6 sm:p-10 shadow-xs dark:border-line/60 dark:bg-[#111422]/90"
      >
        {/* Top Controls Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-5 dark:border-line/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <span>{t("cv.badge")}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switch: Flap vs Book */}
            <div className="flex rounded-full border border-line bg-white p-0.5 text-xs font-medium text-body dark:border-line/50 dark:bg-[#191e32]">
              <button
                type="button"
                onClick={() => setFolderMode("flap")}
                className={`rounded-full px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  folderMode === "flap"
                    ? "bg-brand text-white font-semibold shadow-xs"
                    : "hover:text-ink"
                }`}
              >
                {t("cv.modeFlap")}
              </button>
              <button
                type="button"
                onClick={() => setFolderMode("book")}
                className={`rounded-full px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  folderMode === "book"
                    ? "bg-brand text-white font-semibold shadow-xs"
                    : "hover:text-ink"
                }`}
              >
                {t("cv.modeBook")}
              </button>
            </div>

            {/* Manual Toggle Open/Close Button */}
            <button
              type="button"
              onClick={() => setIsFolderOpen((prev) => !prev)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isFolderOpen
                  ? "bg-brand/10 text-brand border border-brand/30"
                  : "border border-line bg-white text-body hover:border-brand/40 hover:text-ink dark:border-line/50 dark:bg-[#191e32]"
              }`}
            >
              {isFolderOpen ? t("cv.closeFolder") : t("cv.openFolder")}
            </button>

            {/* Direct Open Button */}
            <button
              type="button"
              onClick={() => openPreview("all")}
              className="rounded-full bg-ink px-3.5 py-1 text-xs font-semibold text-white transition-all duration-150 hover:bg-black active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:bg-white dark:text-ink"
            >
              {t("cv.openAll")} →
            </button>
          </div>
        </div>
        {/* Center 3D Folder Container */}
        <Parallax speed={-0.14}>
          <div className="relative z-10 flex min-h-[340px] sm:min-h-[390px] items-center justify-center pt-8 pb-14">
            <Folder
              label="CV / Zekk"
              color={isDark ? "#2563eb" : "#1b45c4"}
              mode={folderMode}
              variant="glass"
              open={isFolderOpen}
              onOpenChange={setIsFolderOpen}
              size={isMobile ? 0.95 : 1.25}
              items={folderItems}
              paperColor="#ffffff"
              tabPosition="right"
              layout="spread"
              openOn="click"
              draggable={true}
              zoomOnClick={true}
              peek={true}
              intro={false}
              tilt={isMobile ? 0.35 : 0.6}
              bounce={0.35}
              speed={1.15}
              frost={0.3}
              theme={isDark ? "dark" : "light"}
              onItemClick={(_item, index) => {
                const key = roleKeys[index] ?? "all";
                openPreview(key);
              }}
            />
          </div>
        </Parallax>

        {/* Bottom Role Quick-Access Badges */}
        <ScrollReveal y={20} delay={0.1} className="relative z-10 mt-6 border-t border-line/70 pt-6 dark:border-line/40">
          <div className="mb-4 flex items-center justify-center">
            <span className="rounded-full border border-line/80 bg-white/90 px-4 py-1 text-xs font-medium text-body shadow-2xs backdrop-blur-xs dark:border-line/50 dark:bg-[#191e32]">
              {t("cv.quickAccess")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {roleKeys.map((key) => {
              const detail = ROLE_DETAILS[key];
              const doc = cvDocs.find((d) => d.roleKey === key);
              const title = doc?.title || detail.title;
              const subtitle = doc?.subtitle || detail.subtitle;
              const color = doc?.color || detail.color;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openPreview(key)}
                  className="group flex flex-col rounded-2xl border border-line/80 bg-white p-4 text-left shadow-2xs transition-all duration-150 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/50 dark:bg-[#191e32]"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex size-7 items-center justify-center rounded-lg text-white font-black text-xs"
                      style={{ backgroundColor: color }}
                    >
                      {title.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-brand transition-colors">
                      {t("cv.viewCv")}
                    </span>
                  </div>
                  <h4 className="mt-2.5 text-sm font-bold text-ink">{title}</h4>
                  <p className="mt-0.5 text-xs text-body line-clamp-1">{subtitle}</p>
                </button>
              );
            })}
          </div>
        </ScrollReveal>
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
