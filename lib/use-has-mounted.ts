"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * True once the component has mounted on the client, false during SSR and the
 * initial hydration pass. Use to gate anything that needs a browser-only API
 * (document.body for a portal, etc.) without a setState-in-effect footgun —
 * useSyncExternalStore is the primitive React designed for exactly this.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
