"use client";

import { useEffect, useState } from "react";

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
}

/**
 * Synchronous check for low-spec CPU/RAM/network or mobile viewport.
 * Safe to call inside client effects/callbacks.
 */
export function isLowEndDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const nav = navigator as NavigatorWithMemory;

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }

  if (nav.connection?.saveData) {
    return true;
  }

  const effectiveType = nav.connection?.effectiveType;
  if (effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g") {
    return true;
  }

  // Low-spec laptop / phone RAM (<= 4 GB) or CPU cores (<= 4 logical threads)
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) {
    return true;
  }

  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) {
    return true;
  }

  return false;
}

/**
 * Checks whether the device is either a low-spec laptop/PC or a mobile/touch device.
 */
export function isMobileOrLowSpec(): boolean {
  if (typeof window === "undefined") return false;
  if (isLowEndDevice()) return true;
  if (window.innerWidth < 768) return true;
  if (window.matchMedia?.("(pointer: coarse)").matches) return true;
  return false;
}

/**
 * React hook returning whether the current client is a low-spec or mobile device.
 * Defaults to false during SSR to prevent hydration mismatch.
 */
export function useLowSpecDevice(): { isLowSpec: boolean; isMobileOrLow: boolean } {
  const [state, setState] = useState({ isLowSpec: false, isMobileOrLow: false });

  useEffect(() => {
    const update = () => {
      setState({
        isLowSpec: isLowEndDevice(),
        isMobileOrLow: isMobileOrLowSpec(),
      });
    };
    update();
  }, []);

  return state;
}
