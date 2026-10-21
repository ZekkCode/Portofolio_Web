"use client";

import Lanyard from "@/components/lanyard";
import { useSiteConfig } from "@/lib/site-store";

export function LanyardStage({ className = "" }: { className?: string }) {
  const { lanyard } = useSiteConfig();

  return (
    <div className={`relative h-[500px] w-full sm:h-[580px] lg:h-[640px] ${className}`}>
      <Lanyard
        {...lanyard}
        frontImage={lanyard.frontImage || undefined}
        backImage={lanyard.backImage || undefined}
        strapImage={lanyard.strapImage || undefined}
      />
    </div>
  );
}
