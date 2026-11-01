"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SectionTitle } from "@/components/section-title";
import { ScrollReveal } from "@/components/parallax";
import { useSiteConfig, defaultEducation, type EducationItem } from "@/lib/site-store";
import {
  GraduationCap,
  School,
  MapPin,
  Calendar,
  BookOpen,
  FolderGit2,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

export function AcademicJourneySection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const { education } = useSiteConfig();

  // Use configured education or fallback to authentic default records
  const items: EducationItem[] = useMemo(() => {
    return education && education.length > 0 ? education : defaultEducation;
  }, [education]);

  // Dynamic years range based on education start/end years and current year
  const { years, yearMilestones } = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYears = items.map((e) => e.startYear || currentYear);
    const endYears = items.map((e) =>
      typeof e.endYear === "number" ? e.endYear : currentYear
    );
    const min = Math.min(...startYears, currentYear - 3);
    const max = Math.max(...endYears, currentYear);
    const list: number[] = [];
    for (let y = min; y <= max; y++) {
      list.push(y);
    }

    // Map which years have milestone education entries
    const milestones: Record<number, EducationItem[]> = {};
    for (const item of items) {
      const y = item.startYear || currentYear;
      if (!milestones[y]) milestones[y] = [];
      milestones[y].push(item);
    }

    return { years: list, yearMilestones: milestones };
  }, [items]);

  // Track state
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Update active index and scroll progress on horizontal scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll));
    setScrollProgress(progress);

    // Determine active card based on center proximity
    const containerCenter = scrollLeft + clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(containerCenter - cardCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener("scroll", onScroll);
    };
  }, [handleScroll]);

  // Navigation handlers
  const scrollToIndex = useCallback((index: number) => {
    const card = cardRefs.current[index];
    const container = scrollContainerRef.current;
    if (!card || !container) return;

    const targetLeft =
      card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
    setActiveIndex(index);
  }, []);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    }
  }, [activeIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    if (activeIndex < items.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  }, [activeIndex, items.length, scrollToIndex]);

  // Click on year jump
  const handleYearClick = useCallback(
    (year: number) => {
      // Find matching education item index or closest item
      const itemIndex = items.findIndex((e) => e.startYear === year);
      if (itemIndex !== -1) {
        scrollToIndex(itemIndex);
      } else {
        // If intermediate year, find nearest past milestone
        let nearestIndex = 0;
        let bestDiff = Infinity;
        items.forEach((e, idx) => {
          const diff = Math.abs((e.startYear || year) - year);
          if (diff < bestDiff) {
            bestDiff = diff;
            nearestIndex = idx;
          }
        });
        scrollToIndex(nearestIndex);
      }
    },
    [items, scrollToIndex]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Keyboard navigation for carousel
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    },
    [handlePrev, handleNext]
  );

  const activeEdu = items[activeIndex] || items[0];
  const activeYear = activeEdu?.startYear || new Date().getFullYear();

  return (
    <section
      id="akademik"
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20 overflow-hidden"
      aria-label={t("academic.title", "Jejak Akademik")}
    >
      {/* Anchor aliases for friendly URL navigation */}
      <div id="academic" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div id="pendidikan" className="absolute top-0 -mt-24" aria-hidden="true" />

      <ScrollReveal y={24}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SectionTitle
            title={t("academic.title", "Jejak Akademik")}
            desc={t(
              "academic.desc",
              "Latar belakang pendidikan formal dan bidang keilmuan yang menjadi fondasi rekayasa digital."
            )}
          />

          {/* Navigation Arrows for Timeline */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 mb-4 sm:mb-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              aria-label="Pendidikan Sebelumnya"
              className="group flex size-10 items-center justify-center rounded-xl border border-line bg-white/80 text-ink shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-white/80 disabled:hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/40 dark:bg-[#111422]/80 dark:text-slate-200 dark:hover:bg-blue-950/30"
            >
              <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transform-none" />
            </button>
            <div className="font-mono text-xs font-bold text-muted px-2 select-none">
              <span className="text-brand dark:text-blue-400">
                0{activeIndex + 1}
              </span>{" "}
              / 0{items.length}
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeIndex === items.length - 1}
              aria-label="Pendidikan Selanjutnya"
              className="group flex size-10 items-center justify-center rounded-xl border border-line bg-white/80 text-ink shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-white/80 disabled:hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/40 dark:bg-[#111422]/80 dark:text-slate-200 dark:hover:bg-blue-950/30"
            >
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* HORIZONTAL YEAR-BASED TIMELINE TRACK */}
      <div className="relative mt-8 sm:mt-10 mb-6 sm:mb-8 select-none">
        {/* Track Progress Line */}
        <div className="relative w-full py-4">
          {/* Background Track Line */}
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-line/80 dark:bg-line/40 rounded-full"
            aria-hidden="true"
          />
          {/* Scroll-Linked Fill Progress Line (scaleX from Left to Right) */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand dark:bg-blue-500 rounded-full origin-left will-change-transform transition-transform duration-150"
            style={{
              width: "100%",
              transform: `scaleX(${scrollProgress})`,
            }}
            aria-hidden="true"
          />

          {/* Interactive Year Milestone Nodes */}
          <div className="relative flex justify-between items-center w-full z-10">
            {years.map((year) => {
              const isMilestone = Boolean(yearMilestones[year]);
              const isActiveYear = activeYear === year;
              const eduMatch = yearMilestones[year]?.[0];

              // Smooth scale calculation based on active proximity
              const scale = prefersReducedMotion
                ? 1
                : isActiveYear
                ? 1.22
                : isMilestone
                ? 1.05
                : 0.94;

              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleYearClick(year)}
                  aria-label={`Tahun ${year}${
                    eduMatch ? ` — ${eduMatch.institution}` : ""
                  }`}
                  aria-pressed={isActiveYear}
                  className="group relative flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg p-1 -m-1 transition-transform duration-200"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                  }}
                >
                  {/* Timeline Node Dot */}
                  <div
                    className={`size-3 sm:size-3.5 rounded-full border-2 transition-all duration-300 ${
                      isActiveYear
                        ? "border-brand bg-brand shadow-sm shadow-brand/40 scale-125 dark:border-blue-400 dark:bg-blue-500"
                        : isMilestone
                        ? "border-brand/80 bg-white hover:scale-110 dark:border-blue-400/80 dark:bg-[#111422]"
                        : "border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  />

                  {/* Year Label */}
                  <span
                    className={`mt-2 font-mono text-[11px] sm:text-xs tracking-wider transition-colors duration-200 ${
                      isActiveYear
                        ? "font-extrabold text-brand dark:text-blue-400"
                        : isMilestone
                        ? "font-bold text-ink hover:text-brand dark:text-slate-200"
                        : "font-medium text-muted hover:text-body"
                    }`}
                  >
                    {year}
                  </span>

                  {/* Optional Milestone Label Indicator */}
                  {isMilestone && (
                    <span className="hidden sm:inline-block absolute -bottom-5 text-[9px] font-semibold text-muted tracking-tight truncate max-w-[90px] text-center">
                      {eduMatch?.institution.split(" ")[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* HORIZONTAL CARDS CAROUSEL */}
      <div
        ref={scrollContainerRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Daftar Kartu Jejak Akademik"
        className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pt-2 pb-6 px-1 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-2xl"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((edu, idx) => {
          const isActive = idx === activeIndex;
          const isUniversity =
            edu.degree?.toLowerCase().includes("sarjana") ||
            edu.degree?.toLowerCase().includes("s1") ||
            edu.institution?.toLowerCase().includes("universitas");
          const isExpanded = Boolean(expanded[edu.id]);
          const focusList =
            currentLang === "en" && edu.focusEn && edu.focusEn.length > 0
              ? edu.focusEn
              : edu.focus || [];
          const statusLabel =
            currentLang === "en" && edu.statusEn ? edu.statusEn : edu.status;

          // Logo scale: active grows (1.12x), inactive (0.92x)
          const logoScale = prefersReducedMotion
            ? 1
            : isActive
            ? 1.14
            : 0.94;

          return (
            <div
              key={edu.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`snap-center shrink-0 w-[88vw] sm:w-[420px] lg:w-[460px] rounded-2xl border bg-white p-5 sm:p-6 shadow-2xs transition-[border-color,box-shadow,opacity] duration-300 dark:bg-[#111422] ${
                isActive
                  ? "border-brand shadow-lg ring-1 ring-brand/20 dark:border-blue-500/80 dark:ring-blue-500/20 opacity-100"
                  : "border-line/80 hover:border-brand/40 opacity-80 hover:opacity-100 dark:border-line/50"
              }`}
            >
              {/* Card Header: Logo, Institution, Status */}
              <div className="flex items-start gap-4">
                {/* Fixed container for Institution Logo with smooth scale */}
                <div className="relative size-14 sm:size-16 rounded-xl border border-line/60 bg-slate-50/90 dark:border-line/40 dark:bg-[#181d30]/80 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  {edu.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={edu.logo}
                      alt={`Logo ${edu.institution}`}
                      className="size-full object-contain will-change-transform transition-transform duration-300"
                      style={{
                        transform: `scale(${logoScale})`,
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="size-full flex items-center justify-center will-change-transform transition-transform duration-300 text-brand dark:text-blue-400"
                      style={{
                        transform: `scale(${logoScale})`,
                      }}
                    >
                      {isUniversity ? (
                        <GraduationCap className="size-8" />
                      ) : (
                        <School className="size-8" />
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-brand dark:text-blue-400">
                      #0{idx + 1} · {edu.startYear}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wide ${
                        edu.current
                          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <h3 className="mt-1 font-display text-base sm:text-lg font-bold tracking-tight text-ink truncate" title={edu.institution}>
                    {edu.institution}
                  </h3>

                  <p className="flex items-center gap-1 text-xs text-muted mt-0.5">
                    <MapPin className="size-3 shrink-0 text-muted/70" />
                    <span className="truncate">{edu.location}</span>
                  </p>
                </div>
              </div>

              {/* Major & Program Information */}
              <div className="mt-4 pt-3.5 border-t border-line/60 dark:border-line/40">
                <p className="font-display text-sm sm:text-base font-semibold text-ink">
                  {edu.program}
                </p>
                <div className="flex items-center justify-between gap-2 mt-0.5 text-xs text-muted">
                  <span>{edu.degree}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="size-3 text-muted/70" />
                    <span>{edu.period}</span>
                  </span>
                </div>
              </div>

              {/* Concise Description */}
              {edu.desc && (
                <p className="mt-3 text-xs leading-relaxed text-body line-clamp-2">
                  {edu.desc}
                </p>
              )}

              {/* Accessible Collapsible Details Toggle */}
              <div className="mt-4 pt-3 border-t border-line/50 dark:border-line/30">
                <button
                  type="button"
                  onClick={() => toggleExpand(edu.id)}
                  aria-expanded={isExpanded}
                  className="flex items-center justify-between w-full text-xs font-semibold text-brand hover:text-brand-ink dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg p-1 -m-1"
                >
                  <span>
                    {isExpanded
                      ? t("academic.hideDetails", "Sembunyikan Detail")
                      : t("academic.seeDetails", "Lihat Detail & Proyek")}
                  </span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="mt-3 space-y-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Study Focus Tags */}
                    {focusList.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-ink mb-2">
                          <BookOpen className="size-3 text-brand dark:text-blue-400" />
                          <span>
                            {t("academic.focusTitle", "Fokus Studi & Kompetensi:")}
                          </span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {focusList.map((item) => (
                            <span
                              key={item}
                              className="rounded-md border border-line/60 bg-slate-50/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-line/40 dark:bg-[#181d30]/70 dark:text-slate-300"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Relevant Academic Projects */}
                    {edu.projects && edu.projects.length > 0 && (
                      <div className="border-t border-line/40 pt-3 dark:border-line/30">
                        <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-ink mb-2">
                          <FolderGit2 className="size-3 text-brand dark:text-blue-400" />
                          <span>
                            {t("academic.projectsTitle", "Proyek Akademik Relevan:")}
                          </span>
                        </h4>
                        <div className="space-y-2">
                          {edu.projects.map((proj) => (
                            <div
                              key={proj.title}
                              className="rounded-lg border border-line/60 bg-slate-50/60 p-2.5 text-xs dark:border-line/30 dark:bg-[#181d30]/50"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-ink text-[11px]">
                                  {proj.title}
                                </span>
                                {proj.repo && (
                                  <a
                                    href={proj.repo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand hover:underline dark:text-blue-400 shrink-0"
                                  >
                                    <span>Repo</span>
                                    <ArrowUpRight className="size-2.5" />
                                  </a>
                                )}
                              </div>
                              {proj.desc && (
                                <p className="mt-1 text-[11px] leading-relaxed text-body">
                                  {proj.desc}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Institution Website */}
                    {edu.website && (
                      <div className="pt-2 border-t border-line/30">
                        <a
                          href={edu.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-brand dark:hover:text-blue-400 transition-colors"
                        >
                          <ExternalLink className="size-3" />
                          <span>Kunjungi Website Resmi Institusi</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
