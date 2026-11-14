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
  align?: "center" | "top" | "bottom"; // "top" for hero/top-of-page, "bottom" for footer, "center" for mid-page sections
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
  speed = 0.15,
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

    const mm = gsap.matchMedia();

    mm.add(
      {
        desktop: "(min-width: 768px)",
        mobile: "(max-width: 767px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { mobile, reduceMotion } = context.conditions as {
          desktop: boolean;
          mobile: boolean;
          reduceMotion: boolean;
        };

        if (reduceMotion) {
          gsap.set(content, { y: 0 });
          return;
        }

        // Desktop ~32-54px range for speed 0.06-0.1, Mobile ~15-26px range for crisp depth without overflow
        const baseDistance = typeof offset === "number" ? offset : speed * (mobile ? 260 : 540);
        const startY =
          align === "top"
            ? 0
            : align === "bottom"
              ? -baseDistance
              : -baseDistance * 0.5;
        const endY =
          align === "top"
            ? baseDistance
            : align === "bottom"
              ? 0
              : baseDistance * 0.5;

        gsap.fromTo(
          content,
          {
            y: startY,
          },
          {
            y: endY,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger,
              start: align === "top" ? "top top" : "top bottom",
              end: align === "bottom" ? "bottom bottom" : "bottom top",
              scrub: typeof scrub === "number" ? scrub : 0.65,
            },
          }
        );
      }
    );

    return () => mm.revert();
  }, [align, speed, scrub, offset]);

  return (
    <div ref={triggerRef} data-parallax-speed={speed} className={className} style={style}>
      <div ref={contentRef} className="h-full w-full will-change-transform">
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
  y = 24,
  duration = 0.75,
  delay = 0,
  stagger = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        mobile: "(max-width: 767px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { mobile, reduceMotion } = context.conditions as {
          mobile: boolean;
          reduceMotion: boolean;
        };

        if (reduceMotion) {
          gsap.set(el, { opacity: 1, y: 0 });
          return;
        }

        const effectiveY = mobile ? Math.min(y, 16) : y;

        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: effectiveY,
          },
          {
            opacity: 1,
            y: 0,
            duration: mobile ? Math.min(duration, 0.6) : duration,
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
      }
    );

    return () => mm.revert();
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

export function useSmoothScrollTo() {
  const lenis = useLenis();
  const lastTargetRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);
  const historyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollTo = (target: string | HTMLElement, explicitOffset?: number) => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const isString = typeof target === "string";

    // Deduplicate rapid duplicate clicks on the exact same target (< 220ms)
    if (isString && target === lastTargetRef.current && now - lastTimeRef.current < 220) {
      return;
    }
    lastTargetRef.current = isString ? target : null;
    lastTimeRef.current = now;

    // Support reduced motion: jump directly without animation
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const el = isString ? document.querySelector(target) : target;
      if (el) {
        el.scrollIntoView({ behavior: "auto" });
      }
      return;
    }

    // Scroll directly to top when target is hero / atas
    if (target === "#atas" || target === "#hero" || target === "") {
      if (lenis) {
        lenis.scrollTo(0, {
          duration: 0.85,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
      historyTimerRef.current = setTimeout(() => {
        try {
          if (window.location.hash !== "#atas") {
            window.history.replaceState(null, "", "#atas");
          }
        } catch {}
      }, 200);
      return;
    }

    // Dynamic header measurement: standardizes offset across desktop and mobile
    const header = document.querySelector("header");
    const headerHeight = header ? header.getBoundingClientRect().height : 64;
    const defaultOffset = -(headerHeight + 16);
    const offset = typeof explicitOffset === "number" ? explicitOffset : defaultOffset;

    if (lenis) {
      lenis.scrollTo(target, {
        offset,
        duration: 0.85,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      const el = isString ? document.querySelector(target) : target;
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }

    // Debounced URL hash replacement prevents history queue overflow / browser hang
    if (isString && target.startsWith("#")) {
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
      historyTimerRef.current = setTimeout(() => {
        try {
          if (window.location.hash !== target) {
            window.history.replaceState(null, "", target);
          }
        } catch {}
      }, 200);
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
