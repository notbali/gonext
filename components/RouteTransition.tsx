"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { panel } from "@/lib/motion";

/**
 * Chrome (the persistent nav) sits outside this component and holds still.
 * Only the panel transitions, keyed on pathname.
 *
 * Deliberately does NOT also key on searchParams: that would require
 * useSearchParams(), which needs a Suspense boundary — and the App Router
 * re-suspends this component on every navigation while the new RSC payload
 * streams in. A boundary here would show its fallback (unanimated) first,
 * then swap to the real AnimatePresence-wrapped content once resolved,
 * producing a visible flash-then-reanimate on every navigation. Losing
 * transitions on in-place `?week=N` changes is a fair trade for that.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} initial={panel.initial} animate={panel.animate} exit={panel.exit}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
