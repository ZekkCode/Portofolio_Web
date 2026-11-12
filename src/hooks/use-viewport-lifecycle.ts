"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type ViewportStage =
  | "NOT_NEAR"
  | "PREPARING"
  | "READY"
  | "ACTIVE"
  | "IDLE_OR_OFFSCREEN";

export interface UseViewportLifecycleOptions {
  /**
   * Margin for triggering the PREPARING stage (module/asset loading).
   * Default: "600px 0px 600px 0px"
   */
  prepareMargin?: string;
  /**
   * Margin for triggering ACTIVE rendering (in viewport).
   * Default: "0px"
   */
  activeMargin?: string;
  /**
   * If true, starts directly in ACTIVE stage (e.g. for above-the-fold Hero).
   */
  eager?: boolean;
  /**
   * Target element ID for URL hash deep-link matching.
   */
  targetId?: string;
}

export interface ViewportLifecycleResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  stage: ViewportStage;
  isPreparingOrReady: boolean;
  isActive: boolean;
  markReady: () => void;
  setInteracting: (interacting: boolean) => void;
}

/**
 * React Bits inspired shared viewport lifecycle manager.
 * Stages:
 * - NOT_NEAR: Offscreen and outside prepare boundary. No heavy initialization.
 * - PREPARING: Within prepareMargin (~600px). Load JavaScript and assets.
 * - READY: Assets and DOM nodes are prepared.
 * - ACTIVE: Inside visible viewport and active tab. Runs rendering loops.
 * - IDLE_OR_OFFSCREEN: Scrolled past or tab backgrounded. Suspends render frames.
 */
export function useViewportLifecycle<T extends HTMLElement = HTMLDivElement>(
  options: UseViewportLifecycleOptions = {}
): ViewportLifecycleResult<T> {
  const {
    prepareMargin = "600px 0px 600px 0px",
    activeMargin = "0px",
    eager = false,
    targetId,
  } = options;

  const elementRef = useRef<T | null>(null);
  const isInteractingRef = useRef<boolean>(false);
  const isIntersectingActiveRef = useRef<boolean>(false);

  const [stage, setStage] = useState<ViewportStage>(() => {
    if (eager) return "ACTIVE";
    if (typeof window === "undefined") return "NOT_NEAR";
    if (typeof IntersectionObserver === "undefined") return "ACTIVE";
    if (window.location.hash && targetId && window.location.hash === `#${targetId}`) {
      return "PREPARING";
    }
    return "NOT_NEAR";
  });

  const markReady = useCallback(() => {
    setStage((prev) => {
      if (prev === "PREPARING" || prev === "NOT_NEAR") {
        return isIntersectingActiveRef.current ? "ACTIVE" : "READY";
      }
      return prev;
    });
  }, []);

  const setInteracting = useCallback((interacting: boolean) => {
    isInteractingRef.current = interacting;
    if (interacting) {
      setStage("ACTIVE");
    }
  }, []);

  useEffect(() => {
    if (eager) return;

    const el = elementRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    // 1. Check if direct URL hash matches
    if (window.location.hash) {
      const hash = window.location.hash.slice(1);
      if (hash && (el.id === hash || el.querySelector(`[id="${hash}"]`))) {
        queueMicrotask(() => setStage("ACTIVE"));
        return;
      }
    }

    // 2. Observer for PREPARING stage (600px ahead of viewport)
    let prepareObserver: IntersectionObserver | null = new IntersectionObserver(
      ([entry]) => {
        if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
          setStage((prev) => {
            if (prev === "NOT_NEAR") return "PREPARING";
            return prev;
          });
          // Once prepared, disconnect the preparing observer so it stays loaded
          if (prepareObserver) {
            prepareObserver.disconnect();
            prepareObserver = null;
          }
        }
      },
      { rootMargin: prepareMargin }
    );
    prepareObserver.observe(el);

    // 3. Observer for ACTIVE vs IDLE_OR_OFFSCREEN stage (exact viewport)
    const updateActiveState = () => {
      const isDocHidden = typeof document !== "undefined" && document.hidden;
      const isVisible = isIntersectingActiveRef.current && !isDocHidden;

      setStage((prev) => {
        if (isInteractingRef.current) return "ACTIVE";
        if (isVisible) {
          return "ACTIVE";
        }
        if (prev === "ACTIVE") {
          return "IDLE_OR_OFFSCREEN";
        }
        return prev;
      });
    };

    const activeObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersectingActiveRef.current = Boolean(entry && entry.isIntersecting);
        updateActiveState();
      },
      { rootMargin: activeMargin }
    );
    activeObserver.observe(el);

    const onVisibilityChange = () => {
      updateActiveState();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (prepareObserver) {
        prepareObserver.disconnect();
      }
      activeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [eager, prepareMargin, activeMargin, targetId]);

  const isPreparingOrReady =
    stage === "PREPARING" || stage === "READY" || stage === "ACTIVE" || stage === "IDLE_OR_OFFSCREEN";
  const isActive = stage === "ACTIVE";

  return {
    ref: elementRef,
    stage,
    isPreparingOrReady,
    isActive,
    markReady,
    setInteracting,
  };
}

export default useViewportLifecycle;
