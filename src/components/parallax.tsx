"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useLenis } from "lenis/react";

interface ParallaxProps {
  children: ReactNode;
  speed?: number; // e.g. -0.2 to 0.2 (negative = rises faster, positive = lags behind)
  align?: "center" | "top"; // "top" for hero/top-of-page elements, "center" for page sections
  className?: string;
  style?: CSSProperties;
}

export function Parallax({
  children,
  speed = 0.1,
  align = "center",
  className = "",
  style,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLenis((lenis) => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      el.style.transform = "";
      return;
    }

    const windowHeight = window.innerHeight;

    if (align === "top") {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > windowHeight + 200) return;
      const scrollY = lenis ? lenis.scroll : window.scrollY;
      const offset = scrollY * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      return;
    }

    const currentOffset = parseFloat(el.dataset.parallaxOffset || "0");
    const rect = el.getBoundingClientRect();

    // Viewport cull
    if (rect.bottom < -150 || rect.top > windowHeight + 150) return;

    const naturalTop = rect.top - currentOffset;
    const naturalCenter = naturalTop + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    const offset = (naturalCenter - viewportCenter) * speed;

    el.dataset.parallaxOffset = String(offset);
    el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (align === "top") {
      const scrollY = window.scrollY;
      const offset = scrollY * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    }
  }, [align, speed]);

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

