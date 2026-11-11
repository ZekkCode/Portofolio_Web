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
  tabletSafe: boolean; // Eligible for tablet rendering
  baseRotation: number; // Base degree rotation (-12 to +12)
  curlRadius: number;
  peelDirection: number; // Initial curl direction in degrees
}

// 44 balanced peripheral whitespace slots distributed along left and right gutters.
// Guaranteed equal distribution on left and right for desktop, laptop/tablet, and mobile.
const CANDIDATE_SLOTS: PlacementSlot[] = [
  // --- Section 1: Hero (0% - 9%) ---
  { id: "slot-l1-hero-top", side: "left", topPercent: 1.2, horizontalShift: -8, mobileSafe: true, tabletSafe: true, baseRotation: -6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-r1-hero-top", side: "right", topPercent: 1.2, horizontalShift: 8, mobileSafe: true, tabletSafe: true, baseRotation: 6, curlRadius: 7, peelDirection: -45 },
  { id: "slot-l2-hero-mid", side: "left", topPercent: 3.8, horizontalShift: 10, mobileSafe: false, tabletSafe: true, baseRotation: 7, curlRadius: 7, peelDirection: -35 },
  { id: "slot-r2-hero-mid", side: "right", topPercent: 3.8, horizontalShift: -10, mobileSafe: false, tabletSafe: true, baseRotation: -7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-l3-hero-bot", side: "left", topPercent: 6.8, horizontalShift: -6, mobileSafe: false, tabletSafe: false, baseRotation: -5, curlRadius: 7, peelDirection: 40 },
  { id: "slot-r3-hero-bot", side: "right", topPercent: 6.8, horizontalShift: 10, mobileSafe: false, tabletSafe: false, baseRotation: 8, curlRadius: 7, peelDirection: -40 },

  // --- Section 2: About Me & Stats (9% - 19%) ---
  { id: "slot-l4-about-top", side: "left", topPercent: 11.2, horizontalShift: 8, mobileSafe: false, tabletSafe: true, baseRotation: 6, curlRadius: 7, peelDirection: 135 },
  { id: "slot-r4-about-top", side: "right", topPercent: 11.2, horizontalShift: -8, mobileSafe: false, tabletSafe: true, baseRotation: -6, curlRadius: 7, peelDirection: 45 },
  { id: "slot-l5-about-bot", side: "left", topPercent: 15.5, horizontalShift: -10, mobileSafe: false, tabletSafe: false, baseRotation: -7, curlRadius: 7, peelDirection: -45 },
  { id: "slot-r5-about-bot", side: "right", topPercent: 15.5, horizontalShift: 10, mobileSafe: false, tabletSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: 135 },

  // --- Section 3: Academic Journey (19% - 29%) ---
  { id: "slot-l6-acad-top", side: "left", topPercent: 21.0, horizontalShift: 10, mobileSafe: false, tabletSafe: true, baseRotation: 8, curlRadius: 7, peelDirection: 35 },
  { id: "slot-r6-acad-top", side: "right", topPercent: 21.0, horizontalShift: -10, mobileSafe: false, tabletSafe: true, baseRotation: -8, curlRadius: 7, peelDirection: -50 },
  { id: "slot-l7-acad-bot", side: "left", topPercent: 25.5, horizontalShift: -8, mobileSafe: false, tabletSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: 40 },
  { id: "slot-r7-acad-bot", side: "right", topPercent: 25.5, horizontalShift: 8, mobileSafe: false, tabletSafe: false, baseRotation: 6, curlRadius: 7, peelDirection: -40 },

  // --- Section 4: Experience Timeline (29% - 41%) ---
  { id: "slot-l8-exp-top", side: "left", topPercent: 30.8, horizontalShift: 8, mobileSafe: false, tabletSafe: true, baseRotation: 7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-r8-exp-top", side: "right", topPercent: 30.8, horizontalShift: -8, mobileSafe: false, tabletSafe: true, baseRotation: -6, curlRadius: 7, peelDirection: -45 },
  { id: "slot-l9-exp-mid", side: "left", topPercent: 34.8, horizontalShift: -10, mobileSafe: false, tabletSafe: false, baseRotation: -8, curlRadius: 7, peelDirection: 140 },
  { id: "slot-r9-exp-mid", side: "right", topPercent: 34.8, horizontalShift: 10, mobileSafe: false, tabletSafe: false, baseRotation: 8, curlRadius: 7, peelDirection: 35 },
  { id: "slot-l10-exp-bot", side: "left", topPercent: 38.8, horizontalShift: 10, mobileSafe: false, tabletSafe: true, baseRotation: 6, curlRadius: 7, peelDirection: -35 },
  { id: "slot-r10-exp-bot", side: "right", topPercent: 38.8, horizontalShift: -10, mobileSafe: false, tabletSafe: true, baseRotation: -7, curlRadius: 7, peelDirection: 45 },

  // --- Section 5: Services & Offerings (41% - 52%) ---
  { id: "slot-l11-serv-top", side: "left", topPercent: 43.5, horizontalShift: -8, mobileSafe: false, tabletSafe: true, baseRotation: -6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-r11-serv-top", side: "right", topPercent: 43.5, horizontalShift: 8, mobileSafe: false, tabletSafe: true, baseRotation: 7, curlRadius: 7, peelDirection: -50 },
  { id: "slot-l12-serv-bot", side: "left", topPercent: 48.0, horizontalShift: 10, mobileSafe: false, tabletSafe: false, baseRotation: 8, curlRadius: 7, peelDirection: 40 },
  { id: "slot-r12-serv-bot", side: "right", topPercent: 48.0, horizontalShift: -10, mobileSafe: false, tabletSafe: false, baseRotation: -8, curlRadius: 7, peelDirection: -35 },

  // --- Section 6: CV 3D Folder (52% - 64%) ---
  { id: "slot-l13-cv-top", side: "left", topPercent: 54.0, horizontalShift: -10, mobileSafe: true, tabletSafe: true, baseRotation: -7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-r13-cv-top", side: "right", topPercent: 54.0, horizontalShift: 10, mobileSafe: true, tabletSafe: true, baseRotation: 6, curlRadius: 7, peelDirection: -45 },
  { id: "slot-l14-cv-bot", side: "left", topPercent: 59.5, horizontalShift: 10, mobileSafe: false, tabletSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: 135 },
  { id: "slot-r14-cv-bot", side: "right", topPercent: 59.5, horizontalShift: -10, mobileSafe: false, tabletSafe: false, baseRotation: -7, curlRadius: 7, peelDirection: 40 },

  // --- Section 7: Tech Stack (64% - 74%) ---
  { id: "slot-l15-stack-top", side: "left", topPercent: 65.5, horizontalShift: 8, mobileSafe: false, tabletSafe: true, baseRotation: 6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-r15-stack-top", side: "right", topPercent: 65.5, horizontalShift: -8, mobileSafe: false, tabletSafe: true, baseRotation: -6, curlRadius: 7, peelDirection: -45 },
  { id: "slot-l16-stack-bot", side: "left", topPercent: 70.5, horizontalShift: -10, mobileSafe: false, tabletSafe: false, baseRotation: -8, curlRadius: 7, peelDirection: 140 },
  { id: "slot-r16-stack-bot", side: "right", topPercent: 70.5, horizontalShift: 10, mobileSafe: false, tabletSafe: false, baseRotation: 7, curlRadius: 7, peelDirection: 35 },

  // --- Section 8: Projects Grid (74% - 85%) ---
  { id: "slot-l17-proj-top", side: "left", topPercent: 76.0, horizontalShift: 10, mobileSafe: false, tabletSafe: true, baseRotation: 7, curlRadius: 7, peelDirection: 45 },
  { id: "slot-r17-proj-top", side: "right", topPercent: 76.0, horizontalShift: -10, mobileSafe: false, tabletSafe: true, baseRotation: -7, curlRadius: 7, peelDirection: -40 },
  { id: "slot-l18-proj-mid", side: "left", topPercent: 79.8, horizontalShift: -8, mobileSafe: false, tabletSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: 135 },
  { id: "slot-r18-proj-mid", side: "right", topPercent: 79.8, horizontalShift: 8, mobileSafe: false, tabletSafe: false, baseRotation: 6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-l19-proj-bot", side: "left", topPercent: 83.5, horizontalShift: 8, mobileSafe: false, tabletSafe: true, baseRotation: 8, curlRadius: 7, peelDirection: -35 },
  { id: "slot-r19-proj-bot", side: "right", topPercent: 83.5, horizontalShift: -8, mobileSafe: false, tabletSafe: true, baseRotation: -8, curlRadius: 7, peelDirection: 45 },

  // --- Section 9: Certificates & Blog (85% - 93%) ---
  { id: "slot-l20-cert-top", side: "left", topPercent: 87.2, horizontalShift: -8, mobileSafe: false, tabletSafe: true, baseRotation: -6, curlRadius: 7, peelDirection: 35 },
  { id: "slot-r20-cert-top", side: "right", topPercent: 87.2, horizontalShift: 8, mobileSafe: false, tabletSafe: true, baseRotation: 7, curlRadius: 7, peelDirection: -45 },
  { id: "slot-l21-cert-bot", side: "left", topPercent: 91.0, horizontalShift: 10, mobileSafe: false, tabletSafe: false, baseRotation: 6, curlRadius: 7, peelDirection: 140 },
  { id: "slot-r21-cert-bot", side: "right", topPercent: 91.0, horizontalShift: -10, mobileSafe: false, tabletSafe: false, baseRotation: -6, curlRadius: 7, peelDirection: 40 },

  // --- Section 10: FAQ & Contact (93% - 98%) ---
  { id: "slot-l22-faq-bot", side: "left", topPercent: 94.5, horizontalShift: -8, mobileSafe: false, tabletSafe: true, baseRotation: -7, curlRadius: 7, peelDirection: -40 },
  { id: "slot-r22-faq-bot", side: "right", topPercent: 94.5, horizontalShift: 8, mobileSafe: false, tabletSafe: true, baseRotation: 7, curlRadius: 7, peelDirection: 45 },
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
    // On mobile devices (< 768px), screen width has zero outer gutter.
    // Preserves battery and prevents any typography collision on phones.
    if (width < 768) {
      setActiveStickers([]);
      return;
    }

    const isTablet = width >= 768 && width < 1024;

    // Slots selection: guaranteed equal left/right balance
    const availableSlots = isTablet
      ? CANDIDATE_SLOTS.filter((s) => s.tabletSafe)
      : [...CANDIDATE_SLOTS];

    // Read previous signature to guarantee variation on full page refresh
    let prevSeed = "";
    try {
      prevSeed = sessionStorage.getItem(STORAGE_KEY) || "";
    } catch {
      // ignore
    }

    const newSeed = `${Date.now()}_${Math.random()}`;
    const rng = createRandomSequence(newSeed);

    // Shuffle logos with anti-duplicate distance guarantee
    const prevIds = prevSeed.split(",");
    let pool = STICKER_LOGOS.filter((l) => !prevIds.includes(l.id));
    if (pool.length < availableSlots.length) {
      pool = [...STICKER_LOGOS];
    }
    const shuffledPool = [...pool].sort(() => rng() - 0.5);

    // Generate balanced assignments without close duplicate stickers
    const assignedLogos: StickerItem[] = [];
    const usedInWindow: string[] = [];
    const WINDOW_SIZE = 10; // No repeating the same logo within 10 consecutive slots

    for (let i = 0; i < availableSlots.length; i++) {
      // Pick a candidate not recently used
      let candidates = shuffledPool.filter((l) => !usedInWindow.includes(l.id));
      if (candidates.length === 0) {
        candidates = shuffledPool;
      }
      const pick = candidates[Math.floor(rng() * candidates.length)] || shuffledPool[i % shuffledPool.length];
      assignedLogos.push(pick);
      usedInWindow.push(pick.id);
      if (usedInWindow.length > WINDOW_SIZE) {
        usedInWindow.shift();
      }
    }

    // Build configuration with refined, compact sizing (desktop ~38px-42px, tablet ~32px-34px, mobile ~26px-28px)
    const chosen: ActiveSticker[] = availableSlots.map((slot, index) => {
      const logo = assignedLogos[index];
      const rotationJitter = Math.round((rng() - 0.5) * 6); // -3deg to +3deg
      const sizeJitter = Math.round((rng() - 0.5) * 4); // -2px to +2px

      const stickerWidth = isTablet
        ? Math.max(30, Math.min(34, 32 + sizeJitter))
        : Math.max(36, Math.min(42, 39 + sizeJitter));

      return {
        slot,
        logo,
        rotation: slot.baseRotation + rotationJitter,
        width: stickerWidth,
      };
    });

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
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none"
      aria-hidden="true"
    >
      {activeStickers.map(({ slot, logo, rotation, width }) => {
        const shiftSign = slot.horizontalShift >= 0 ? `+ ${slot.horizontalShift}px` : `- ${Math.abs(slot.horizontalShift)}px`;
        const slotStyle: React.CSSProperties = {
          position: "absolute",
          top: `${slot.topPercent}%`,
          ...(slot.side === "left"
            ? {
                left: `clamp(12px, calc(50% - 512px - 68px ${shiftSign}), 220px)`,
              }
            : {
                right: `clamp(12px, calc(50% - 512px - 68px ${shiftSign}), 220px)`,
              }),
          width: `${width + 24}px`,
          height: `${width + 24}px`,
        };

        return (
          <div
            key={`${slot.id}-${logo.id}`}
            style={slotStyle}
            className="pointer-events-auto flex items-center justify-center will-change-transform"
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
                className="pointer-events-auto object-contain select-none drop-shadow-sm transition-all duration-300 hover:scale-115 hover:-rotate-6 hover:drop-shadow-lg cursor-pointer active:scale-95"
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
                peelBackHoverPct={55}
                peelBackActivePct={75}
                finish="matte"
                backColor="#ffffff"
                lightingIntensity={0.65}
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
