import { BuddyConfig } from "./buddy-types";

export const BUDDY_CONFIG: BuddyConfig = {
  spritesheetUrl: "/pets/miss-minute-blue.webp",
  fallbackSpritesheetUrl: "/pets/miss-minute-original.webp",
  cols: 8,
  rows: 9,
  // 192x208 frame aspect ratio = ~1:1.083
  desktopSize: { width: 58, height: 63 },
  mobileSize: { width: 44, height: 48 },
  speed: 28, // 28 px/s gentle walking speed
  idleIntervalMin: 3500, // pause 3.5s - 7s
  idleIntervalMax: 7000,
  walkIntervalMin: 4000, // walk 4s - 8s
  walkIntervalMax: 8000,
  boundsPadding: 16,
  rightAvoidMargin: 84, // keep clear of ScrollToTop button on right
  storageKey: "zekktech:buddy:state",
  hiddenKey: "zekktech:buddy:hidden",
};

/**
 * Codex 8x9 Atlas Row Definitions
 */
export const BUDDY_ROW_MAP = {
  idle: { index: 0, frames: 6, fps: 6, loop: true },
  "walking-right": { index: 1, frames: 8, fps: 8, loop: true },
  "walking-left": { index: 2, frames: 8, fps: 8, loop: true },
  greeting: { index: 3, frames: 4, fps: 6, loop: false },
  success: { index: 4, frames: 5, fps: 7, loop: false },
  failed: { index: 5, frames: 8, fps: 7, loop: false },
  waiting: { index: 6, frames: 6, fps: 6, loop: true },
  working: { index: 7, frames: 6, fps: 8, loop: true },
  thinking: { index: 8, frames: 6, fps: 6, loop: true },
} as const;

export type BuddyRowKey = keyof typeof BUDDY_ROW_MAP;
