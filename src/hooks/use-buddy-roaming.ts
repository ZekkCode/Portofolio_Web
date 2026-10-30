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

  isPausedRef.current = isPaused;
  isHiddenRef.current = isHidden;

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
    // Left-side roaming corridor that stops before the floating pill nav (which sits at center: 50% - ~240px)
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
          scheduleNextBehavior();
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
          scheduleNextBehavior();
        }
      }, idleDuration);
    }
  }, [getSafeBounds, updateState]);

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
      if (xRef.current > maxX) {
        xRef.current = maxX;
        applyTransform(maxX);
      } else if (xRef.current < minX) {
        xRef.current = minX;
        applyTransform(minX);
      }
    };

    updateDeviceMode();

    // Footer docking detector (IntersectionObserver / Scroll check)
    const checkFooterDock = () => {
      const footer = document.querySelector("footer");
      if (footer) {
        const rect = footer.getBoundingClientRect();
        // Dock when footer enters visible bottom area
        const nearFooter = rect.top <= window.innerHeight - 30;
        if (nearFooter !== isDockedRef.current) {
          isDockedRef.current = nearFooter;
          setIsDocked(nearFooter);
          if (nearFooter) {
            // Smoothly park at safe lower-left anchor
            if (stateRef.current.startsWith("walking")) {
              updateState("idle");
            }
          } else {
            // Resumed above footer
            scheduleNextBehavior();
          }
        }
      }
    };

    window.addEventListener("scroll", checkFooterDock, { passive: true });
    window.addEventListener("resize", updateDeviceMode, { passive: true });
    checkFooterDock();

    // Initial positioning
    applyTransform(xRef.current);

    // Initial delay before first walk
    timerRef.current = setTimeout(() => {
      scheduleNextBehavior();
    }, 2200);

    const onFrame = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const currentState = stateRef.current;
      const isWalking =
        currentState === "walking-left" || currentState === "walking-right";

      if (
        isWalking &&
        !isPausedRef.current &&
        !isHiddenRef.current &&
        !isDockedRef.current &&
        !prefersReducedMotionRef.current
      ) {
        const { minX, maxX } = getSafeBounds();

        let nextX = xRef.current + directionRef.current * BUDDY_CONFIG.speed * dt;

        // Boundary bounce within safe corridor
        if (nextX >= maxX) {
          nextX = maxX;
          directionRef.current = -1;
          setDirection(-1);
          updateState("walking-left");
        } else if (nextX <= minX) {
          nextX = minX;
          directionRef.current = 1;
          setDirection(1);
          updateState("walking-right");
        }

        xRef.current = nextX;
        applyTransform(nextX);
      }

      rafId.current = requestAnimationFrame(onFrame);
    };

    rafId.current = requestAnimationFrame(onFrame);

    // Pause RAF / timers when tab is hidden
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (stateRef.current !== "hidden") {
          updateState("idle");
        }
      } else {
        lastTimeRef.current = performance.now();
        scheduleNextBehavior();
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
  }, [applyTransform, getSafeBounds, scheduleNextBehavior, updateState]);

  // React to pause / unpause changes
  useEffect(() => {
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
    x: xRef.current,
    setState: updateState,
    playAction,
    teleport: (newX: number) => {
      xRef.current = newX;
      applyTransform(newX);
    },
  };
}
