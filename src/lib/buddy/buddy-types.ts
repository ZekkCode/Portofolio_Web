/**
 * TypeScript Contracts for ZekkTech Blue Miss Minute Companion
 */

export type BuddyState =
  | "idle"
  | "walking-left"
  | "walking-right"
  | "greeting"
  | "thinking"
  | "success"
  | "failed"
  | "waiting"
  | "hidden";

export type BuddyDirection = -1 | 1;

export interface BuddyPosition {
  x: number;
  y: number;
  direction: BuddyDirection;
}

export interface BuddyChatMessage {
  id: string;
  sender: "user" | "buddy";
  text: string;
  timestamp: number;
}

export interface BuddyConfig {
  spritesheetUrl: string;
  fallbackSpritesheetUrl: string;
  cols: number;
  rows: number;
  desktopSize: { width: number; height: number };
  mobileSize: { width: number; height: number };
  speed: number; // pixels per second
  idleIntervalMin: number; // ms
  idleIntervalMax: number; // ms
  walkIntervalMin: number; // ms
  walkIntervalMax: number; // ms
  boundsPadding: number; // px from screen edges
  rightAvoidMargin: number; // avoid scroll-to-top button
  storageKey: string;
  hiddenKey: string;
}

export interface BuddyAPI {
  setState(state: BuddyState): void;
  play(action: BuddyState, opts?: { durationMs?: number }): void;
  say(text: string, opts?: { ttl?: number }): void;
  hide(): void;
  show(): void;
  toggle(): void;
  readonly hidden: boolean;
  readonly state: BuddyState;
}

declare global {
  interface Window {
    ZekkBuddy?: BuddyAPI;
    AgentPet?: BuddyAPI;
  }
}
