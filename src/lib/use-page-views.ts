"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const VIEWS_CACHE_KEY = "zekk:views:cache";
const DEFAULT_VIEWS = 1420;

let currentViews: number = (() => {
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem(VIEWS_CACHE_KEY);
      if (cached && !isNaN(Number(cached))) return Number(cached);
    } catch {
      // ignore
    }
  }
  return DEFAULT_VIEWS;
})();

let fetchPromise: Promise<number> | null = null;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((cb) => cb());
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot(): number {
  return currentViews;
}

function getServerSnapshot(): number {
  return DEFAULT_VIEWS;
}

async function fetchViewsOnce(): Promise<number> {
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as { views?: number };
        if (typeof data.views === "number") {
          currentViews = data.views;
          try {
            window.localStorage.setItem(VIEWS_CACHE_KEY, String(data.views));
          } catch {
            // ignore
          }
          notify();
          return data.views;
        }
      }
    } catch {
      // Fallback to GET if POST was blocked by adblock
      try {
        const res = await fetch("/api/views");
        if (res.ok) {
          const data = (await res.json()) as { views?: number };
          if (typeof data.views === "number") {
            currentViews = data.views;
            notify();
            return data.views;
          }
        }
      } catch {
        // Keep initial views
      }
    }
    return currentViews;
  })();

  return fetchPromise;
}

export function usePageViews() {
  const views = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchViewsOnce().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { views, loading };
}
