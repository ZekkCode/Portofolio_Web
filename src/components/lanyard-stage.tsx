"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSiteConfig } from "@/lib/site-store";
import { useAdaptivePerformance } from "@/lib/device-performance";

interface StaticLanyardCardProps {
  frontImage?: string;
  strapColor?: string;
}

/**
 * Lightweight static fallback preserving the exact blue lanyard ribbon,
 * metallic clasp, and authentic 1:1.4 ID card proportions without Three.js or WebGL.
 */
export function StaticLanyardCard({ frontImage, strapColor }: StaticLanyardCardProps) {
  const cardImage = frontImage || "/card-front.webp";

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-start select-none pt-2 sm:pt-4"
      aria-label="Zakaria Mujur P. ID Card"
    >
      {/* 1. Hanging Lanyard Strap Ribbon (comes down from behind the header) */}
      <div className="relative flex flex-col items-center z-10">
        <div
          className="w-5 sm:w-6 h-28 sm:h-36 rounded-b-sm shadow-md relative overflow-hidden"
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

      {/* 3. Authentic ID Card Badge */}
      <div className="relative z-20 -mt-1.5 transition-transform duration-300 hover:rotate-0 hover:scale-[1.01] will-change-transform">
        <div className="relative w-[220px] sm:w-[260px] lg:w-[285px] aspect-[1/1.406] rounded-2xl overflow-hidden shadow-2xl border border-white/30 dark:border-white/15 bg-slate-900">
          <Image
            src={cardImage}
            alt="Zakaria Mujur Prasetyo - ID Badge"
            fill
            sizes="(max-width: 640px) 220px, (max-width: 1024px) 260px, 285px"
            priority
            className="object-contain"
          />
        </div>
      </div>
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
  const { tier, hasWebGL } = useAdaptivePerformance();
  const [contextLost, setContextLost] = useState(false);

  // Fallback trigger if WebGL context is lost at runtime
  useEffect(() => {
    const handleContextLost = () => {
      setContextLost(true);
    };
    window.addEventListener("webglcontextlost", handleContextLost, true);
    return () => {
      window.removeEventListener("webglcontextlost", handleContextLost, true);
    };
  }, []);

  const shouldRenderStatic = tier === "lite" || !hasWebGL || contextLost;

  return (
    <div className={`relative w-full ${className || "h-[500px] sm:h-[580px] lg:h-[640px]"}`}>
      {shouldRenderStatic ? (
        <StaticLanyardCard
          frontImage={lanyard.frontImage || undefined}
          strapColor={lanyard.strapColor || undefined}
        />
      ) : (
        <DynamicLanyard
          {...lanyard}
          frontImage={lanyard.frontImage || undefined}
          backImage={lanyard.backImage || undefined}
          strapImage={lanyard.strapImage || undefined}
        />
      )}
    </div>
  );
}

export default LanyardStage;
