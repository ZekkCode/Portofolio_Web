"use client";

import { useEffect, useRef, useMemo, useCallback, forwardRef } from "react";
import { BUDDY_CONFIG, BUDDY_ROW_MAP, BuddyRowKey } from "@/lib/buddy/buddy-config";
import { BuddyState, DeviceMode } from "@/lib/buddy/buddy-types";

interface BuddySpriteProps {
  state: BuddyState;
  deviceMode: DeviceMode;
  onClick?: () => void;
  onHover?: () => void;
}

export const BuddySprite = forwardRef<HTMLButtonElement, BuddySpriteProps>(
  function BuddySprite({ state, deviceMode, onClick, onHover }, ref) {
    const spriteRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef(0);
    const lastTimeRef = useRef(0);
    const frameRef = useRef(0);
    const accRef = useRef(0);

    const { width, height } =
      deviceMode === "mobile"
        ? BUDDY_CONFIG.mobileSize
        : deviceMode === "tablet"
        ? BUDDY_CONFIG.tabletSize
        : BUDDY_CONFIG.desktopSize;

    // Determine row definition from current state
    const rowDef = useMemo(() => {
      const key = state as BuddyRowKey;
      return BUDDY_ROW_MAP[key] ?? BUDDY_ROW_MAP.idle;
    }, [state]);

    // Precomputed atlas sizes
    const totalBgWidth = width * BUDDY_CONFIG.cols;
    const totalBgHeight = height * BUDDY_CONFIG.rows;

    // RAF-based frame ticker — synced with browser paint cycle
    const tick = useCallback(
      (now: number) => {
        const el = spriteRef.current;
        if (!el) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        if (lastTimeRef.current === 0) lastTimeRef.current = now;
        const dt = now - lastTimeRef.current;
        lastTimeRef.current = now;

        const interval = 1000 / rowDef.fps;
        accRef.current += dt;

        if (accRef.current >= interval) {
          accRef.current -= interval;

          let nextFrame = frameRef.current + 1;
          if (nextFrame >= rowDef.frames) {
            nextFrame = rowDef.loop ? 0 : rowDef.frames - 1;
          }
          frameRef.current = nextFrame;

          // Direct DOM update — no React re-render
          const bgPosX = -(nextFrame * width);
          const bgPosY = -(rowDef.index * height);
          el.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
        }

        rafRef.current = requestAnimationFrame(tick);
      },
      [rowDef, width, height]
    );

    // Start/restart RAF on state change
    useEffect(() => {
      frameRef.current = 0;
      accRef.current = 0;
      lastTimeRef.current = 0;

      // Set initial position immediately
      const el = spriteRef.current;
      if (el) {
        const bgPosY = -(rowDef.index * height);
        el.style.backgroundPosition = `0px ${bgPosY}px`;
      }

      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }, [tick, rowDef, height]);

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        onMouseEnter={onHover}
        aria-label="Tanya Miss Minute (ZekkTech Companion)"
        title="Miss Minute — Klik atau ketuk untuk bertanya seputar Zekk"
        className="group buddy-interactive relative flex items-center justify-center cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-2xl transition-transform active:scale-95 pointer-events-auto touch-manipulation min-w-[44px] min-h-[44px]"
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {/* Sprite element with crisp pixel rendering — position updated via RAF, not React state */}
        <div
          ref={spriteRef}
          className="w-full h-full buddy-pixelated"
          style={{
            backgroundImage: `url(${BUDDY_CONFIG.spritesheetUrl})`,
            backgroundSize: `${totalBgWidth}px ${totalBgHeight}px`,
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
          }}
        />

        {/* Tiny subtle hover status indicator dot */}
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex size-2.5 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
        >
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-brand" />
        </span>
      </button>
    );
  }
);
