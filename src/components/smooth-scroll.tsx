"use client";

import { useEffect, useMemo, useRef } from "react";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { useAdaptivePerformance } from "@/lib/device-performance";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function ScrollTriggerBridge() {
  const lenis = useLenis();

  // 1. Sinkronisasi Lenis scroll event dengan ScrollTrigger.update
  useLenis(() => {
    ScrollTrigger.update();
  });

  // 2. Navigasi Anchor (#cv, #proyek, dll) & Browser Back/Forward history
  useEffect(() => {
    if (!lenis || typeof window === "undefined") return;

    // Gulir langsung ke target anchor bila halaman dibuka dengan hash
    const initialHash = window.location.hash;
    if (initialHash) {
      const scrollToHash = (immediate = true) => {
        const targetEl = document.querySelector(initialHash);
        if (targetEl) {
          const header = document.querySelector("header");
          const headerHeight = header ? header.getBoundingClientRect().height : 64;
          const offset = -(headerHeight + 16);
          lenis.scrollTo(targetEl as HTMLElement, { offset, immediate });
        }
      };

      // 1. Initial attempt
      requestAnimationFrame(() => scrollToHash(true));

      // 2. Re-scroll when fonts are ready (prevents font load layout shift)
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          requestAnimationFrame(() => scrollToHash(true));
        }).catch(() => {});
      }

      // 3. Re-scroll on window load (when Three.js, images, and full layout settle)
      window.addEventListener("load", () => {
        requestAnimationFrame(() => scrollToHash(true));
      }, { once: true });
    }

    // Tangani navigasi mundur/maju di browser
    const handlePopState = () => {
      const currentHash = window.location.hash;
      if (currentHash) {
        const header = document.querySelector("header");
        const headerHeight = header ? header.getBoundingClientRect().height : 64;
        const offset = -(headerHeight + 16);
        lenis.scrollTo(currentHash, { offset });
      } else {
        lenis.scrollTo(0, { offset: 0 });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [lenis]);

  // 3. Coalesced, loop-safe ScrollTrigger.refresh only on genuine layout changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    ScrollTrigger.config({ ignoreMobileResize: true });

    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let refreshRaf = 0;
    let isRefreshing = false;
    let lastHeight = document.documentElement.scrollHeight;
    let lastWidth = window.innerWidth;

    const runRefresh = () => {
      if (cancelled || isRefreshing) return;
      isRefreshing = true;
      try {
        ScrollTrigger.refresh();
      } finally {
        lastHeight = document.documentElement.scrollHeight;
        lastWidth = window.innerWidth;
        isRefreshing = false;
      }
    };

    const scheduleRefresh = (force = false) => {
      if (cancelled || isRefreshing) return;
      if (!force) {
        const nextHeight = document.documentElement.scrollHeight;
        const nextWidth = window.innerWidth;
        if (Math.abs(nextHeight - lastHeight) < 12 && Math.abs(nextWidth - lastWidth) < 2) {
          return;
        }
      }
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (cancelled) return;
        if (refreshRaf) cancelAnimationFrame(refreshRaf);
        refreshRaf = requestAnimationFrame(runRefresh);
      }, 150);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => scheduleRefresh(true)).catch(() => {});
    }

    const onLoadRefresh = () => scheduleRefresh(true);
    const onResizeRefresh = () => scheduleRefresh(false);
    window.addEventListener("load", onLoadRefresh, { passive: true });
    window.addEventListener("resize", onResizeRefresh, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      resizeObserver = new ResizeObserver(() => {
        scheduleRefresh(false);
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoadRefresh);
      window.removeEventListener("resize", onResizeRefresh);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (refreshRaf) cancelAnimationFrame(refreshRaf);
      resizeObserver?.disconnect();
    };
  }, []);

  return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const { prefersReducedMotion } = useAdaptivePerformance();

  const isNative = prefersReducedMotion;

  const lenisOptions = useMemo(
    () => ({
      lerp: 0.085,
      smoothWheel: !isNative,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    }),
    [isNative]
  );

  // Single RAF Loop: Lenis synced 1:1 to GSAP ticker without lag-smoothing clamp
  useEffect(() => {
    if (isNative) return;

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
    };
  }, [isNative]);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      autoRaf={false}
      options={lenisOptions}
    >
      <ScrollTriggerBridge />
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;
