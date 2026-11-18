"use client";

import {
  DEFAULT_DESIGNER_CARD_URL,
  DEFAULT_FRONTEND_CARD_URL,
  resolveLanyardImages,
} from "@/lib/content/identity-images";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSiteConfig } from "@/lib/site-store";
import { useAdaptivePerformance } from "@/lib/device-performance";
import { playSwitchSound } from "@/lib/sound-effects";

interface StaticLanyardCardProps {
  frontImage?: string;
  backImage?: string;
  strapColor?: string;
}

/**
 * Lightweight static fallback preserving the exact blue lanyard ribbon,
 * metallic clasp, and authentic 1:1.4 ID card proportions without Three.js or WebGL.
 */
export function StaticLanyardCard({ frontImage, backImage, strapColor }: StaticLanyardCardProps) {
  const [showBack, setShowBack] = useState(false);
  const frontSrc = frontImage || DEFAULT_FRONTEND_CARD_URL;
  const backSrc = backImage || DEFAULT_DESIGNER_CARD_URL;
  const cardImage = showBack ? backSrc : frontSrc;

  return (
    <div
      data-static-lanyard="true"
      className="relative flex h-full w-full flex-col items-center justify-start select-none pt-1 min-[390px]:pt-2 sm:pt-3"
      aria-label="Zakaria Mujur P. ID Card"
    >
      <canvas
        aria-hidden="true"
        width={300}
        height={420}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />
      {/* 1. Hanging Lanyard Strap Ribbon (comes down from behind the header) */}
      <div className="relative flex flex-col items-center z-10">
        <div
          className="w-4 min-[390px]:w-5 sm:w-6 h-8 min-[390px]:h-10 sm:h-12 lg:h-14 rounded-b-sm shadow-md relative overflow-hidden"
          style={{
            backgroundColor: strapColor || "#1b45c4",
            backgroundImage: "linear-gradient(180deg, #16369c 0%, #1b45c4 50%, #142e82 100%)",
          }}
        >
          {/* Subtle woven fabric texture stripe */}
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/20" />
        </div>

        {/* 2. Metallic Swivel Clip / Carabiner Ring */}
        <div className="relative -mt-1 flex flex-col items-center">
          <div className="size-3.5 sm:size-4 rounded-full border-2 border-slate-300 bg-slate-400 shadow-sm" />
          <div className="w-2.5 h-3 sm:h-3.5 -mt-1 rounded-sm bg-gradient-to-b from-slate-200 to-slate-400 border border-slate-400 shadow-xs" />
        </div>
      </div>

      {/* 3. Authentic ID Card Badge (clickable to flip front/back in fallback mode) */}
      <button
        type="button"
        data-sound="switch"
        onClick={() => {
          playSwitchSound();
          setShowBack((prev) => !prev);
        }}
        aria-pressed={showBack}
        aria-label={
          showBack
            ? "Kartu ID sisi belakang (Graphic Designer). Klik untuk kembali ke sisi depan."
            : "Kartu ID sisi depan (UI/UX & Frontend Dev). Klik untuk balik ke sisi belakang."
        }
        className="group relative z-20 -mt-1 cursor-pointer rounded-[10px] transition-transform duration-300 motion-reduce:transition-none hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
      >
        <div className="relative w-[150px] min-[390px]:w-[180px] sm:w-[225px] lg:w-[250px] aspect-[1/1.406] rounded-[10px] overflow-hidden shadow-2xl border border-white/30 dark:border-white/15 bg-[#0038b8]">
          <Image
            src={cardImage}
            alt={
              showBack
                ? "Zakaria Mujur Prasetyo - Graphic Designer ID Badge"
                : "Zakaria Mujur Prasetyo - UI/UX & Frontend Dev ID Badge"
            }
            fill
            sizes="(max-width: 639px) 146px, 240px"
            priority
            fetchPriority="high"
            unoptimized={cardImage.startsWith("data:") || cardImage.startsWith("blob:")}
            className="object-cover"
          />
        </div>
      </button>
    </div>
  );
}

// Dynamically code-split Three.js so initial LCP renders instantaneously without blocking main thread
const DynamicLanyard = dynamic(() => import("@/components/lanyard"), {
  ssr: false,
});

export function LanyardStage({ className = "" }: { className?: string }) {
  const { lanyard } = useSiteConfig();
  const { hasWebGL } = useAdaptivePerformance();
  const [interacted, setInteracted] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [initFailed, setInitFailed] = useState(false);

  useEffect(() => {
    if (!hasWebGL || interacted || typeof window === "undefined") return;

    let originX: number | null = null;
    let originY: number | null = null;
    const activate = () => {
      setInteracted(true);
      cleanup();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (originX === null || originY === null) {
        originX = e.clientX;
        originY = e.clientY;
        return;
      }
      if (Math.hypot(e.clientX - originX, e.clientY - originY) > 6) {
        activate();
      }
    };
    const onScroll = () => {
      if (window.scrollY > 24) activate();
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("touchstart", activate);
      window.removeEventListener("wheel", activate);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", activate);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", activate, { once: true, passive: true });
    window.addEventListener("touchstart", activate, { once: true, passive: true });
    window.addEventListener("wheel", activate, { once: true, passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", activate, { once: true, passive: true });

    return cleanup;
  }, [hasWebGL, interacted]);

  const shouldUnmount3D = !hasWebGL || initFailed;
  const resolvedImages = resolveLanyardImages({ lanyard });
  const showStaticOverlay = shouldUnmount3D || contextLost || !interacted || !webglReady;

  return (
    <div
      data-lanyard-stage="true"
      onPointerDown={() => {
        if (hasWebGL && !interacted) setInteracted(true);
      }}
      onTouchStart={() => {
        if (hasWebGL && !interacted) setInteracted(true);
      }}
      className={`relative w-full ${className || "h-[320px] sm:h-[400px] lg:h-[440px]"}`}
    >
      {showStaticOverlay && (
        <div className={shouldUnmount3D || !interacted ? "h-full w-full" : "absolute inset-0 z-10 h-full w-full"}>
          <StaticLanyardCard
            frontImage={resolvedImages.frontImage}
            backImage={resolvedImages.backImage}
            strapColor={lanyard.strapColor || undefined}
          />
        </div>
      )}
      {!shouldUnmount3D && interacted && (
        <div
          className={
            contextLost || !webglReady
              ? "h-full w-full opacity-0 pointer-events-none"
              : "h-full w-full transition-opacity duration-300 opacity-100"
          }
        >
          <DynamicLanyard
            {...lanyard}
            frontImage={resolvedImages.frontImage}
            backImage={resolvedImages.backImage}
            strapImage={lanyard.strapImage || undefined}
            onReady={() => setWebglReady(true)}
            onInitFailed={() => setInitFailed(true)}
            onContextLost={() => setContextLost(true)}
            onContextRestored={() => setContextLost(false)}
          />
        </div>
      )}
    </div>
  );
}

export default LanyardStage;
