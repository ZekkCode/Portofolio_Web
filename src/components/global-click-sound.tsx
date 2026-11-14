"use client";

import { useEffect } from "react";
import {
  playCursorClickSound,
  prefetchSoundBytes,
  warmUiSounds,
} from "@/lib/sound-effects";

/**
 * Memutar efek suara klik ringan pada seluruh interaksi klik kursor di situs,
 * sambil melewati elemen berpenanda `data-sound="switch"` atau `data-sound="none"`
 * agar kontrol flip kartu / tema / bahasa hanya memainkan suara switch khusus.
 */
export function GlobalClickSound() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let idleId: number | null = null;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(() => prefetchSoundBytes(), { timeout: 2500 });
    } else {
      idleId = window.setTimeout(() => prefetchSoundBytes(), 1200);
    }

    const onFirstGesture = () => {
      warmUiSounds();
      document.removeEventListener("pointerdown", onFirstGesture, true);
      document.removeEventListener("keydown", onFirstGesture, true);
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const target = event.target as Element | null;
      if (target?.closest?.('[data-sound="switch"], [data-sound="none"]')) {
        return;
      }
      playCursorClickSound();
    };

    document.addEventListener("pointerdown", onFirstGesture, { capture: true, passive: true });
    document.addEventListener("keydown", onFirstGesture, { capture: true, passive: true });
    document.addEventListener("click", onDocumentClick, { capture: true, passive: true });

    return () => {
      if (idleId !== null) {
        if (typeof w.cancelIdleCallback === "function") {
          w.cancelIdleCallback(idleId);
        } else {
          window.clearTimeout(idleId);
        }
      }
      document.removeEventListener("pointerdown", onFirstGesture, true);
      document.removeEventListener("keydown", onFirstGesture, true);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, []);

  return null;
}
