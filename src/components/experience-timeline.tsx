"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/lib/profile";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ExperienceTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        reduceMotion: "(prefers-reduced-motion: reduce)",
        default: "(prefers-reduced-motion: no-preference)",
      },
      (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        if (reduceMotion) {
          gsap.set(line, { scaleY: 1 });
          return;
        }

        // Animate progress line scaleY smoothly tracking scroll progress through the timeline container
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top 75%",
              end: "bottom 65%",
              scrub: 0.3,
            },
          }
        );
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Background Track Line: centered at 6px */}
      <div
        className="absolute start-[5px] top-2 bottom-2 w-0.5 rounded-full bg-line/70 dark:bg-line/40"
        aria-hidden="true"
      />
      {/* Scroll-Linked Active Progress Line */}
      <div
        ref={lineRef}
        className="absolute start-[5px] top-2 bottom-2 w-0.5 origin-top rounded-full bg-brand will-change-transform dark:bg-blue-500"
        aria-hidden="true"
      />

      <ol className="space-y-6">
        {profile.experience.map((item) => (
          <li key={item.org} className="group relative ps-7">
            {/* Milestone Dot on Track: 10px centered at 6px */}
            <span
              className="absolute start-[1px] top-1.5 size-2.5 rounded-full border-2 border-white bg-brand shadow-xs transition-transform duration-200 group-hover:scale-125 dark:border-[#08090e] dark:bg-blue-500"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-muted">
              <span>{item.period}</span>
              <span aria-hidden="true">·</span>
              <span>{item.place}</span>
            </div>
            <h4 className="mt-1 font-display text-sm font-bold text-ink">
              {item.role}
            </h4>
            <p className="text-xs font-semibold text-brand dark:text-blue-400">
              {item.org}
            </p>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-body">
              {item.desc}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

