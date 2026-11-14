"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSiteConfig, type ExperienceItem } from "@/lib/site-store";
import { getPublishedExperience } from "@/lib/content/selectors";
import { Briefcase, MapPin, Calendar, ExternalLink, ChevronDown } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ExperienceTimeline() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.language || "id") === "en";
  const locale = isEn ? "en" : "id";
  const config = useSiteConfig();

  const items = useMemo(
    () => getPublishedExperience(config, locale),
    [config, locale]
  );

  // Hitung berapa banyak posisi terkait untuk institusi yang sama (orgGroup / org)
  const orgCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const key = (item.orgGroup || item.org || "").trim().toLowerCase();
      if (key) map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [items]);

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const toggleCardDetail = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  });

  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const maxScrollRef = useRef(0);
  const manualOverrideUntilRef = useRef(0);

  const commitActiveIndex = useCallback((idx: number) => {
    if (activeIndexRef.current !== idx) {
      activeIndexRef.current = idx;
      setActiveIndex(idx);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches && progressBarRef.current) {
        progressBarRef.current.style.transform = "scaleX(1)";
      }
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Parallax scroll: scrub horizontal timeline based on vertical page scroll without per-frame React re-renders
  useEffect(() => {
    const timeline = timelineRef.current;
    const container = containerRef.current;
    if (!timeline || !container || items.length === 0) return;

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
      let lastAppliedLeft = -1;
      ScrollTrigger.create({
        trigger: timeline,
        start: "top 68%",
        end: "bottom 20%",
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
            const targetLeft = maxScroll * p;
            if (Math.abs(targetLeft - lastAppliedLeft) >= 1) {
              lastAppliedLeft = targetLeft;
              container.scrollLeft = targetLeft;
            }
          }
        },
      });
    }, timelineRef);

    return () => {
      ro?.disconnect();
      ctx.revert();
    };
  }, [items.length, prefersReducedMotion, commitActiveIndex]);

  // Click on milestone node to jump
  const scrollToIndex = useCallback((index: number) => {
    const card = cardRefs.current[index];
    const container = containerRef.current;
    if (!card || !container) return;

    manualOverrideUntilRef.current = performance.now() + 2600;
    const targetLeft =
      card.offsetLeft - container.clientWidth / 2 + card.clientWidth / 2;
    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
    commitActiveIndex(index);
  }, [commitActiveIndex]);

  const markManualOverride = useCallback(() => {
    manualOverrideUntilRef.current = performance.now() + 2000;
  }, []);

  const handleTrackWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        markManualOverride();
      }
    },
    [markManualOverride]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeIndex > 0) scrollToIndex(activeIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (activeIndex < items.length - 1) scrollToIndex(activeIndex + 1);
      }
    },
    [activeIndex, items.length, scrollToIndex]
  );

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-line/70 bg-white/60 p-8 text-center dark:border-line/40 dark:bg-[#111422]/60">
        <p className="text-sm font-medium text-muted">
          {t("about.experienceEmpty", "Belum ada riwayat pengalaman yang ditampilkan.")}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={timelineRef}
      className="relative w-full overflow-hidden"
      aria-label="Riwayat Organisasi & Karir"
    >
      {/* Top Header: Title */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Briefcase className="size-4 text-brand dark:text-blue-400" />
        <span className="font-display text-sm font-bold text-ink">
          {t("about.experienceTitle", "Aktivitas Organisasi & Karir")}
        </span>
      </div>

      {/* HORIZONTAL TIMELINE TRACK WITH MILESTONE NODES */}
      <div className="relative w-full py-4 mb-4 select-none">
        {/* Background Track Line */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-line/80 dark:bg-line/40 rounded-full"
          aria-hidden="true"
        />
        {/* Fill Progress Line (direct DOM update via ref — 0 re-renders) */}
        <div
          ref={progressBarRef}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand dark:bg-blue-500 rounded-full origin-left"
          style={{
            width: "100%",
            transform: prefersReducedMotion ? "scaleX(1)" : "scaleX(0)",
          }}
          aria-hidden="true"
        />

        {/* Milestone Node Points */}
        <div className="relative flex justify-between items-center w-full z-10 px-2 sm:px-6">
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            const nodeScale = prefersReducedMotion ? 1 : isActive ? 1.25 : 0.95;
            const roleText = isEn && item.roleEn ? item.roleEn : item.role;

            return (
              <button
                key={item.id || `${item.org}-${idx}`}
                type="button"
                onClick={() => scrollToIndex(idx)}
                aria-label={`Milestone ${item.org} — ${roleText}`}
                aria-pressed={isActive}
                className="group flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg p-1 -m-1 transition-transform duration-200"
                style={{
                  transform: `scale(${nodeScale})`,
                  transformOrigin: "center center",
                }}
              >
                <div
                  className={`size-3 sm:size-3.5 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "border-brand bg-brand shadow-sm shadow-brand/40 scale-125 dark:border-blue-400 dark:bg-blue-500"
                      : "border-slate-300 bg-white hover:border-brand/60 dark:border-slate-700 dark:bg-[#111422]"
                  }`}
                />
                <span
                  className={`mt-1.5 font-mono text-[10px] sm:text-xs font-semibold tracking-tight transition-colors duration-200 truncate max-w-[100px] sm:max-w-[140px] text-center ${
                    isActive
                      ? "text-brand font-bold dark:text-blue-400"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {item.org.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL OF CAREER CARDS */}
      <div
        ref={containerRef}
        onKeyDown={handleKeyDown}
        onWheel={handleTrackWheel}
        onPointerDown={markManualOverride}
        onTouchStart={markManualOverride}
        tabIndex={0}
        role="region"
        aria-label="Daftar Pengalaman Karir & Organisasi"
        className="flex gap-4 sm:gap-5 overflow-x-auto pt-1 pb-4 px-1 scroll-px-2 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item: ExperienceItem, idx: number) => {
          const isActive = idx === activeIndex;
          const groupKey = (item.orgGroup || item.org || "").trim().toLowerCase();
          const groupCount = groupKey ? orgCounts.get(groupKey) || 1 : 1;
          const hasExtraDetails = Boolean(
            (item.responsibilities && item.responsibilities.length > 0) ||
              (item.achievements && item.achievements.length > 0) ||
              (item.media && item.media.length > 0)
          );
          const isExpanded = Boolean(expandedCards[item.id]);

          return (
            <div
              key={item.id || `${item.org}-${idx}`}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`shrink-0 w-[84vw] sm:w-[320px] md:w-[350px] rounded-xl border bg-white p-4 sm:p-5 transition-colors duration-150 dark:bg-[#111422] ${
                isActive
                  ? "border-brand dark:border-blue-500/80"
                  : "border-line/80 hover:border-brand/40 dark:border-line/50"
              }`}
            >
              <div className="flex items-start gap-3">
                {item.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.logo}
                    alt={item.org}
                    className="size-9 shrink-0 rounded-lg border border-line/60 object-contain bg-white p-1 dark:bg-slate-900"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-display text-sm sm:text-base font-bold text-ink tracking-tight">
                    {item.role}
                  </h4>

                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    {item.orgUrl ? (
                      <a
                        href={item.orgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline dark:text-blue-400"
                      >
                        <span>{item.org}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <p className="text-xs font-semibold text-brand dark:text-blue-400">
                        {item.org}
                      </p>
                    )}
                    {groupCount > 1 && (
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand dark:bg-blue-500/15 dark:text-blue-400">
                        {item.orgGroup || item.org} · {groupCount} {isEn ? "roles" : "peran"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted">
                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="size-3 text-muted/70" />
                  <span>{item.period}</span>
                </span>
                {item.place && (
                  <span className="inline-flex items-center gap-1 text-[11px]">
                    <MapPin className="size-3 text-muted/70" />
                    <span>{item.place}</span>
                  </span>
                )}
                {item.type && (
                  <span className="rounded border border-line/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                    {item.type}
                  </span>
                )}
              </div>

              <p className="mt-2.5 text-xs leading-relaxed text-body line-clamp-3">
                {item.desc}
              </p>

              {hasExtraDetails && (
                <div className="mt-3 pt-2.5 border-t border-line/50 dark:border-line/30">
                  <button
                    type="button"
                    onClick={() => toggleCardDetail(item.id)}
                    aria-expanded={isExpanded}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline dark:text-blue-400"
                  >
                    <span>
                      {isExpanded
                        ? isEn
                          ? "Hide details"
                          : "Tutup rincian"
                        : isEn
                        ? "Responsibilities & media"
                        : "Rincian & lampiran"}
                    </span>
                    <ChevronDown
                      className={`size-3 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 space-y-2 text-[11px] text-body">
                      {item.responsibilities && item.responsibilities.length > 0 && (
                        <div>
                          <span className="font-semibold text-ink">
                            {isEn ? "Responsibilities:" : "Tanggung jawab:"}
                          </span>
                          <ul className="mt-1 list-disc pl-4 space-y-0.5">
                            {item.responsibilities.map((r, rIdx) => (
                              <li key={rIdx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.achievements && item.achievements.length > 0 && (
                        <div>
                          <span className="font-semibold text-ink">
                            {isEn ? "Key Impact:" : "Pencapaian:"}
                          </span>
                          <ul className="mt-1 list-disc pl-4 space-y-0.5">
                            {item.achievements.map((a, aIdx) => (
                              <li key={aIdx}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.media && item.media.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {item.media.map((m, mIdx) => (
                            <a
                              key={mIdx}
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded border border-line/70 px-2 py-0.5 font-medium text-brand hover:underline dark:text-blue-400"
                            >
                              <span>{m.caption || `Lampiran #${mIdx + 1}`}</span>
                              <ExternalLink className="size-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
