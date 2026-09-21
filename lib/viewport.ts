import type { Viewport } from "next";

// Pinch-zoom stays enabled (no maximumScale / userScalable) — disabling it is an
// accessibility failure; iOS focus-zoom is prevented with 16px controls in globals.css.
export const appViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Matches --raw-bg in app/globals.css.
  themeColor: "#0f1923",
};
