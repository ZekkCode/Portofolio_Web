"use client";

import { useEffect, useState } from "react";
import Lanyard from "@/components/lanyard";
import { useSiteConfig } from "@/lib/site-store";

export function LanyardStage({ className = "" }: { className?: string }) {
  const { lanyard } = useSiteConfig();
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }
  }, []);

  return (
    <div className={`relative w-full ${className || "h-[500px] sm:h-[580px] lg:h-[640px]"}`}>
      {hasWebGL ? (
        <Lanyard
          {...lanyard}
          frontImage={lanyard.frontImage || undefined}
          backImage={lanyard.backImage || undefined}
          strapImage={lanyard.strapImage || undefined}
        />
      ) : (
        /* Static Card Fallback when WebGL is unavailable */
        <div className="flex h-full w-full items-center justify-center p-6">
          <div className="relative aspect-[1/1.4] w-64 rounded-2xl border border-line bg-gradient-to-b from-blue-900 to-blue-950 p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-300">ZEKKTECH ID</span>
              <span className="size-3 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-8 flex flex-col items-center text-center">
              <div className="size-20 rounded-full border-2 border-white/30 bg-white/10 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lanyard.frontImage || "/profile.webp"}
                  alt="Zakaria Mujur P."
                  className="size-full rounded-full object-cover"
                />
              </div>
              <h3 className="mt-4 font-display text-base font-bold">Zakaria Mujur P.</h3>
              <p className="mt-1 text-xs text-sky-200">UI/UX & Frontend Developer</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
