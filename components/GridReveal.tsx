"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Wraps server-rendered grid content so its `[data-reveal]` cells (already in
 * the initial HTML) can cascade in on mount instead of appearing all at once.
 * `data-revealed` flips shortly after paint; app/globals.css does the rest.
 */
export function GridReveal({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // display:contents keeps this wrapper out of the flex/grid layout entirely —
  // it exists only so [data-revealed] can be a CSS ancestor of [data-reveal] cells.
  return (
    <div className="contents" data-revealed={revealed ? "" : undefined}>
      {children}
    </div>
  );
}
