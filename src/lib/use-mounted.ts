"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Idiomatic, hydration-safe hook to determine if the component has mounted on client.
 * Uses useSyncExternalStore to avoid React 19 cascading-render linter warnings.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
