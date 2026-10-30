"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { BUDDY_CONFIG, BUDDY_ROW_MAP, BuddyRowKey } from "@/lib/buddy/buddy-config";
import { BuddyState } from "@/lib/buddy/buddy-types";

interface BuddySpriteProps {
  state: BuddyState;
  isMobile: boolean;
  onClick?: () => void;
  onHover?: () => void;
}

export function BuddySprite({
  state,
  isMobile,
  onClick,
  onHover,
}: BuddySpriteProps) {
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);

  const { width, height } = isMobile
    ? BUDDY_CONFIG.mobileSize
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
      title="Miss Minute — Klik untuk mengobrol atau bertanya seputar Zekk"
      className="group relative cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 rounded-xl transition-transform active:scale-95 pointer-events-auto"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {/* Sprite element */}
      <div
        className="w-full h-full"
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
