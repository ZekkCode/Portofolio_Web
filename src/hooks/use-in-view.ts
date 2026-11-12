"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  rootMargin?: string;
  threshold?: number | number[];
  /**
   * Whether to automatically reflect document.hidden into isInView
   * (so backgrounded browser tabs immediately pause rendering).
   * Defaults to true.
   */
  trackDocumentVisibility?: boolean;
}

/**
 * React Bits inspired useInView hook.
 * Continuously monitors if an element is inside the active viewport,
 * pausing rendering loops when scrolled out of view or when tab is hidden.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
) {
  const {
    rootMargin = "0px",
    threshold = 0,
    trackDocumentVisibility = true,
  } = options;

  const elementRef = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(() => typeof window !== "undefined" && typeof IntersectionObserver === "undefined");
  const isIntersectingRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const updateVisibility = () => {
      const isDocHidden = trackDocumentVisibility && typeof document !== "undefined" && document.hidden;
      setIsInView(isIntersectingRef.current && !isDocHidden);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isIntersectingRef.current = Boolean(entry && entry.isIntersecting);
        updateVisibility();
      },
      { rootMargin, threshold }
    );

    observer.observe(el);

    const handleDocVisibility = () => {
      updateVisibility();
    };

    if (trackDocumentVisibility && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleDocVisibility);
    }

    return () => {
      observer.disconnect();
      if (trackDocumentVisibility && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleDocVisibility);
      }
    };
  }, [rootMargin, threshold, trackDocumentVisibility]);

  return { ref: elementRef, isInView };
}

export default useInView;
