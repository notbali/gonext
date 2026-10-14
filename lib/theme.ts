"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, type Theme } from "@/lib/theme-script";

export { THEME_INIT_SCRIPT, THEME_KEY, type Theme } from "@/lib/theme-script";

/**
 * Light/dark mode. Dark is the default and needs no attribute; light sets
 * data-theme="light" on <html>, which re-tints the raw tokens in app/globals.css.
 * The choice is per browser (localStorage), restored before paint by THEME_INIT_SCRIPT.
 */

const THEME_EVENT = "gonext-theme";

export function readSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function setRootTheme(theme: Theme) {
  if (theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
}

export function applyTheme(theme: Theme): void {
  setRootTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the switch still holds for this page view.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

/** The theme the page is showing. Dark during SSR; the init script has already set the root by hydration. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark"),
    () => "dark",
  );
}
