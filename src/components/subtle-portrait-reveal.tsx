"use client";

import { useEffect, useRef, useState } from "react";

export interface SubtlePortraitRevealProps {
  isDark?: boolean;
  prefersReducedMotion?: boolean;
}

/**
 * Subtle Monochrome Portrait Reveal
 *
 * Menggantikan efek kotak-kotak biru interaktif dengan lapisan potret monokrom berukuran besar
 * yang terungkap secara sangat samar (subtle) di sekitar kursor pengguna melalui radial mask lembut.
 *
 * Karakteristik Performa & Aksesibilitas:
 * - Ditunda hingga interaksi kursor/sentuhan pertama agar gambar dekoratif tidak pernah mengambil alih kandidat LCP Hero.
 * - 100% bebas React setState pada pointermove: posisi dan opacity diperbarui langsung via CSS variables.
 * - Menggunakan requestAnimationFrame untuk compositing GPU yang mulus.
 * - pointer-events: none & aria-hidden="true" sehingga tidak mengganggu interaksi tautan, tombol, atau 3D lanyard.
 * - Menghormati prefers-reduced-motion.
 */
export function SubtlePortraitReveal({
  isDark = false,
  prefersReducedMotion = false,
}: SubtlePortraitRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || activated || typeof window === "undefined") return;

    const enable = () => setActivated(true);
    window.addEventListener("pointermove", enable, { once: true, passive: true });
    window.addEventListener("pointerdown", enable, { once: true, passive: true });
    window.addEventListener("touchstart", enable, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointermove", enable);
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("touchstart", enable);
    };
  }, [activated, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion || !activated) return;
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let clickTimeoutId: NodeJS.Timeout | null = null;
    let touchFadeTimeoutId: NodeJS.Timeout | null = null;

    // Nilai tuning:
    // Light mode: foto charcoal sangat samar di atas background terang
    // Dark mode: foto perak/zinc samar di atas background gelap
    const hoverOpacity = isDark ? 0.075 : 0.055;
    const clickOpacity = isDark ? 0.11 : 0.095;
    const defaultRadius = 230;
    const clickRadius = 265;

    let targetX = -999;
    let targetY = -999;
    const currentRadius = defaultRadius;
    let isHovering = false;
    let isClicking = false;

    const applyStyles = () => {
      if (!container) return;
      container.style.setProperty("--reveal-x", `${targetX}px`);
      container.style.setProperty("--reveal-y", `${targetY}px`);
      container.style.setProperty(
        "--reveal-opacity",
        isHovering ? (isClicking ? `${clickOpacity}` : `${hoverOpacity}`) : "0"
      );
      container.style.setProperty(
        "--reveal-radius",
        `${isClicking ? clickRadius : currentRadius}px`
      );
      rafId = null;
    };

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(applyStyles);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      isHovering = true;
      scheduleUpdate();
    };

    const onPointerDown = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      isHovering = true;
      isClicking = true;
      scheduleUpdate();

      if (clickTimeoutId) clearTimeout(clickTimeoutId);
      clickTimeoutId = setTimeout(() => {
        isClicking = false;
        scheduleUpdate();
      }, 400);
    };

    const onPointerLeave = () => {
      isHovering = false;
      isClicking = false;
      scheduleUpdate();
    };

    // Mobile / Touch support: reveal singkat saat layar disentuh
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
        isHovering = true;
        isClicking = true;
        scheduleUpdate();

        if (touchFadeTimeoutId) clearTimeout(touchFadeTimeoutId);
        touchFadeTimeoutId = setTimeout(() => {
          isClicking = false;
          isHovering = false;
          scheduleUpdate();
        }, 700);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
        isHovering = true;
        scheduleUpdate();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        isHovering = false;
        isClicking = false;
        scheduleUpdate();
      }
    };

    // Event listener dipasang pada window dengan flag passive agar tidak memblokir gesture/scroll
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (clickTimeoutId) clearTimeout(clickTimeoutId);
      if (touchFadeTimeoutId) clearTimeout(touchFadeTimeoutId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [activated, isDark, prefersReducedMotion]);

  if (prefersReducedMotion || !activated) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      style={
        {
          "--reveal-x": "-999px",
          "--reveal-y": "-999px",
          "--reveal-opacity": "0",
          "--reveal-radius": "230px",
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-out will-change-[opacity]"
        style={{
          opacity: "var(--reveal-opacity, 0)",
          WebkitMaskImage:
            "radial-gradient(circle var(--reveal-radius, 230px) at var(--reveal-x, -999px) var(--reveal-y, -999px), black 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.18) 75%, transparent 100%)",
          maskImage:
            "radial-gradient(circle var(--reveal-radius, 230px) at var(--reveal-x, -999px) var(--reveal-y, -999px), black 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.18) 75%, transparent 100%)",
        }}
      >
        {/*
          Foto background proporsional tanpa perulangan atau distorsi.
          - Light mode: filter grayscale + contrast subtle, blend multiply (nuansa charcoal halus).
          - Dark mode: filter grayscale + contrast + boost luminance, blend screen (nuansa silver/zinc halus).
          Wajah dan tekstur pakaian tetap utuh tanpa siluet hitam pekat.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/bg-portrait-reveal.webp"
          alt=""
          width={800}
          height={1050}
          loading="lazy"
          decoding="async"
          draggable={false}
          className={`h-[90vh] max-h-[1050px] w-auto max-w-[92vw] object-contain select-none pointer-events-none transition-[filter] duration-300 ${
            isDark
              ? "brightness-[1.3] contrast-[1.12] grayscale [mix-blend-mode:screen]"
              : "brightness-[0.88] contrast-[1.14] grayscale [mix-blend-mode:multiply]"
          }`}
        />
      </div>
    </div>
  );
}
