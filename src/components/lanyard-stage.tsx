"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSiteConfig } from "@/lib/site-store";
import { useAdaptivePerformance } from "@/lib/device-performance";

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
  const frontSrc = frontImage || "/card-front-v2.webp";
  const backSrc = backImage || frontImage || "/card-back-v2.webp";
  const cardImage = showBack ? backSrc : frontSrc;

  return (
    <div
      data-static-lanyard="true"
      className="relative flex h-full w-full flex-col items-center justify-start select-none pt-2 sm:pt-4"
      aria-label="Zakaria Mujur P. ID Card"
    >
      {/* 1. Hanging Lanyard Strap Ribbon (comes down from behind the header) */}
      <div className="relative flex flex-col items-center z-10">
        <div
          className="w-5 sm:w-6 h-12 sm:h-16 rounded-b-sm shadow-md relative overflow-hidden"
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
          <div className="size-4 rounded-full border-2 border-slate-300 bg-slate-400 shadow-sm" />
          <div className="w-2.5 h-3.5 -mt-1 rounded-sm bg-gradient-to-b from-slate-200 to-slate-400 border border-slate-400 shadow-xs" />
        </div>
      </div>

      {/* 3. Authentic ID Card Badge (clickable to flip front/back in fallback mode) */}
      <button
        type="button"
        onClick={() => setShowBack((prev) => !prev)}
        aria-pressed={showBack}
        aria-label={
          showBack
            ? "Kartu ID sisi belakang (Graphic Designer). Klik untuk kembali ke sisi depan."
            : "Kartu ID sisi depan (UI/UX & Frontend Dev). Klik untuk balik ke sisi belakang."
        }
        className="group relative z-20 -mt-1.5 cursor-pointer rounded-[10px] transition-transform duration-300 motion-reduce:transition-none hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
      >
        <div className="relative w-[225px] sm:w-[265px] lg:w-[300px] aspect-[1/1.406] rounded-[10px] overflow-hidden shadow-2xl border border-white/30 dark:border-white/15 bg-[#0038b8]">
          <Image
            src={cardImage}
            alt={
              showBack
                ? "Zakaria Mujur Prasetyo - Graphic Designer ID Badge"
                : "Zakaria Mujur Prasetyo - UI/UX & Frontend Dev ID Badge"
            }
            fill
            sizes="(max-width: 640px) 225px, (max-width: 1024px) 265px, 300px"
            priority
            unoptimized
            className="object-cover"
          />
        </div>
      </button>
    </div>
  );
}

// Dynamically code-split Three.js so visitors in Lite mode do not download Three.js
const DynamicLanyard = dynamic(() => import("@/components/lanyard"), {
  ssr: false,
  loading: () => <StaticLanyardCard />,
});

export function LanyardStage({ className = "" }: { className?: string }) {
  const { lanyard } = useSiteConfig();
  const { hasWebGL } = useAdaptivePerformance();
  const [contextLost, setContextLost] = useState(false);
  const [initFailed, setInitFailed] = useState(false);

  const shouldUnmount3D = !hasWebGL || initFailed;
  const showStaticOverlay = shouldUnmount3D || contextLost;

  return (
    <div
      data-lanyard-stage="true"
      className={`relative w-full ${className || "h-[320px] sm:h-[400px] lg:h-[440px]"}`}
    >
      {showStaticOverlay && (
        <div className={shouldUnmount3D ? "h-full w-full" : "absolute inset-0 z-10 h-full w-full"}>
          <StaticLanyardCard
            frontImage={lanyard.frontImage || undefined}
            backImage={lanyard.backImage || undefined}
            strapColor={lanyard.strapColor || undefined}
          />
        </div>
      )}
      {!shouldUnmount3D && (
        <div className={contextLost ? "h-full w-full opacity-0 pointer-events-none" : "h-full w-full"}>
          <DynamicLanyard
            {...lanyard}
            frontImage={lanyard.frontImage || undefined}
            backImage={lanyard.backImage || undefined}
            strapImage={lanyard.strapImage || undefined}
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
