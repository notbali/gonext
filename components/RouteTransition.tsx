"use client";

import { Suspense, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { panel } from "@/lib/motion";

/**
 * Chrome (the persistent nav) sits outside this component and holds still.
 * Only the panel transitions: it exits/enters on pathname+query changes
 * (query is included so week navigation, which stays on "/", still transitions).
 */
function TransitionedPanel({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div key={routeKey} initial={panel.initial} animate={panel.animate} exit={panel.exit}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function RouteTransition({ children }: { children: ReactNode }) {
  // useSearchParams() requires a Suspense boundary; contain that requirement
  // here so app/layout.tsx doesn't need to know about it.
  return (
    <Suspense fallback={children}>
      <TransitionedPanel>{children}</TransitionedPanel>
    </Suspense>
  );
}
