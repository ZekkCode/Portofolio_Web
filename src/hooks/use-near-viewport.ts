"use client";

import { useEffect, useRef, useState } from "react";

interface UseNearViewportOptions {
  /**
   * Root margin string for IntersectionObserver.
   * Defaults to "450px 0px 450px 0px" to begin loading 450px before entering viewport.
   */
  rootMargin?: string;
  /**
   * Optional threshold (0 to 1). Defaults to 0.
   */
  threshold?: number | number[];
  /**
   * If true, bypasses the observer and marks near immediately.
   */
  disabled?: boolean;
}

/**
 * React Bits inspired useNearOnce hook.
 * Fires once when the element is within rootMargin of the viewport,
 * permanently caching the loaded state and disconnecting the observer.
 */
export function useNearViewport<T extends HTMLElement = HTMLDivElement>(
  options: UseNearViewportOptions = {}
) {
  const {
    rootMargin = "450px 0px 450px 0px",
    threshold = 0,
    disabled = false,
  } = options;

  const elementRef = useRef<T | null>(null);
  const [isNear, setIsNear] = useState<boolean>(() => {
    if (disabled) return true;
    if (typeof window === "undefined") return false;
    if (typeof IntersectionObserver === "undefined") return true;
    return false;
  });

  useEffect(() => {
    if (isNear || disabled) return;

    const el = elementRef.current;
    if (!el) return;

    // If page was loaded directly with a hash targeting this element or its children
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.slice(1);
      if (hash && (el.id === hash || el.querySelector(`[id="${hash}"]`))) {
        queueMicrotask(() => setIsNear(true));
        return;
      }
    }

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [isNear, rootMargin, threshold, disabled]);

  return { ref: elementRef, isNear };
}

export default useNearViewport;
