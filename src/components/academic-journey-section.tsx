"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SectionTitle } from "@/components/section-title";
import { ScrollReveal } from "@/components/parallax";
import { useSiteConfig, defaultEducation, type EducationItem } from "@/lib/site-store";
import {
  MapPin,
  Calendar,
  BookOpen,
  FolderGit2,
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function AcademicJourneySection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const { education } = useSiteConfig();

  // Use configured education or fallback to authentic default records (sorted chronologically ascending for left-to-right flow)
  const items: EducationItem[] = useMemo(() => {
    const list = education && education.length > 0 ? [...education] : [...defaultEducation];
    return list.sort((a, b) => (a.startYear || 0) - (b.startYear || 0));
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
  const activeIndexRef = useRef(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  });

  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const maxScrollRef = useRef(0);
  const manualOverrideUntilRef = useRef(0);

  const markManualOverride = useCallback(() => {
    manualOverrideUntilRef.current = performance.now() + 2000;
  }, []);

  const commitActiveIndex = useCallback((idx: number) => {
    if (activeIndexRef.current !== idx) {
      activeIndexRef.current = idx;
      setActiveIndex(idx);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Parallax scroll: scrub horizontal timeline based on vertical page scroll without per-frame React re-renders
  useEffect(() => {
    const section = sectionRef.current;
    const container = scrollContainerRef.current;
    if (!section || !container) return;

    if (prefersReducedMotion) {
      if (progressBarRef.current) progressBarRef.current.style.transform = "scaleX(1)";
      return;
    }

    const updateBounds = () => {
      maxScrollRef.current = Math.max(0, container.scrollWidth - container.clientWidth);
    };
    updateBounds();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateBounds) : null;
    ro?.observe(container);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 82%",
        end: "bottom 22%",
        scrub: 0.65,
        invalidateOnRefresh: true,
        onRefresh: updateBounds,
        onUpdate: (self) => {
          const p = self.progress;
          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${p})`;
          }

          if (performance.now() < manualOverrideUntilRef.current) {
            return;
          }

          const activeIdx = Math.min(
            items.length - 1,
            Math.max(0, Math.floor(p * items.length + 0.15))
          );
          commitActiveIndex(activeIdx);

          const maxScroll = maxScrollRef.current;
          if (maxScroll > 0) {
            container.scrollLeft = maxScroll * p;
          }
        },
      });

      const validCards = cardRefs.current.filter((c): c is HTMLDivElement => Boolean(c));
      if (validCards.length > 0) {
        gsap.fromTo(
          validCards,
          {
            x: (i: number) => (i + 1) * -42,
            opacity: 0.72,
          },
          {
            x: 0,
            opacity: 1,
            ease: "power1.out",
            force3D: true,
            scrollTrigger: {
              trigger: section,
              start: "top 86%",
              end: "bottom 38%",
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => {
      ro?.disconnect();
      ctx.revert();
    };
  }, [items.length, prefersReducedMotion, commitActiveIndex]);

  // Click on year jump
  const handleYearClick = useCallback(
    (year: number) => {
      const itemIndex = items.findIndex((e) => e.startYear === year);
      const container = scrollContainerRef.current;
      if (itemIndex !== -1) {
        manualOverrideUntilRef.current = performance.now() + 2600;
        commitActiveIndex(itemIndex);
        const card = cardRefs.current[itemIndex];
        if (card && container) {
          container.scrollTo({
            left: Math.max(0, card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2),
            behavior: "smooth",
          });
        }
      }
    },
    [items, commitActiveIndex]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        manualOverrideUntilRef.current = performance.now() + 2600;
        container.scrollBy({ left: -300, behavior: "smooth" });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        manualOverrideUntilRef.current = performance.now() + 2600;
        container.scrollBy({ left: 300, behavior: "smooth" });
      }
    },
    []
  );

  const handleTrackWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        markManualOverride();
      }
    },
    [markManualOverride]
  );

  const activeEdu = items[activeIndex] || items[0];
  const activeYear = activeEdu?.startYear || new Date().getFullYear();

  return (
    <section
      ref={sectionRef}
      id="akademik"
      className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20 overflow-hidden"
      aria-label={t("academic.title", "Jejak Akademik")}
    >
      {/* Anchor aliases for friendly URL navigation */}
      <div id="academic" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div id="pendidikan" className="absolute top-0 -mt-24" aria-hidden="true" />

      <ScrollReveal y={24}>
        <SectionTitle
          title={t("academic.title", "Jejak Akademik")}
          desc={t(
            "academic.desc",
            "Latar belakang pendidikan formal dan bidang keilmuan yang menjadi fondasi rekayasa digital."
          )}
        />
      </ScrollReveal>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line/70 bg-white/60 p-8 text-center dark:border-line/40 dark:bg-[#111422]/60">
          <p className="text-sm font-medium text-muted">Belum ada riwayat pendidikan yang ditampilkan.</p>
        </div>
      ) : (
        <>
          {/* HORIZONTAL YEAR-BASED TIMELINE TRACK */}
          <div className="relative mt-8 sm:mt-10 mb-6 sm:mb-8 select-none">
        {/* Track Progress Line */}
        <div className="relative w-full py-4">
          {/* Background Track Line */}
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-line/80 dark:bg-line/40 rounded-full"
            aria-hidden="true"
          />
          {/* Scroll-Linked Fill Progress Line (scaleX from Left to Right via ref — 0 re-renders) */}
          <div
            ref={progressBarRef}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand dark:bg-blue-500 rounded-full origin-left"
            style={{
              width: "100%",
              transform: prefersReducedMotion ? "scaleX(1)" : "scaleX(0)",
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

      {/* HORIZONTAL CARDS CAROUSEL (PARALLAX DRIVEN) */}
      <div
        ref={scrollContainerRef}
        onKeyDown={handleKeyDown}
        onWheel={handleTrackWheel}
        onPointerDown={markManualOverride}
        onTouchStart={markManualOverride}
        tabIndex={0}
        role="region"
        aria-label="Daftar Kartu Jejak Akademik"
        className="flex gap-5 sm:gap-6 overflow-x-auto pt-2 pb-6 px-1 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-2xl"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((edu, idx) => {
          const isActive = idx === activeIndex;
          const isExpanded = Boolean(expanded[edu.id]);
          const focusList =
            currentLang === "en" && edu.focusEn && edu.focusEn.length > 0
              ? edu.focusEn
              : edu.focus || [];
          const statusLabel =
            currentLang === "en" && edu.statusEn ? edu.statusEn : edu.status;
          const initials = (edu.institution || "ED")
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w[0])
            .slice(0, 3)
            .join("")
            .toUpperCase();

          const logoScale = prefersReducedMotion
            ? 1
            : isActive
            ? 1.08
            : 0.96;

          return (
            <div
              key={edu.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`shrink-0 w-[88vw] sm:w-[420px] lg:w-[460px] rounded-2xl border bg-white p-5 sm:p-6 shadow-2xs transition-[border-color,box-shadow] duration-300 dark:bg-[#111422] ${
                isActive
                  ? "border-brand shadow-lg ring-1 ring-brand/20 dark:border-blue-500/80 dark:ring-blue-500/20 opacity-100"
                  : "border-line/80 hover:border-brand/40 opacity-85 hover:opacity-100 dark:border-line/50"
              }`}
            >
              {/* Card Header: Institution First, Logo & Understated Status */}
              <div className="flex items-start gap-3.5">
                <div className="relative size-11 rounded-xl border border-line/60 bg-slate-50/90 dark:border-line/40 dark:bg-[#181d30]/80 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                  {edu.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={edu.logo}
                      alt={`Logo ${edu.institution}`}
                      className="size-full object-contain transition-transform duration-300"
                      style={{
                        transform: `scale(${logoScale})`,
                      }}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span
                      className="font-mono text-[11px] font-bold tracking-tight text-brand dark:text-blue-400 transition-transform duration-300 select-none"
                      style={{
                        transform: `scale(${logoScale})`,
                      }}
                    >
                      {initials}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base sm:text-lg font-bold text-ink tracking-tight leading-snug">
                      {edu.institution}
                    </h3>
                    {statusLabel && (
                      <span
                        className={`inline-flex items-center gap-1.5 shrink-0 pt-0.5 text-[11px] font-medium ${
                          edu.current
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted"
                        }`}
                      >
                        {edu.current && (
                          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        )}
                        <span>{statusLabel}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="size-3 shrink-0" />
                      <span>
                        {edu.startYear} —{" "}
                        {edu.current
                          ? currentLang === "en"
                            ? "Present"
                            : "Sekarang"
                          : edu.endYear}
                      </span>
                    </span>
                    {edu.location && (
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{edu.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Major / Program & Degree */}
              <div className="mt-4 pt-3.5 border-t border-line/60 dark:border-line/40">
                <h4 className="font-display text-sm sm:text-base font-bold text-ink">
                  {edu.program}
                </h4>
                {edu.degree && (
                  <p className="mt-0.5 text-xs text-muted font-medium">
                    {edu.degree}
                  </p>
                )}
              </div>

              {/* Brief Description */}
              {edu.desc && (
                <p className="mt-3 text-xs leading-relaxed text-body line-clamp-3">
                  {edu.desc}
                </p>
              )}

              {/* Collapsible Disclosure Button */}
              <button
                type="button"
                onClick={() => toggleExpand(edu.id)}
                aria-expanded={isExpanded}
                aria-controls={`disclosure-${edu.id}`}
                className="mt-4 flex w-full items-center justify-between py-1 text-xs font-semibold text-brand dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
              >
                <span>
                  {isExpanded
                    ? currentLang === "en"
                      ? "Hide Details"
                      : "Sembunyikan Rincian"
                    : currentLang === "en"
                    ? "View Details & Projects"
                    : "Lihat Detail & Proyek"}
                </span>
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Collapsible Details Content */}
              {isExpanded && (
                <div
                  id={`disclosure-${edu.id}`}
                  className="mt-3 pt-3 border-t border-line/50 space-y-3.5 text-xs"
                >
                  {/* Study Focus */}
                  {focusList.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-ink mb-1.5">
                        <BookOpen className="size-3.5 text-brand" />
                        <span>
                          {currentLang === "en"
                            ? "Core Study Focus"
                            : "Fokus Studi & Keilmuan"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {focusList.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-line/70 bg-surface/80 px-2 py-0.5 text-[11px] font-medium text-body dark:border-line/40 dark:bg-slate-800/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Academic Projects */}
                  {edu.projects && edu.projects.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-ink mb-2">
                        <FolderGit2 className="size-3.5 text-brand" />
                        <span>
                          {currentLang === "en"
                            ? "Academic Projects"
                            : "Proyek & Riset Terkait"}
                        </span>
                      </div>
                      <div className="divide-y divide-line/50 dark:divide-line/30">
                        {edu.projects.map((proj) => (
                          <div
                            key={proj.title}
                            className="py-2 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-ink truncate">
                                {proj.title}
                              </span>
                              {proj.repo && (
                                <a
                                  href={proj.repo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline shrink-0"
                                >
                                  <span>Repo</span>
                                  <ArrowUpRight className="size-3" />
                                </a>
                              )}
                            </div>
                            {proj.desc && (
                              <p className="mt-0.5 text-[11px] text-body leading-relaxed">
                                {proj.desc}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Official Website */}
                  {edu.website && (
                    <div className="pt-1">
                      <a
                        href={edu.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>
                          {currentLang === "en"
                            ? "Visit Institution Website"
                            : "Kunjungi Situs Resmi"}
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}
    </section>
  );
}
