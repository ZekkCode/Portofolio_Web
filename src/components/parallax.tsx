"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useLenis } from "lenis/react";

interface ParallaxProps {
  children: ReactNode;
  speed?: number; // e.g. -0.2 to 0.2 (negative = rises faster, positive = lags behind)
  className?: string;
  style?: CSSProperties;
}

export function Parallax({
  children,
  speed = 0.1,
  className = "",
  style,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLenis(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Viewport cull
    if (rect.bottom < -150 || rect.top > windowHeight + 150) return;

    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    const offset = (elementCenter - viewportCenter) * speed;

    el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  });

  return (
    <div ref={ref} className={`will-change-transform ${className}`} style={style}>
      {children}
    </div>
  );
}

interface ParallaxFloatingBadgeProps {
  label: string;
  speed?: number;
  className?: string;
}

export function ParallaxFloatingBadge({
  label,
  speed = 0.15,
  className = "",
}: ParallaxFloatingBadgeProps) {
  return (
    <Parallax speed={speed} className={`pointer-events-none select-none ${className}`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/90 px-3.5 py-1.5 text-xs font-medium text-body backdrop-blur-md">
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
