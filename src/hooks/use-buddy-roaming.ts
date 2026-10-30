"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BUDDY_CONFIG } from "@/lib/buddy/buddy-config";
import { BuddyDirection, BuddyState } from "@/lib/buddy/buddy-types";

interface UseBuddyRoamingProps {
  isPaused: boolean;
  isHidden: boolean;
  isMobile: boolean;
  onStateChange?: (state: BuddyState) => void;
}

export function useBuddyRoaming({
  isPaused,
  isHidden,
  isMobile,
  onStateChange,
}: UseBuddyRoamingProps) {
  const [state, setState] = useState<BuddyState>("idle");
  const [direction, setDirection] = useState<BuddyDirection>(1);

  // Position references (avoiding 60fps React rerenders)
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

  isPausedRef.current = isPaused;
  isHiddenRef.current = isHidden;

  const characterWidth = isMobile
    ? BUDDY_CONFIG.mobileSize.width
    : BUDDY_CONFIG.desktopSize.width;

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
      domRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
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

  // Schedule next behavior (walk or idle)
  const scheduleNextBehavior = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isPausedRef.current || isHiddenRef.current) return;

    const currentState = stateRef.current;

    if (currentState === "idle") {
      // Pick random direction or respect boundaries
      const minX = BUDDY_CONFIG.boundsPadding;
      const maxX = Math.max(
        minX,
        window.innerWidth - characterWidth - BUDDY_CONFIG.rightAvoidMargin
      );

      let nextDir = directionRef.current;
      if (xRef.current >= maxX - 20) {
        nextDir = -1;
      } else if (xRef.current <= minX + 20) {
        nextDir = 1;
      } else {
        nextDir = Math.random() > 0.5 ? 1 : -1;
      }

      directionRef.current = nextDir;
      setDirection(nextDir);

      // Transition to walking
      const walkState: BuddyState = nextDir === 1 ? "walking-right" : "walking-left";
      updateState(walkState);

      const walkDuration =
        BUDDY_CONFIG.walkIntervalMin +
        Math.random() *
          (BUDDY_CONFIG.walkIntervalMax - BUDDY_CONFIG.walkIntervalMin);

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
        Math.random() *
          (BUDDY_CONFIG.idleIntervalMax - BUDDY_CONFIG.idleIntervalMin);

      timerRef.current = setTimeout(() => {
        if (!isPausedRef.current && !isHiddenRef.current) {
          scheduleNextBehavior();
        }
      }, idleDuration);
    }
  }, [characterWidth, updateState]);

  // Main RAF physics loop
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial positioning
    applyTransform(xRef.current);

    // Initial delay before first walk
    timerRef.current = setTimeout(() => {
      scheduleNextBehavior();
    }, 2000);

    const onFrame = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const currentState = stateRef.current;
      const isWalking =
        currentState === "walking-left" || currentState === "walking-right";

      if (isWalking && !isPausedRef.current && !isHiddenRef.current) {
        const minX = BUDDY_CONFIG.boundsPadding;
        const maxX = Math.max(
          minX,
          window.innerWidth - characterWidth - BUDDY_CONFIG.rightAvoidMargin
        );

        let nextX = xRef.current + directionRef.current * BUDDY_CONFIG.speed * dt;

        // Boundary bounce
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

    // Handle window resize: clamp position inside new viewport width
    const onResize = () => {
      const minX = BUDDY_CONFIG.boundsPadding;
      const maxX = Math.max(
        minX,
        window.innerWidth - characterWidth - BUDDY_CONFIG.rightAvoidMargin
      );
      if (xRef.current > maxX) {
        xRef.current = maxX;
        applyTransform(maxX);
      }
    };

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

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [applyTransform, characterWidth, scheduleNextBehavior, updateState]);

  // React to pause / unpause changes
  useEffect(() => {
    if (isPaused || isHidden) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (stateRef.current.startsWith("walking")) {
        updateState("idle");
      }
    } else {
      scheduleNextBehavior();
    }
  }, [isPaused, isHidden, scheduleNextBehavior, updateState]);

  return {
    domRef,
    state,
    direction,
    x: xRef.current,
    setState: updateState,
    playAction,
    teleport: (newX: number) => {
      xRef.current = newX;
      applyTransform(newX);
    },
  };
}
