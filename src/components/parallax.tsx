"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ParallaxProps {
  children: ReactNode;
  speed?: number; // e.g. -0.3 to 0.3 (negative = rises faster, positive = lags behind)
  offset?: number; // explicit pixel translation override
  align?: "center" | "top"; // "top" for hero/top-of-page elements, "center" for page sections
  className?: string;
  style?: CSSProperties;
  scrub?: boolean | number;
}

/**
 * Two-layer Parallax component:
 * Outer div is the static ScrollTrigger trigger (zero layout shift/jitter).
 * Inner div receives the smooth scrubbed translateY.
 */
export function Parallax({
  children,
  speed = 0.2,
  offset,
  align = "center",
  className = "",
  style,
  scrub = 0.7,
}: ParallaxProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Tangible distance: speed * 550 or explicit pixel offset
    const distance = typeof offset === "number" ? offset : speed * 550;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content,
        {
          y: align === "top" ? 0 : -distance * 0.5,
        },
        {
          y: align === "top" ? distance : distance * 0.5,
          ease: "none",
          scrollTrigger: {
            trigger,
            start: align === "top" ? "top top" : "top bottom",
            end: align === "top" ? "bottom top" : "bottom top",
            scrub: typeof scrub === "number" ? scrub : 0.7,
            invalidateOnRefresh: true,
          },
        }
      );
    }, triggerRef);

    return () => ctx.revert();
  }, [align, speed, scrub, offset]);

  return (
    <div ref={triggerRef} className={className} style={style}>
      <div ref={contentRef} className="will-change-transform h-full w-full">
        {children}
      </div>
    </div>
  );
}

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  y?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
}

/**
 * ScrollReveal component:
 * Fades and slides elements upward as they enter the viewport.
 */
export function ScrollReveal({
  children,
  className = "",
  style,
  y = 32,
  duration = 0.85,
  delay = 0,
  stagger = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [y, duration, delay, stagger]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

export interface ScrollScrubProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
}

export function ScrollScrub({
  children,
  className = "",
  style,
  from,
  to = {},
  start = "top bottom",
  end = "bottom top",
  scrub = 0.7,
  pin = false,
}: ScrollScrubProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      const scrollTriggerConfig: ScrollTrigger.Vars = {
        trigger,
        start,
        end,
        scrub: typeof scrub === "number" ? scrub : 0.7,
        pin,
        invalidateOnRefresh: true,
      };

      if (from) {
        gsap.fromTo(
          content,
          from,
          {
            ...to,
            ease: "none",
            scrollTrigger: scrollTriggerConfig,
          }
        );
      } else {
        gsap.to(content, {
          ...to,
          ease: "none",
          scrollTrigger: scrollTriggerConfig,
        });
      }
    }, triggerRef);

    return () => ctx.revert();
  }, [from, to, start, end, scrub, pin]);

  return (
    <div ref={triggerRef} className={className} style={style}>
      <div ref={contentRef} className="will-change-transform h-full w-full">
        {children}
      </div>
    </div>
  );
}

interface ParallaxFloatingBadgeProps {
  label: string;
  speed?: number;
  align?: "center" | "top";
  className?: string;
}

export function ParallaxFloatingBadge({
  label,
  speed = -0.2,
  align = "top",
  className = "",
}: ParallaxFloatingBadgeProps) {
  return (
    <Parallax speed={speed} align={align} className={`pointer-events-none select-none ${className}`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur-md dark:border-line/60 dark:bg-[#111422]/95">
        <span className="size-1.5 rounded-full bg-brand animate-ping" aria-hidden="true" />
        {label}
      </span>
    </Parallax>
  );
}

export function useSmoothScrollTo() {
  const lenis = useLenis();

  const scrollTo = (target: string | HTMLElement, offset = -88) => {
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    } else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  return scrollTo;
}

export function SmoothNavLink({
  href,
  children,
  className = "",
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const scrollTo = useSmoothScrollTo();

  return (
    <a
      href={href}
      onClick={(e) => {
        if (href.startsWith("#")) {
          e.preventDefault();
          scrollTo(href);
          onClick?.();
        }
      }}
      className={className}
    >
      {children}
    </a>
  );
}
