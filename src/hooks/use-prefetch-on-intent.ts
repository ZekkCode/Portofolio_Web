"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Global cache of already prefetched module keys so components across
 * different sections don't duplicate dynamic import requests.
 */
const PREFETCH_CACHE = new Set<string>();

interface UsePrefetchOnIntentOptions {
  /**
   * Unique key to identify the prefetch target (prevents duplicate imports).
   */
  key?: string;
}

/**
 * React Bits inspired usePrefetchOnIntent hook.
 * Preloads heavy JavaScript modules on mouse hover, keyboard focus,
 * or touch start so modals and interactive components open instantly without delay.
 */
export function usePrefetchOnIntent(
  loadFn: () => Promise<unknown>,
  options: UsePrefetchOnIntentOptions = {}
) {
  const { key } = options;
  const [isPrefetched, setIsPrefetched] = useState(() => (key ? PREFETCH_CACHE.has(key) : false));
  const firedRef = useRef(isPrefetched);

  const prefetch = useCallback(() => {
    if (firedRef.current) return;
    if (key && PREFETCH_CACHE.has(key)) {
      firedRef.current = true;
      setIsPrefetched(true);
      return;
    }

    firedRef.current = true;
    setIsPrefetched(true);
    if (key) PREFETCH_CACHE.add(key);

    // Execute the import function asynchronously without blocking current task
    try {
      loadFn().catch(() => {
        // Silent catch for intentional prefetch failures (e.g. offline)
        if (key) PREFETCH_CACHE.delete(key);
        firedRef.current = false;
        setIsPrefetched(false);
      });
    } catch {
      // Ignored
    }
  }, [loadFn, key]);

  const intentProps = {
    onMouseEnter: prefetch,
    onFocus: prefetch,
    onTouchStart: prefetch,
  };

  return {
    prefetch,
    intentProps,
    isPrefetched,
  };
}

export default usePrefetchOnIntent;
