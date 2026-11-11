"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type QualityTier = "lite" | "balanced" | "full";

export interface NavigatorWithCapabilities extends Navigator {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
}

export interface AdaptivePerformanceState {
  tier: QualityTier;
  isLite: boolean;
  isBalanced: boolean;
  isFull: boolean;
  prefersReducedMotion: boolean;
  hasWebGL: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  isLowSpec: boolean; // Backwards-compatible alias for existing call sites
  isMobileOrLow: boolean; // Backwards-compatible alias for existing call sites
  downgradeTier: (reason?: string) => void;
  reportSlowFrame: (frameTimeMs: number) => void;
}

const DOWNGRADE_COOLDOWN_MS = 8000;
const SLOW_FRAME_THRESHOLD_MS = 38; // ~26 FPS threshold
const SLOW_FRAME_STRIKES_REQUIRED = 5;

/**
 * Defensively probes whether WebGL/WebGL2 is available and functional.
 * Fails gracefully without throwing or leaving uncollected contexts.
 */
export function probeWebGLSupport(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return true; // Conservative SSR assumption
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const gl =
      canvas.getContext("webgl2", { powerPreference: "low-power" }) ||
      canvas.getContext("webgl", { powerPreference: "low-power" }) ||
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    const loseExt = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    if (loseExt) {
      loseExt.loseContext();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates initial quality tier based on available hardware and network hints.
 * Follows strict rules:
 * - Does NOT classify every phone as low-end
 * - Does NOT assume every desktop is powerful
 * - Treats prefers-reduced-motion as an independent accessibility constraint
 */
export function calculateInitialTier(): {
  tier: QualityTier;
  hasWebGL: boolean;
  prefersReducedMotion: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
} {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      tier: "balanced",
      hasWebGL: true,
      prefersReducedMotion: false,
    };
  }

  const nav = navigator as NavigatorWithCapabilities;
  const hasWebGL = probeWebGLSupport();
  const prefersReducedMotion = Boolean(
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  );

  const deviceMemory = typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined;
  const hardwareConcurrency =
    typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : undefined;

  // 1. Mandatory Lite triggers
  if (!hasWebGL) {
    return { tier: "lite", hasWebGL: false, prefersReducedMotion, deviceMemory, hardwareConcurrency };
  }

  if (nav.connection?.saveData) {
    return { tier: "lite", hasWebGL, prefersReducedMotion, deviceMemory, hardwareConcurrency };
  }

  const effectiveType = nav.connection?.effectiveType;
  if (effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g") {
    return { tier: "lite", hasWebGL, prefersReducedMotion, deviceMemory, hardwareConcurrency };
  }

  if (typeof deviceMemory === "number" && deviceMemory < 4) {
    return { tier: "lite", hasWebGL, prefersReducedMotion, deviceMemory, hardwareConcurrency };
  }

  if (typeof hardwareConcurrency === "number" && hardwareConcurrency <= 2) {
    return { tier: "lite", hasWebGL, prefersReducedMotion, deviceMemory, hardwareConcurrency };
  }

  // 2. High-end Capable Desktop / High-Spec triggers
  if (
    (typeof deviceMemory === "number" ? deviceMemory >= 8 : true) &&
    (typeof hardwareConcurrency === "number" ? hardwareConcurrency >= 8 : true) &&
    hasWebGL
  ) {
    return { tier: "full", hasWebGL, prefersReducedMotion, deviceMemory, hardwareConcurrency };
  }

  // 3. Balanced baseline for mid-range laptops, capable mobile phones, or unspecified specs
  return { tier: "balanced", hasWebGL, prefersReducedMotion, deviceMemory, hardwareConcurrency };
}

/**
 * Standalone backwards-compatible synchronous check.
 */
export function isLowEndDevice(): boolean {
  if (typeof window === "undefined") return false;
  const { tier } = calculateInitialTier();
  return tier === "lite";
}

/**
 * Standalone backwards-compatible check for mobile or low-spec hints.
 */
export function isMobileOrLowSpec(): boolean {
  if (typeof window === "undefined") return false;
  const isMobile = window.innerWidth < 768;
  const { tier } = calculateInitialTier();
  return tier === "lite" || (tier === "balanced" && isMobile);
}

const AdaptivePerformanceContext = createContext<AdaptivePerformanceState>({
  tier: "balanced",
  isLite: false,
  isBalanced: true,
  isFull: false,
  prefersReducedMotion: false,
  hasWebGL: true,
  isLowSpec: false,
  isMobileOrLow: false,
  downgradeTier: () => {},
  reportSlowFrame: () => {},
});

export function AdaptivePerformanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Conservative initialization via state initializer avoids cascading renders in effect
  const [initialSnapshot] = useState(calculateInitialTier);
  const [tier, setTier] = useState<QualityTier>(initialSnapshot.tier);
  const [hasWebGL, setHasWebGL] = useState(initialSnapshot.hasWebGL);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(initialSnapshot.prefersReducedMotion);
  const [deviceMemory] = useState<number | undefined>(initialSnapshot.deviceMemory);
  const [hardwareConcurrency] = useState<number | undefined>(initialSnapshot.hardwareConcurrency);
  const [isMobile, setIsMobile] = useState(false);

  // Runtime monitoring references
  const lastDowngradeTimeRef = useRef<number>(0);
  const slowFrameCountRef = useRef<number>(0);
  const tierRef = useRef<QualityTier>(initialSnapshot.tier);

  useEffect(() => {
    tierRef.current = tier;
  }, [tier]);

  // Manual or automatic downgrade function with hysteresis
  const downgradeTier = useCallback((reason?: string) => {
    const now = performance.now();
    if (now - lastDowngradeTimeRef.current < DOWNGRADE_COOLDOWN_MS) {
      return; // Respect cooldown to prevent thrashing
    }

    const current = tierRef.current;
    if (current === "full") {
      lastDowngradeTimeRef.current = now;
      tierRef.current = "balanced";
      setTier("balanced");
      if (process.env.NODE_ENV !== "production") {
        console.info(`[AdaptivePerformance] Downgraded FULL -> BALANCED (${reason || "performance"})`);
      }
    } else if (current === "balanced") {
      lastDowngradeTimeRef.current = now;
      tierRef.current = "lite";
      setTier("lite");
      if (process.env.NODE_ENV !== "production") {
        console.info(`[AdaptivePerformance] Downgraded BALANCED -> LITE (${reason || "performance"})`);
      }
    }
  }, []);

  // Frame reporting from active visual components
  const reportSlowFrame = useCallback(
    (frameTimeMs: number) => {
      if (tierRef.current === "lite") return;
      if (frameTimeMs > SLOW_FRAME_THRESHOLD_MS) {
        slowFrameCountRef.current += 1;
        if (slowFrameCountRef.current >= SLOW_FRAME_STRIKES_REQUIRED) {
          slowFrameCountRef.current = 0;
          downgradeTier("sustained frame drops");
        }
      } else if (frameTimeMs < 20 && slowFrameCountRef.current > 0) {
        // Natural recovery of strike points on smooth frames
        slowFrameCountRef.current = Math.max(0, slowFrameCountRef.current - 0.5);
      }
    },
    [downgradeTier]
  );

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport, { passive: true });

    // Reduced Motion Listener
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener?.("change", onMotionChange);

    // WebGL Context Loss Listener
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setHasWebGL(false);
      tierRef.current = "lite";
      setTier("lite");
      if (process.env.NODE_ENV !== "production") {
        console.warn("[AdaptivePerformance] WebGL context lost on page, switching to LITE fallback");
      }
    };
    window.addEventListener("webglcontextlost", onContextLost, true);

    // Lightweight Long Task / Long Animation Frame Observer
    // Passive observer, zero rAF loop when idle
    let longTaskObserver: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== "undefined") {
      try {
        const supportedTypes = PerformanceObserver.supportedEntryTypes || [];
        if (supportedTypes.includes("longtask")) {
          longTaskObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              if (entry.duration > 90) {
                slowFrameCountRef.current += 2;
                if (slowFrameCountRef.current >= SLOW_FRAME_STRIKES_REQUIRED) {
                  slowFrameCountRef.current = 0;
                  downgradeTier("long task detected");
                }
              }
            }
          });
          longTaskObserver.observe({ entryTypes: ["longtask"] });
        }
      } catch {
        // PerformanceObserver may be restricted in some webviews
      }
    }

    return () => {
      window.removeEventListener("resize", checkViewport);
      motionQuery.removeEventListener?.("change", onMotionChange);
      window.removeEventListener("webglcontextlost", onContextLost, true);
      longTaskObserver?.disconnect();
    };
  }, [downgradeTier]);

  const value = useMemo<AdaptivePerformanceState>(() => {
    const isLite = tier === "lite";
    const isBalanced = tier === "balanced";
    const isFull = tier === "full";
    return {
      tier,
      isLite,
      isBalanced,
      isFull,
      prefersReducedMotion,
      hasWebGL,
      deviceMemory,
      hardwareConcurrency,
      isLowSpec: isLite,
      isMobileOrLow: isLite || (isBalanced && isMobile),
      downgradeTier,
      reportSlowFrame,
    };
  }, [
    tier,
    prefersReducedMotion,
    hasWebGL,
    deviceMemory,
    hardwareConcurrency,
    isMobile,
    downgradeTier,
    reportSlowFrame,
  ]);

  return (
    <AdaptivePerformanceContext.Provider value={value}>
      {children}
    </AdaptivePerformanceContext.Provider>
  );
}

/**
 * Access the adaptive capability state and performance tier.
 */
export function useAdaptivePerformance(): AdaptivePerformanceState {
  return useContext(AdaptivePerformanceContext);
}

/**
 * Backwards-compatible hook matching existing call sites.
 */
export function useLowSpecDevice() {
  return useAdaptivePerformance();
}
