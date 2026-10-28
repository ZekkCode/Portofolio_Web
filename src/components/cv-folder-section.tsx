"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import Folder, { type FolderEntry } from "@/components/folder";
import { CvPreviewModal, type RoleKey, ROLE_DETAILS } from "@/components/cv-preview-modal";
import PaperCrumple from "@/components/paper-crumple";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";
import { ArrowUpRight, FileText, Sparkles, RotateCcw } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CvPageInfo {
  page: number;
  roleKey: Exclude<RoleKey, "all">;
  title: string;
  subtitle: string;
  image: string;
  color: string;
}

const CV_PAGES: CvPageInfo[] = [
  {
    page: 1,
    roleKey: "graphic",
    title: "Profil & Pengalaman",
    subtitle: "Desain Grafis & Creative Media",
    image: "/cv-page-1.png",
    color: "#0284c7",
  },
  {
    page: 2,
    roleKey: "uiux",
    title: "Pendidikan & Organisasi",
    subtitle: "S1 TI UTM (IPK 3.70) • GDGoC",
    image: "/cv-page-2.png",
    color: "#0284c7",
  },
  {
    page: 3,
    roleKey: "frontend",
    title: "Proyek & Sertifikasi",
    subtitle: "Trevio, TOEFL & BNSP Grafis",
    image: "/cv-page-3.png",
    color: "#1b45c4",
  },
  {
    page: 4,
    roleKey: "itsupport",
    title: "Kemampuan & Portofolio",
    subtitle: "Figma, Adobe, Next.js, Python",
    image: "/cv-page-4.png",
    color: "#d97706",
  },
];

function CvPdfPaperSheet({
  page,
  title,
  subtitle,
  image,
  color,
  onClick,
}: {
  page: number;
  title: string;
  subtitle: string;
  image: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[3px] border border-slate-200/90 bg-white p-2.5 shadow-2xs transition-all hover:scale-[1.02] hover:border-brand/60 hover:shadow-md active:scale-[0.99] cursor-pointer select-none text-slate-800"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
      }}
      title={`Curriculum Vitae — Hal ${page}: ${title}`}
    >
      {/* Top Document Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500">
              ATS CV • HAL {page}
            </span>
          </div>
          <span className="rounded bg-sky-50 px-1 py-0.2 text-[7px] sm:text-[8px] font-bold text-sky-700 border border-sky-100">
            PDF 2025
          </span>
        </div>

        {/* Realistic Page Thumbnail Preview */}
        <div className="relative mt-2 aspect-[1/1.25] w-full overflow-hidden rounded border border-slate-200/80 bg-slate-50 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={`CV Hal ${page} - ${title}`}
            draggable={false}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Mini Document Footer */}
      <div className="mt-1 flex items-center justify-between border-t border-slate-100/90 pt-1 text-[7px] sm:text-[8px] font-medium text-slate-500">
        <span className="truncate max-w-[110px] font-bold text-slate-800">{title}</span>
        <span className="inline-flex items-center gap-0.5 font-bold text-brand group-hover:underline">
          <span>Buka</span>
          <ArrowUpRight className="size-2.5" />
        </span>
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
  const [activeCrumplePage, setActiveCrumplePage] = useState<number>(1);
  const [crumpleResetKey, setCrumpleResetKey] = useState<number>(0);

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

  const handleSelectPage = (page: number, roleKey: Exclude<RoleKey, "all">) => {
    setActiveCrumplePage(page);
    openPreview(roleKey);
  };

  const folderItems: FolderEntry[] = CV_PAGES.map((item) => ({
    content: (
      <CvPdfPaperSheet
        page={item.page}
        title={item.title}
        subtitle={item.subtitle}
        image={item.image}
        color={item.color}
        onClick={() => handleSelectPage(item.page, item.roleKey)}
      />
    ),
  }));

  const activeCrumpleItem = CV_PAGES.find((p) => p.page === activeCrumplePage) || CV_PAGES[0];

  return (
    <section id="cv" ref={sectionRef} className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <div id="resume" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={t("cv.title")}
          desc={t("cv.desc")}
        />
      </ScrollReveal>

      {/* Main Interactive Stage Box: 3D Folder + Tactile Paper Crumple */}
      <div
        ref={stageRef}
        className="relative mt-8 overflow-hidden rounded-3xl border border-line/80 bg-white/95 p-6 sm:p-10 shadow-xs dark:border-line/60 dark:bg-[#111422]/90"
      >
        {/* Top Controls Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-5 dark:border-line/40">
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Reset Paper Fold Button */}
            <button
              type="button"
              onClick={() => setCrumpleResetKey((k) => k + 1)}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-body hover:border-brand/40 hover:text-ink dark:border-line/50 dark:bg-[#191e32]"
              title="Ratakan Lembar Kertas"
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">Ratakan Kertas</span>
            </button>

            {/* Direct Open Button */}
            <button
              type="button"
              onClick={() => openPreview("all")}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1 text-xs font-semibold text-white transition-all duration-150 hover:bg-black active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:bg-white dark:text-ink"
            >
              <Sparkles className="size-3.5 text-sky-400" />
              <span>{t("cv.openAll")}</span>
              <ArrowUpRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* 3D Folder Center Stage */}
        <Parallax speed={-0.12}>
          <div className="relative z-10 flex min-h-[360px] sm:min-h-[420px] items-center justify-center pt-8 pb-10">
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
                const item = CV_PAGES[index];
                if (item) {
                  handleSelectPage(item.page, item.roleKey);
                }
              }}
            />

            {/* Floating Center Button: "Lihat & Remas CV 3D" */}
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <button
                type="button"
                onClick={() => openPreview("all")}
                className="pointer-events-auto group inline-flex items-center gap-2 rounded-full border border-white/50 bg-ink/90 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-black hover:shadow-2xl active:scale-95 dark:border-white/20 dark:bg-white/95 dark:text-ink dark:hover:bg-white"
              >
                <FileText className="size-4 text-sky-400 dark:text-brand transition-transform group-hover:scale-110" />
                <span>Lihat & Remas CV 3D</span>
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </Parallax>

        {/* Connected Tactile Paper Crumple Tray: "Folder + Paper Crumple" Unified! */}
        <div className="relative z-10 mt-2 rounded-2xl border border-line/80 bg-slate-50/70 p-4 sm:p-6 dark:border-line/40 dark:bg-[#0c0e17]/60">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="size-4 text-brand" />
              <span className="font-bold text-ink">
                Lembar Fisik Terpilih: Hal {activeCrumplePage} — {activeCrumpleItem.title}
              </span>
              <span className="hidden sm:inline text-slate-400">•</span>
              <span className="hidden sm:inline text-slate-500 text-[11px]">
                Tahan & geser untuk meremas / melepaskan lembar kertas ATS asli
              </span>
            </div>

            {/* Page Switcher for the Crumple Tray */}
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-full border border-line bg-white p-0.5 text-xs font-medium text-body dark:border-line/50 dark:bg-[#191e32]">
                {CV_PAGES.map((p) => (
                  <button
                    key={p.page}
                    type="button"
                    onClick={() => setActiveCrumplePage(p.page)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                      activeCrumplePage === p.page
                        ? "bg-brand text-white shadow-2xs"
                        : "hover:text-ink"
                    }`}
                  >
                    Hal {p.page}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCrumpleResetKey((k) => k + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-body hover:text-ink dark:border-line/50 dark:bg-[#191e32]"
                title="Ratakan Lembar Kertas"
              >
                <RotateCcw className="size-3" />
                <span className="hidden sm:inline">Ratakan</span>
              </button>
              <button
                type="button"
                onClick={() => openPreview(activeCrumpleItem.roleKey)}
                className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white hover:bg-black dark:bg-white dark:text-ink"
              >
                <span>Layar Penuh</span>
                <ArrowUpRight className="size-3" />
              </button>
            </div>
          </div>

          {/* Three.js Paper Crumple Canvas */}
          <div className="mt-4 flex justify-center">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-sm dark:border-line/40 dark:bg-[#07080d]">
              <PaperCrumple
                src={activeCrumpleItem.image}
                alt={`Curriculum Vitae Zakaria Mujur P. - ${activeCrumpleItem.title}`}
                width={320}
                height={452}
                sceneHeight={520}
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
          </div>
        </div>

        {/* Bottom Role Quick-Access Badges */}
        <ScrollReveal y={20} delay={0.1} className="relative z-10 mt-6 border-t border-line/70 pt-6 dark:border-line/40">
          <div className="mb-4 flex items-center justify-center">
            <span className="rounded-full border border-line/80 bg-white/90 px-4 py-1 text-xs font-medium text-body shadow-2xs backdrop-blur-xs dark:border-line/50 dark:bg-[#191e32]">
              {t("cv.quickAccess")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CV_PAGES.map((item) => {
              const detail = ROLE_DETAILS[item.roleKey];
              const doc = cvDocs.find((d) => d.roleKey === item.roleKey);
              const title = doc?.title || detail.title;
              const subtitle = item.subtitle;
              const color = doc?.color || detail.color;
              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => handleSelectPage(item.page, item.roleKey)}
                  className="group flex flex-col rounded-2xl border border-line/80 bg-white p-4 text-left shadow-2xs transition-all duration-150 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/50 dark:bg-[#191e32]"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex size-7 items-center justify-center rounded-lg text-white font-black text-xs"
                      style={{ backgroundColor: color }}
                    >
                      {item.page}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-brand transition-colors">
                      <span>Hal {item.page}</span>
                      <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
