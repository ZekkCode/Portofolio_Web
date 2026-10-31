"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BUDDY_CONFIG } from "@/lib/buddy/buddy-config";
import { BuddyDirection, BuddyState, DeviceMode } from "@/lib/buddy/buddy-types";

interface UseBuddyRoamingProps {
  isPaused: boolean;
  isHidden: boolean;
  onStateChange?: (state: BuddyState) => void;
}

export function useBuddyRoaming({
  isPaused,
  isHidden,
  onStateChange,
}: UseBuddyRoamingProps) {
  const [state, setState] = useState<BuddyState>("idle");
  const [direction, setDirection] = useState<BuddyDirection>(1);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [isDocked, setIsDocked] = useState(false);

  // Position references (avoiding high-frequency React re-renders)
  const xRef = useRef<number>(24);
  const directionRef = useRef<BuddyDirection>(1);
  const stateRef = useRef<BuddyState>("idle");
  const domRef = useRef<HTMLDivElement | null>(null);

  // Timing & loop references
  const rafId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef<boolean>(isPaused);
  const isHiddenRef = useRef<boolean>(isHidden);
  const isDockedRef = useRef<boolean>(false);
  const deviceModeRef = useRef<DeviceMode>("desktop");
  const prefersReducedMotionRef = useRef<boolean>(false);
  const scheduleNextBehaviorRef = useRef<() => void>(() => {});

  const characterSize =
    deviceMode === "mobile"
      ? BUDDY_CONFIG.mobileSize
      : deviceMode === "tablet"
      ? BUDDY_CONFIG.tabletSize
      : BUDDY_CONFIG.desktopSize;

  const updateState = useCallback(
    (newState: BuddyState) => {
      stateRef.current = newState;
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  // Apply transform directly to DOM node for 60fps hardware-accelerated movement
  const applyTransform = useCallback((x: number) => {
    if (domRef.current) {
      domRef.current.style.transform = `translate3d(${Math.round(x)}px, 0, 0)`;
    }
  }, []);

  // Set explicit temporary action (greeting, thinking, success, etc.)
  const playAction = useCallback(
    (action: BuddyState, durationMs: number = 2400) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      updateState(action);

      timerRef.current = setTimeout(() => {
        if (!isPausedRef.current && !isHiddenRef.current) {
          updateState("idle");
        }
      }, durationMs);
    },
    [updateState]
  );

  // Compute collision-safe roaming bounds for the current device and UI state
  const getSafeBounds = useCallback(() => {
    const mode = deviceModeRef.current;
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1280;

    if (mode === "mobile") {
      // Mobile (<768px): Micro-walk safe zone near bottom-left (16px - 64px)
      // Keeps buddy fully clear of content reading areas and interactions
      return { minX: 16, maxX: 64 };
    }

    if (mode === "tablet") {
      // Tablet (768px - 1023px): Lower-left safe corridor away from centered nav
      const maxX = Math.min(260, Math.floor(windowWidth * 0.35));
      return { minX: 20, maxX: Math.max(70, maxX) };
    }

    // Desktop (>=1024px):
    // Left-side roaming corridor that stops before the floating pill nav (which sits at center: 50% - ~280px)
    // Ensures buddy NEVER walks behind or over the centered navigation
    const centerNavLeft = Math.floor(windowWidth * 0.5 - 280);
    const maxX = Math.min(520, Math.max(120, centerNavLeft));
    return { minX: 24, maxX };
  }, []);

  // Schedule next behavior (walk or idle)
  const scheduleNextBehavior = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Stop autonomous roaming when paused, hidden, docked at footer, or user prefers reduced motion
    if (
      isPausedRef.current ||
      isHiddenRef.current ||
      isDockedRef.current ||
      prefersReducedMotionRef.current
    ) {
      if (stateRef.current.startsWith("walking")) {
        updateState("idle");
      }
      return;
    }

    const currentState = stateRef.current;
    const { minX, maxX } = getSafeBounds();

    if (currentState === "idle") {
      // Determine walking direction within safe bounds
      let nextDir = directionRef.current;
      if (xRef.current >= maxX - 12) {
        nextDir = -1;
      } else if (xRef.current <= minX + 12) {
        nextDir = 1;
      } else {
        nextDir = Math.random() > 0.5 ? 1 : -1;
      }

      directionRef.current = nextDir;
      setDirection(nextDir);

      // Transition to walking
      const walkState: BuddyState = nextDir === 1 ? "walking-right" : "walking-left";
      updateState(walkState);

      // On mobile, walk duration is very short (micro-walk)
      const isMobile = deviceModeRef.current === "mobile";
      const walkDuration = isMobile
        ? 1500 + Math.random() * 1500
        : BUDDY_CONFIG.walkIntervalMin +
          Math.random() * (BUDDY_CONFIG.walkIntervalMax - BUDDY_CONFIG.walkIntervalMin);

      timerRef.current = setTimeout(() => {
        if (!isPausedRef.current && !isHiddenRef.current) {
          updateState("idle");
          scheduleNextBehaviorRef.current();
        }
      }, walkDuration);
    } else if (
      currentState === "walking-left" ||
      currentState === "walking-right"
    ) {
      // Transition to idle
      updateState("idle");

      const idleDuration =
        BUDDY_CONFIG.idleIntervalMin +
        Math.random() * (BUDDY_CONFIG.idleIntervalMax - BUDDY_CONFIG.idleIntervalMin);

      timerRef.current = setTimeout(() => {
        if (!isPausedRef.current && !isHiddenRef.current) {
          scheduleNextBehaviorRef.current();
        }
      }, idleDuration);
    }
  }, [getSafeBounds, updateState]);

  // Keep scheduleNextBehaviorRef in sync
  useEffect(() => {
    scheduleNextBehaviorRef.current = scheduleNextBehavior;
  }, [scheduleNextBehavior]);

  // Main RAF physics loop
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = motionQuery.matches;

    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
      if (e.matches) {
        updateState("idle");
      }
    };
    motionQuery.addEventListener("change", onMotionChange);

    // Initial Device Mode Detection
    const updateDeviceMode = () => {
      const width = window.innerWidth;
      const nextMode: DeviceMode =
        width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
      deviceModeRef.current = nextMode;
      setDeviceMode(nextMode);

      // Clamp position within safe bounds
      const { minX, maxX } = getSafeBounds();
      xRef.current = Math.max(minX, Math.min(maxX, xRef.current));
      applyTransform(xRef.current);
    };

    updateDeviceMode();
    window.addEventListener("resize", updateDeviceMode, { passive: true });

    // Footer Docking Detection: dock to bottom when footer comes into view
    const checkFooterDock = () => {
      const footer = document.querySelector("footer");
      if (!footer) return;

      const rect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const docked = rect.top <= windowHeight - 40;

      if (docked !== isDockedRef.current) {
        isDockedRef.current = docked;
        setIsDocked(docked);

        if (docked && stateRef.current.startsWith("walking")) {
          updateState("idle");
        }
      }
    };

    window.addEventListener("scroll", checkFooterDock, { passive: true });
    checkFooterDock();

    // 60FPS Physics Tick
    const tick = (now: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000); // clamp dt to avoid teleports
      lastTimeRef.current = now;

      // Move when in walking state
      const current = stateRef.current;
      if (
        (current === "walking-left" || current === "walking-right") &&
        !isPausedRef.current &&
        !isHiddenRef.current &&
        !isDockedRef.current &&
        !prefersReducedMotionRef.current
      ) {
        const speed = BUDDY_CONFIG.speed; // px per second
        const delta = speed * directionRef.current * dt;
        let newX = xRef.current + delta;

        const { minX, maxX } = getSafeBounds();

        // Bounce when reaching boundaries
        if (newX >= maxX) {
          newX = maxX;
          directionRef.current = -1;
          setDirection(-1);
          updateState("walking-left");
        } else if (newX <= minX) {
          newX = minX;
          directionRef.current = 1;
          setDirection(1);
          updateState("walking-right");
        }

        xRef.current = newX;
        applyTransform(newX);
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    // Pause physics tick when tab is in background to save CPU and battery
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        lastTimeRef.current = 0;
      } else {
        lastTimeRef.current = performance.now();
        rafId.current = requestAnimationFrame(tick);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("scroll", checkFooterDock);
      window.removeEventListener("resize", updateDeviceMode);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [applyTransform, getSafeBounds, updateState]);

  // React to pause / unpause changes
  useEffect(() => {
    isPausedRef.current = isPaused;
    isHiddenRef.current = isHidden;

    if (isPaused || isHidden || isDocked) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (stateRef.current.startsWith("walking")) {
        updateState("idle");
      }
    } else {
      scheduleNextBehavior();
    }
  }, [isPaused, isHidden, isDocked, scheduleNextBehavior, updateState]);

  return {
    domRef,
    state,
    direction,
    deviceMode,
    characterSize,
    isDocked,
    setState: updateState,
    playAction,
    teleport: (newX: number) => {
      xRef.current = newX;
      applyTransform(newX);
    },
  };
}
