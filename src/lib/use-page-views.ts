"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const VIEWS_CACHE_KEY = "zekk:views:cache";
const SESSION_RECORDED_KEY = "zekk:views:engaged:session";
const DEFAULT_VIEWS = 1420;
const ENGAGED_VIEW_DELAY_MS = 20000; // 20 detik waktu tunggu keterlibatan aktif

let currentViews: number = DEFAULT_VIEWS;
let isGloballyEngaged: boolean = false;
let isGloballyVerified: boolean = false;

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

function getVerifiedSnapshot(): boolean {
  return isGloballyVerified;
}

function getServerVerifiedSnapshot(): boolean {
  return false;
}

// 1. Ambil jumlah view terkini secara instan (GET tanpa inkremen)
async function fetchCurrentViews(): Promise<number> {
  try {
    const res = await fetch("/api/views", { method: "GET" });
    if (res.ok) {
      const data = (await res.json()) as { views?: number; isVerified?: boolean };
      if (typeof data.views === "number") {
        currentViews = data.views;
        isGloballyVerified = Boolean(data.isVerified);
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
    // Abaikan kegagalan jaringan sementara
  }
  return currentViews;
}

// 2. Rekam kunjungan tervalidasi setelah 20 detik aktif (POST dengan deduplikasi hash 24 jam)
async function recordEngagedView(projectId = "portfolio"): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const sessionMark = window.sessionStorage.getItem(SESSION_RECORDED_KEY);
    if (sessionMark === "1") {
      isGloballyEngaged = true;
      notify();
      return;
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });

    if (res.ok) {
      const data = (await res.json()) as { views?: number; recorded?: boolean; isVerified?: boolean };
      if (typeof data.views === "number") {
        currentViews = data.views;
        isGloballyVerified = Boolean(data.isVerified);
        try {
          window.localStorage.setItem(VIEWS_CACHE_KEY, String(data.views));
          window.sessionStorage.setItem(SESSION_RECORDED_KEY, "1");
        } catch {
          // ignore
        }
        isGloballyEngaged = true;
        notify();
      }
    }
  } catch {
    // silent fallback
  }
}

export function usePageViews() {
  const views = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isVerified = useSyncExternalStore(subscribe, getVerifiedSnapshot, getServerVerifiedSnapshot);
  const [loading, setLoading] = useState(true);
  const [engaged, setEngaged] = useState(isGloballyEngaged);

  useEffect(() => {
    let active = true;

    // Muat dari cache lokal untuk render seketika tanpa pergeseran layout
    try {
      const cached = window.localStorage.getItem(VIEWS_CACHE_KEY);
      if (cached && !isNaN(Number(cached)) && Number(cached) !== currentViews) {
        currentViews = Number(cached);
        notify();
      }
      if (window.sessionStorage.getItem(SESSION_RECORDED_KEY) === "1") {
        isGloballyEngaged = true;
        queueMicrotask(() => {
          if (active) setEngaged(true);
        });
      }
    } catch {
      // ignore
    }

    // Ambil nilai terkini dari server
    void fetchCurrentViews().finally(() => {
      if (active) setLoading(false);
    });

    // Mulai Timer Kunjungan Tervalidasi (Engaged View Tracker 20 Detik)
    let elapsedActiveTime = 0;
    let lastTick = Date.now();
    let isTimerActive = true;

    const interval = setInterval(() => {
      if (!isTimerActive) return;

      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;

      // Hanya tambahkan waktu jika tab sedang dilihat aktif (bukan di background)
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        elapsedActiveTime += delta;
      }

      if (elapsedActiveTime >= ENGAGED_VIEW_DELAY_MS) {
        clearInterval(interval);
        isTimerActive = false;
        void recordEngagedView().then(() => {
          if (active) setEngaged(true);
        });
      }
    }, 1000);

    const handleVisibilityChange = () => {
      lastTick = Date.now();
    };

    const handleBeforeUnload = () => {
      clearInterval(interval);
      isTimerActive = false;
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      active = false;
      clearInterval(interval);
      isTimerActive = false;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    };
  }, []);

  return { views, loading, isEngaged: engaged, isVerified };
}
