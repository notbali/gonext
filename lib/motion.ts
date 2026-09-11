"use client";

import { useEffect, useState } from "react";

/** Durations in seconds, for framer-motion transitions. Mirrors the CSS custom properties in app/globals.css. */
export const D = { micro: 0.12, ui: 0.24, state: 0.48 } as const;

/** Named easings, matching the CSS `--e-*` custom properties in app/globals.css. */
export const EASE = {
  snap: [0.2, 0, 0, 1],
  out: [0.16, 1, 0.3, 1],
  inout: [0.65, 0, 0.35, 1],
  lock: [0.34, 1.36, 0.64, 1],
} as const;

/** Entrance for cards/rows: rise 8px + fade, optionally staggered by index. */
export const rise = {
  hidden: { opacity: 0, y: 8 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: D.ui, ease: EASE.out, delay: i * 0.045 },
  }),
};

/** Route/panel transition: chrome holds still, only the panel moves. */
export const panel = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: D.state, ease: EASE.out } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14, ease: EASE.snap } },
};

/** Toast enter/exit: shears in from the right, resolves square. */
export const toast = {
  hidden: { opacity: 0, x: 24, skewX: -1.5 },
  visible: { opacity: 1, x: 0, skewX: 0, transition: { duration: D.ui + 0.08, ease: EASE.out } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.16 } },
};

/** Roster chip join/leave. */
export const chip = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: D.ui, ease: EASE.out } },
  exit: { opacity: 0, width: 0, transition: { duration: 0.2 } },
};

/** Tracks `prefers-reduced-motion: reduce`, updating live if the user changes it. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: { matches: boolean }) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    setReduced(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
