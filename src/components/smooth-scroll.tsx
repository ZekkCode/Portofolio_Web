"use client";

import { useEffect, useRef } from "react";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
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

  // 3. Refresh pengukuran ScrollTrigger hanya ketika layout benar-benar berubah
  useEffect(() => {
    if (typeof window === "undefined") return;

    let resizeTimer: NodeJS.Timeout | null = null;
    const debouncedRefresh = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 120);
    };

    // Saat seluruh web fonts siap dirender
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }

    // Saat aset gambar/halaman selesai dimuat
    window.addEventListener("load", debouncedRefresh);
    window.addEventListener("resize", debouncedRefresh);

    // Pantau perubahan tinggi konten dinamis secara presisi tanpa polling berkala
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      resizeObserver = new ResizeObserver(() => {
        debouncedRefresh();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener("load", debouncedRefresh);
      window.removeEventListener("resize", debouncedRefresh);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
    };
  }, []);

  return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  // Single RAF Loop: Lenis dikendalikan langsung oleh GSAP ticker tunggal
  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      autoRaf={false}
      options={{
        lerp: 0.08,
        duration: 1.15,
        smoothWheel: true,
      }}
    >
      <ScrollTriggerBridge />
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;
