"use client";

import { useEffect, useState } from "react";
import { StickerPeel } from "@/components/sticker-peel";
import { STICKER_LOGOS, type StickerItem } from "@/lib/sticker-manifest";
import { useAdaptivePerformance } from "@/lib/device-performance";

interface PlacementSlot {
  id: string;
  side: "left" | "right";
  topPercent: number; // Vertical pacing down the full page (0 - 100)
  horizontalShift: number; // px shift from default gutter guideline
  mobileSafe: boolean; // Eligible for mobile rendering
  baseRotation: number; // Base degree rotation (-9 to +9)
  curlRadius: number;
  peelDirection: number; // Initial curl direction in degrees
}

// 40 peripheral whitespace slots distributed along left and right gutters.
// Paced densely so multiple stickers are consistently visible in every single viewport.
const CANDIDATE_SLOTS: PlacementSlot[] = [
  // --- Section 1: Hero (0% - 12%) ---
  { id: "slot-l1-hero-top", side: "left", topPercent: 2.2, horizontalShift: -8, mobileSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-r1-hero-top", side: "right", topPercent: 3.8, horizontalShift: 10, mobileSafe: true, baseRotation: -5, curlRadius: 7, peelDirection: -45 },
  { id: "slot-l2-hero-mid", side: "left", topPercent: 6.0, horizontalShift: 10, mobileSafe: true, baseRotation: 7, curlRadius: 7, peelDirection: -35 },
  { id: "slot-r2-hero-mid", side: "right", topPercent: 8.0, horizontalShift: -8, mobileSafe: false, baseRotation: 6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-l3-hero-bot", side: "left", topPercent: 10.2, horizontalShift: -6, mobileSafe: false, baseRotation: -7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-r3-hero-bot", side: "right", topPercent: 12.0, horizontalShift: 10, mobileSafe: false, baseRotation: -8, curlRadius: 7, peelDirection: -40 },

  // --- Section 2: About Me & Stats (12% - 22%) ---
  { id: "slot-l4-about-top", side: "left", topPercent: 14.2, horizontalShift: 8, mobileSafe: true, baseRotation: 6, curlRadius: 7, peelDirection: 135 },
  { id: "slot-r4-about-top", side: "right", topPercent: 16.2, horizontalShift: -10, mobileSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-l5-about-bot", side: "left", topPercent: 18.5, horizontalShift: -10, mobileSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: -45 },
  { id: "slot-r5-about-bot", side: "right", topPercent: 20.8, horizontalShift: 8, mobileSafe: true, baseRotation: -5, curlRadius: 7, peelDirection: 135 },

  // --- Section 3: Academic Journey (22% - 32%) ---
  { id: "slot-l6-acad-top", side: "left", topPercent: 23.2, horizontalShift: 12, mobileSafe: false, baseRotation: 8, curlRadius: 7, peelDirection: 35 },
  { id: "slot-r6-acad-top", side: "right", topPercent: 25.4, horizontalShift: -8, mobileSafe: false, baseRotation: 6, curlRadius: 7, peelDirection: -50 },
  { id: "slot-l7-acad-bot", side: "left", topPercent: 27.8, horizontalShift: -8, mobileSafe: true, baseRotation: -7, curlRadius: 7, peelDirection: 40 },
  { id: "slot-r7-acad-bot", side: "right", topPercent: 30.2, horizontalShift: 10, mobileSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: -40 },

  // --- Section 4: Experience Timeline (32% - 44%) ---
  { id: "slot-l8-exp-top", side: "left", topPercent: 32.8, horizontalShift: 8, mobileSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-r8-exp-top", side: "right", topPercent: 34.8, horizontalShift: -10, mobileSafe: true, baseRotation: 5, curlRadius: 7, peelDirection: -45 },
  { id: "slot-l9-exp-mid", side: "left", topPercent: 37.0, horizontalShift: -12, mobileSafe: false, baseRotation: -8, curlRadius: 7, peelDirection: 140 },
  { id: "slot-r9-exp-mid", side: "right", topPercent: 39.2, horizontalShift: 10, mobileSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-l10-exp-bot", side: "left", topPercent: 41.5, horizontalShift: 10, mobileSafe: false, baseRotation: 5, curlRadius: 7, peelDirection: -35 },
  { id: "slot-r10-exp-bot", side: "right", topPercent: 43.8, horizontalShift: -8, mobileSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: -40 },

  // --- Section 5: Services & Offerings (44% - 54%) ---
  { id: "slot-l11-serv-top", side: "left", topPercent: 46.2, horizontalShift: -8, mobileSafe: true, baseRotation: -6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-r11-serv-top", side: "right", topPercent: 48.4, horizontalShift: 12, mobileSafe: false, baseRotation: 8, curlRadius: 7, peelDirection: -50 },
  { id: "slot-l12-serv-bot", side: "left", topPercent: 50.8, horizontalShift: 10, mobileSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: 40 },
  { id: "slot-r12-serv-bot", side: "right", topPercent: 53.0, horizontalShift: -10, mobileSafe: false, baseRotation: -7, curlRadius: 7, peelDirection: -35 },

  // --- Section 6: CV 3D Folder (54% - 66%) ---
  { id: "slot-l13-cv-top", side: "left", topPercent: 55.5, horizontalShift: -10, mobileSafe: false, baseRotation: -7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-r13-cv-top", side: "right", topPercent: 57.8, horizontalShift: 8, mobileSafe: true, baseRotation: 6, curlRadius: 7, peelDirection: -45 },
  { id: "slot-l14-cv-bot", side: "left", topPercent: 60.5, horizontalShift: 12, mobileSafe: false, baseRotation: 8, curlRadius: 7, peelDirection: 135 },
  { id: "slot-r14-cv-bot", side: "right", topPercent: 63.2, horizontalShift: -10, mobileSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: 40 },

  // --- Section 7: Tech Stack (66% - 76%) ---
  { id: "slot-l15-stack-top", side: "left", topPercent: 66.0, horizontalShift: 8, mobileSafe: false, baseRotation: 6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-r15-stack-top", side: "right", topPercent: 68.2, horizontalShift: -8, mobileSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: -45 },
  { id: "slot-l16-stack-bot", side: "left", topPercent: 71.0, horizontalShift: -10, mobileSafe: true, baseRotation: -7, curlRadius: 7, peelDirection: 140 },
  { id: "slot-r16-stack-bot", side: "right", topPercent: 73.5, horizontalShift: 12, mobileSafe: false, baseRotation: -5, curlRadius: 7, peelDirection: 35 },

  // --- Section 8: Projects Grid (76% - 88%) ---
  { id: "slot-l17-proj-top", side: "left", topPercent: 76.5, horizontalShift: 10, mobileSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-r17-proj-top", side: "right", topPercent: 78.8, horizontalShift: -10, mobileSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: -40 },
  { id: "slot-l18-proj-bot", side: "left", topPercent: 81.5, horizontalShift: -12, mobileSafe: false, baseRotation: -8, curlRadius: 7, peelDirection: 135 },
  { id: "slot-r18-proj-bot", side: "right", topPercent: 84.0, horizontalShift: 8, mobileSafe: true, baseRotation: 6, curlRadius: 7, peelDirection: 35 },

  // --- Section 9: Certificates, FAQ & Contact (88% - 98%) ---
  { id: "slot-l19-cert-top", side: "left", topPercent: 87.0, horizontalShift: 8, mobileSafe: false, baseRotation: 5, curlRadius: 7, peelDirection: -35 },
  { id: "slot-r19-cert-top", side: "right", topPercent: 89.2, horizontalShift: -10, mobileSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-l20-faq-bot", side: "left", topPercent: 92.0, horizontalShift: -8, mobileSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: 140 },
  { id: "slot-r20-faq-bot", side: "right", topPercent: 94.5, horizontalShift: 10, mobileSafe: false, baseRotation: -7, curlRadius: 7, peelDirection: -40 },
];

interface ActiveSticker {
  slot: PlacementSlot;
  logo: StickerItem;
  rotation: number;
  width: number;
}

const STORAGE_KEY = "zekk_sticker_prev_seed";

// Pseudo-random generator seeded by string
function createRandomSequence(seedStr: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return function nextFloat() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function BackgroundStickers() {
  const [activeStickers, setActiveStickers] = useState<ActiveSticker[]>([]);
  const [mounted, setMounted] = useState(false);
  const { isLite, isMobileOrLow } = useAdaptivePerformance();

  useEffect(() => {
    setMounted(true);

    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    // Slots selection:
    // Desktop: 40 stickers (20 on left, 20 on right)
    // Tablet: 20 stickers (10 on left, 10 on right)
    // Mobile: 8 micro-stickers (mobileSafe slots)
    const availableSlots = isMobile
      ? CANDIDATE_SLOTS.filter((s) => s.mobileSafe)
      : isTablet
      ? CANDIDATE_SLOTS.filter((_, i) => i % 2 === 0)
      : [...CANDIDATE_SLOTS];

    // Read previous signature to guarantee variation on full page refresh
    let prevSeed = "";
    try {
      prevSeed = sessionStorage.getItem(STORAGE_KEY) || "";
    } catch {
      // ignore
    }

    // Generate unique seed for this browser session/refresh
    const newSeed = `${Date.now()}_${Math.random()}`;
    const rng = createRandomSequence(newSeed);

    // Shuffle logos with exclusion preference to maximize variety
    const prevIds = prevSeed.split(",");
    let candidateLogos = STICKER_LOGOS.filter((l) => !prevIds.includes(l.id));
    if (candidateLogos.length < availableSlots.length) {
      candidateLogos = [...STICKER_LOGOS];
    }
    const shuffledLogos = [...candidateLogos].sort(() => rng() - 0.5);

    // Build configuration with refined, compact sizing (desktop ~42px, tablet ~34px, mobile ~28px)
    const chosen: ActiveSticker[] = availableSlots.map((slot, index) => {
      const logo = shuffledLogos[index % shuffledLogos.length];
      const rotationJitter = Math.round((rng() - 0.5) * 6); // -3deg to +3deg
      const sizeJitter = Math.round((rng() - 0.5) * 6); // -3px to +3px

      const stickerWidth = isMobile
        ? Math.max(26, Math.min(30, 28 + sizeJitter))
        : isTablet
        ? Math.max(32, Math.min(36, 34 + sizeJitter))
        : Math.max(38, Math.min(46, 42 + sizeJitter));

      return {
        slot,
        logo,
        rotation: slot.baseRotation + rotationJitter,
        width: stickerWidth,
      };
    });

    // Save signature for next refresh
    try {
      const currentIds = chosen.map((c) => c.logo.id).join(",");
      sessionStorage.setItem(STORAGE_KEY, currentIds);
    } catch {
      // ignore
    }

    setActiveStickers(chosen);
  }, []);

  if (!mounted || activeStickers.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {activeStickers.map(({ slot, logo, rotation, width }) => {
        // Symmetrical formula for left and right gutters hugging the central content container
        const shiftSign = slot.horizontalShift >= 0 ? `+ ${slot.horizontalShift}px` : `- ${Math.abs(slot.horizontalShift)}px`;
        const slotStyle: React.CSSProperties = {
          position: "absolute",
          top: `${slot.topPercent}%`,
          ...(slot.side === "left"
            ? {
                left: `clamp(16px, calc(50% - 512px - 85px ${shiftSign}), 240px)`,
              }
            : {
                right: `clamp(16px, calc(50% - 512px - 85px ${shiftSign}), 240px)`,
              }),
          width: `${width + 24}px`,
          height: `${width + 24}px`,
        };

        return (
          <div
            key={`${slot.id}-${logo.id}`}
            style={slotStyle}
            className="pointer-events-none flex items-center justify-center will-change-transform"
          >
            {isLite ? (
              /* Lightweight static logo fallback for limited devices (Zero WebGL context, zero canvas) */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logo.src}
                alt={logo.name}
                loading="lazy"
                width={width}
                height={width}
                className="pointer-events-none object-contain select-none drop-shadow-xs transition-transform duration-200"
                style={{
                  width: `${width}px`,
                  height: `${width}px`,
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            ) : (
              <StickerPeel
                imageSrc={logo.src}
                width={width}
                rotate={rotation}
                peelDirection={slot.peelDirection}
                curlRadius={slot.curlRadius}
                peelBackHoverPct={50}
                peelBackActivePct={70}
                finish="matte"
                backColor="#ffffff"
                lightingIntensity={0.6}
                shadowIntensity={0.7}
                followPointer={true}
                draggable={false}
                swing={0}
                intro={false}
                initialPosition="center"
                dpr={isMobileOrLow ? 1 : 1.5}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default BackgroundStickers;