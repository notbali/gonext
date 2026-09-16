"use client";

import { useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent } from "framer-motion";
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
 *
 * Only the panel that's actually exiting (isPresent === false) gets a frozen
 * snapshot. The active panel always passes the live context through —
 * otherwise a same-pathname update (router.refresh() after a save, or a
 * `?week=N` nav, both of which don't remount this component) would freeze
 * forever at whatever context existed on first mount, and the page would
 * stop updating until a full reload.
 */
function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const isPresent = useIsPresent();
  // Track the latest live context while present, so there's something to
  // fall back to once isPresent flips to false and exit animation starts.
  const [frozen, setFrozen] = useState(context);
  if (isPresent && frozen !== context) {
    setFrozen(context);
  }
  return (
    <LayoutRouterContext.Provider value={isPresent ? context : frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
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
