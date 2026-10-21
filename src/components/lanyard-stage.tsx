"use client";

import Lanyard from "@/components/lanyard";
import { useSiteConfig } from "@/lib/site-store";

export function LanyardStage({ className = "" }: { className?: string }) {
  const { lanyard } = useSiteConfig();

  return (
    <div className={`relative w-full ${className || "h-[500px] sm:h-[580px] lg:h-[640px]"}`}>
      <Lanyard
        {...lanyard}
        frontImage={lanyard.frontImage || undefined}
        backImage={lanyard.backImage || undefined}
        strapImage={lanyard.strapImage || undefined}
      />
    </div>
  );
}
