"use client";

export const CURSOR_CLICK_SOUND_URL = "/sounds/cursor-click.mp3";
export const SWITCH_CLICK_SOUND_URL = "/sounds/switch-click.mp3";

type SoundKind = "cursor" | "switch";

const SOUND_PATHS: Record<SoundKind, string> = {
  cursor: CURSOR_CLICK_SOUND_URL,
  switch: SWITCH_CLICK_SOUND_URL,
};

const SOUND_GAINS: Record<SoundKind, number> = {
  cursor: 0.55,
  switch: 0.65,
};

let audioCtx: AudioContext | null = null;
let suppressCursorUntil = 0;

const rawBytePromises = new Map<SoundKind, Promise<ArrayBuffer | null>>();
const decodedBuffers = new Map<SoundKind, AudioBuffer>();
const decodingPromises = new Map<SoundKind, Promise<AudioBuffer | null>>();
const fallbackElements = new Map<SoundKind, HTMLAudioElement>();

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext || w.webkitAudioContext || null;
}

function ensureRawBytes(kind: SoundKind): Promise<ArrayBuffer | null> {
  const existing = rawBytePromises.get(kind);
  if (existing) return existing;

  const task = fetch(SOUND_PATHS[kind], { cache: "force-cache" })
    .then((res) => (res.ok ? res.arrayBuffer() : null))
    .catch(() => null);

  rawBytePromises.set(kind, task);
  return task;
}

function getOrCreateContext(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const Ctx = getAudioContextClass();
  if (!Ctx) return null;
  try {
    audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

async function ensureDecodedBuffer(kind: SoundKind): Promise<AudioBuffer | null> {
  const cached = decodedBuffers.get(kind);
  if (cached) return cached;

  const inFlight = decodingPromises.get(kind);
  if (inFlight) return inFlight;

  const ctx = getOrCreateContext();
  if (!ctx) return null;

  const task = (async () => {
    try {
      const bytes = await ensureRawBytes(kind);
      if (!bytes) return null;
      const decoded = await ctx.decodeAudioData(bytes.slice(0));
      decodedBuffers.set(kind, decoded);
      return decoded;
    } catch {
      return null;
    } finally {
      decodingPromises.delete(kind);
    }
  })();

  decodingPromises.set(kind, task);
  return task;
}

function playFallbackAudio(kind: SoundKind): void {
  if (typeof window === "undefined") return;
  try {
    let base = fallbackElements.get(kind);
    if (!base) {
      base = new Audio(SOUND_PATHS[kind]);
      base.preload = "auto";
      fallbackElements.set(kind, base);
    }
    const instance = base.readyState >= 2 ? (base.cloneNode() as HTMLAudioElement) : base;
    instance.volume = SOUND_GAINS[kind];
    if (instance === base) {
      instance.currentTime = 0;
    }
    const p = instance.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {});
    }
  } catch {
    // Abaikan jika browser/headless menonaktifkan output audio
  }
}

function playBuffer(ctx: AudioContext, buffer: AudioBuffer, gainValue: number): void {
  try {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = gainValue;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  } catch {
    // Abaikan error playback Web Audio
  }
}

function triggerSound(kind: SoundKind): void {
  if (typeof window === "undefined") return;

  const ctx = getOrCreateContext();
  if (!ctx) {
    playFallbackAudio(kind);
    return;
  }

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }

  const cached = decodedBuffers.get(kind);
  if (cached && ctx.state === "running") {
    playBuffer(ctx, cached, SOUND_GAINS[kind]);
    return;
  }

  // Fallback langsung untuk klik pertama saat buffer sedang didekode
  playFallbackAudio(kind);
  void ensureDecodedBuffer(kind).then((decoded) => {
    if (decoded && !cached && ctx.state === "running") {
      // Sudah diputar oleh fallback untuk klik ini; buffer siap untuk klik berikutnya
    }
  });
}

/**
 * Prefetch byte mentah MP3 (tanpa menyentuh AudioContext) agar tidak memicu warning autoplay browser.
 */
export function prefetchSoundBytes(): void {
  if (typeof window === "undefined") return;
  void ensureRawBytes("cursor");
  void ensureRawBytes("switch");
}

/**
 * Buka AudioContext & dekode kedua efek suara saat user mulai berinteraksi.
 */
export function warmUiSounds(): void {
  if (typeof window === "undefined") return;
  const ctx = getOrCreateContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
  void ensureDecodedBuffer("cursor");
  void ensureDecodedBuffer("switch");
}

export function suppressCursorClick(durationMs = 200): void {
  if (typeof performance === "undefined") return;
  const until = performance.now() + durationMs;
  if (until > suppressCursorUntil) {
    suppressCursorUntil = until;
  }
}

export function playCursorClickSound(): void {
  if (typeof performance !== "undefined" && performance.now() < suppressCursorUntil) {
    return;
  }
  triggerSound("cursor");
}

export function playSwitchSound(): void {
  suppressCursorClick(250);
  triggerSound("switch");
}
