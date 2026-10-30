"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { BUDDY_CONFIG, BUDDY_ROW_MAP, BuddyRowKey } from "@/lib/buddy/buddy-config";
import { BuddyState, DeviceMode } from "@/lib/buddy/buddy-types";

interface BuddySpriteProps {
  state: BuddyState;
  deviceMode: DeviceMode;
  onClick?: () => void;
  onHover?: () => void;
}

export function BuddySprite({
  state,
  deviceMode,
  onClick,
  onHover,
}: BuddySpriteProps) {
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);

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

  // Frame ticker based on row FPS
  useEffect(() => {
    frameRef.current = 0;
    setFrame(0);

    const interval = 1000 / rowDef.fps;
    const timer = setInterval(() => {
      let nextFrame = frameRef.current + 1;
      if (nextFrame >= rowDef.frames) {
        if (rowDef.loop) {
          nextFrame = 0;
        } else {
          nextFrame = rowDef.frames - 1;
        }
      }
      frameRef.current = nextFrame;
      setFrame(nextFrame);
    }, interval);

    return () => clearInterval(timer);
  }, [rowDef]);

  // Calculate pixel offsets for the 8x9 atlas
  const bgPosX = -(frame * width);
  const bgPosY = -(rowDef.index * height);
  const totalBgWidth = width * BUDDY_CONFIG.cols;
  const totalBgHeight = height * BUDDY_CONFIG.rows;

  return (
    <button
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
      {/* Sprite element with crisp pixel rendering */}
      <div
        className="w-full h-full buddy-pixelated"
        style={{
          backgroundImage: `url(${BUDDY_CONFIG.spritesheetUrl})`,
          backgroundPosition: `${bgPosX}px ${bgPosY}px`,
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
