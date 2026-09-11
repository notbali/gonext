"use client";

import { useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { panel } from "@/lib/motion";

/**
 * Next's router context keeps updating live for as long as a segment stays
 * mounted — including the outgoing panel, which AnimatePresence (mode="wait")
 * keeps mounted for its exit animation. Without this, that still-exiting
 * panel silently receives the *new* route's children partway through its
 * exit, mounting the new page once there and again when the real entering
 * panel mounts a moment later — every entrance animation inside plays twice.
 * Freezing the context snapshot each panel was born with stops it from ever
 * seeing a route change while it's still on screen.
 */
function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const [frozen] = useState(context);
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

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
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
