"use client";

import { useSyncExternalStore } from "react";
import { hasUnseenPatchNotes } from "@/lib/patch-notes";

/** localStorage key holding the latest Patch notes date this browser has opened. */
export const PATCH_NOTES_SEEN_KEY = "gonext-patch-notes-seen";
const SEEN_EVENT = "gonext-patch-notes-seen";

export function readPatchNotesSeen(): string | null {
  try {
    return localStorage.getItem(PATCH_NOTES_SEEN_KEY);
  } catch {
    return null;
  }
}

export function markPatchNotesSeen(date: string): void {
  try {
    localStorage.setItem(PATCH_NOTES_SEEN_KEY, date);
  } catch {
    // Storage blocked (private mode, cleared site data): the dot just stays.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(SEEN_EVENT, onChange);
  // Another tab opening the page clears the dot here too.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SEEN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Whether this browser hasn't opened the Patch notes since the latest entry. False
 * during SSR and hydration, so the server never renders a dot the client then drops.
 */
export function useHasUnseenPatchNotes(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hasUnseenPatchNotes(readPatchNotesSeen()),
    () => false,
  );
}
