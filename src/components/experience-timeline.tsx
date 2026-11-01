"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { profile } from "@/lib/profile";
import {
  Briefcase,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function ExperienceTimeline() {
  const items = profile.experience;
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll));
    setScrollProgress(progress);

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
    const container = containerRef.current;
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

  const scrollToIndex = useCallback((index: number) => {
    const card = cardRefs.current[index];
    const container = containerRef.current;
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
    if (activeIndex > 0) scrollToIndex(activeIndex - 1);
  }, [activeIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    if (activeIndex < items.length - 1) scrollToIndex(activeIndex + 1);
  }, [activeIndex, items.length, scrollToIndex]);

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

  return (
    <div className="relative w-full overflow-hidden" aria-label="Riwayat Organisasi & Karir">
      {/* Top Controls: Title / Indicators & Nav Buttons */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-brand dark:text-blue-400" />
          <span className="font-display text-sm font-bold text-ink">
            Aktivitas Organisasi Kampus
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={activeIndex === 0}
            aria-label="Pengalaman Sebelumnya"
            className="group flex size-8 sm:size-9 items-center justify-center rounded-lg border border-line bg-white/80 text-ink shadow-2xs backdrop-blur-xs transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/40 dark:bg-[#111422]/80 dark:text-slate-200"
          >
            <ChevronLeft className="size-3.5 sm:size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transform-none" />
          </button>
          <span className="font-mono text-xs font-bold text-muted px-1">
            0{activeIndex + 1} / 0{items.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={activeIndex === items.length - 1}
            aria-label="Pengalaman Selanjutnya"
            className="group flex size-8 sm:size-9 items-center justify-center rounded-lg border border-line bg-white/80 text-ink shadow-2xs backdrop-blur-xs transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/40 dark:bg-[#111422]/80 dark:text-slate-200"
          >
            <ChevronRight className="size-3.5 sm:size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL TIMELINE TRACK WITH MILESTONE NODES */}
      <div className="relative w-full py-4 mb-4 select-none">
        {/* Background Track Line */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-line/80 dark:bg-line/40 rounded-full"
          aria-hidden="true"
        />
        {/* Fill Progress Line (scaleX from Left to Right) */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand dark:bg-blue-500 rounded-full origin-left will-change-transform transition-transform duration-150"
          style={{
            width: "100%",
            transform: `scaleX(${scrollProgress})`,
          }}
          aria-hidden="true"
        />

        {/* Milestone Node Points */}
        <div className="relative flex justify-between items-center w-full z-10 px-2 sm:px-6">
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            const nodeScale = prefersReducedMotion ? 1 : isActive ? 1.25 : 0.95;

            return (
              <button
                key={item.org}
                type="button"
                onClick={() => scrollToIndex(idx)}
                aria-label={`Milestone ${item.org} — ${item.role}`}
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
        tabIndex={0}
        role="region"
        aria-label="Daftar Pengalaman Karir & Organisasi"
        className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pt-1 pb-4 px-1 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, idx) => {
          const isActive = idx === activeIndex;

          return (
            <div
              key={item.org}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`snap-center shrink-0 w-[84vw] sm:w-[320px] md:w-[350px] rounded-xl border bg-white p-4 sm:p-5 shadow-2xs transition-[border-color,box-shadow,opacity] duration-300 dark:bg-[#111422] ${
                isActive
                  ? "border-brand shadow-md ring-1 ring-brand/20 dark:border-blue-500/80 dark:ring-blue-500/20 opacity-100"
                  : "border-line/80 hover:border-brand/40 opacity-80 hover:opacity-100 dark:border-line/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted">
                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="size-3 text-muted/70" />
                  <span>{item.period}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <MapPin className="size-3 text-muted/70" />
                  <span>{item.place}</span>
                </span>
              </div>

              <h4 className="mt-2.5 font-display text-sm sm:text-base font-bold text-ink tracking-tight">
                {item.role}
              </h4>

              <p className="mt-0.5 text-xs font-semibold text-brand dark:text-blue-400">
                {item.org}
              </p>

              <p className="mt-2 text-xs leading-relaxed text-body line-clamp-3">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
