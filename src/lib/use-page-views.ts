"use client";

import { useEffect, useState } from "react";

const VIEWS_CACHE_KEY = "zekk:views:cache";

export function usePageViews() {
  const [views, setViews] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem(VIEWS_CACHE_KEY);
      if (cached && !isNaN(Number(cached))) return Number(cached);
    }
    return 1420;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function recordView() {
      try {
        const res = await fetch("/api/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = (await res.json()) as { views?: number };
          if (active && typeof data.views === "number") {
            setViews(data.views);
            window.localStorage.setItem(VIEWS_CACHE_KEY, String(data.views));
          }
        }
      } catch {
        // Fallback to GET if POST was blocked by adblock
        try {
          const res = await fetch("/api/views");
          if (res.ok) {
            const data = (await res.json()) as { views?: number };
            if (active && typeof data.views === "number") {
              setViews(data.views);
            }
          }
        } catch {
          // Keep initial cached views
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void recordView();

    return () => {
      active = false;
    };
  }, []);

  return { views, loading };
}
