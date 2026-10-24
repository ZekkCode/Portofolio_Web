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
  speed?: number; // e.g. -0.2 to 0.2 (negative = rises faster, positive = lags behind)
  align?: "center" | "top"; // "top" for hero/top-of-page elements, "center" for page sections
  className?: string;
  style?: CSSProperties;
  scrub?: boolean | number;
}

export function Parallax({
  children,
  speed = 0.1,
  align = "center",
  className = "",
  style,
  scrub = true,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const yMovement = speed * 450;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          y: align === "top" ? 0 : -yMovement * 0.5,
        },
        {
          y: align === "top" ? yMovement : yMovement * 0.5,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: align === "top" ? "top top" : "top bottom",
            end: align === "top" ? "bottom top" : "bottom top",
            scrub: scrub === true ? 0.6 : scrub,
            invalidateOnRefresh: true,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [align, speed, scrub]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`} style={style}>
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
  scrub = true,
  pin = false,
}: ScrollScrubProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      const scrollTriggerConfig: ScrollTrigger.Vars = {
        trigger: el,
        start,
        end,
        scrub: scrub === true ? 0.6 : scrub,
        pin,
        invalidateOnRefresh: true,
      };

      if (from) {
        gsap.fromTo(
          el,
          from,
          {
            ...to,
            ease: "none",
            scrollTrigger: scrollTriggerConfig,
          }
        );
      } else {
        gsap.to(el, {
          ...to,
          ease: "none",
          scrollTrigger: scrollTriggerConfig,
        });
      }
    }, ref);

    return () => ctx.revert();
  }, [from, to, start, end, scrub, pin]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`} style={style}>
      {children}
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
  speed = 0.15,
  align = "center",
  className = "",
}: ParallaxFloatingBadgeProps) {
  return (
    <Parallax speed={speed} align={align} className={`pointer-events-none select-none ${className}`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur-md">
        <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
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

