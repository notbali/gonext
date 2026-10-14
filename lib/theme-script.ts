// Server-safe half of lib/theme.ts: the root layout inlines THEME_INIT_SCRIPT, and a
// server component can't import a module that uses client hooks.

export type Theme = "dark" | "light";

export const THEME_KEY = "gonext-theme";

/** Runs inline in <head> before first paint, so a light-mode viewer never sees a dark flash. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
