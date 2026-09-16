"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { D, EASE, usePrefersReducedMotion } from "@/lib/motion";

const MotionImage = motion.create(Image);

export const AGENTS = [
  { name: "Jett", src: "/agents/jett.webp" },
  { name: "Sage", src: "/agents/sage.webp" },
  { name: "Fade", src: "/agents/fade.webp" },
] as const;

const ROTATE_INTERVAL_MS = 5000;

/** Crossfades through agent artwork under the legend card, cascading one-by-one on a timer. */
export function AgentShowcase() {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion || AGENTS.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % AGENTS.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const agent = AGENTS[index];

  return (
    <div
      data-testid="agent-showcase"
      className="relative h-[420px] w-full shrink-0 overflow-hidden rounded-lg border border-border bg-surface"
    >
      <AnimatePresence>
        <MotionImage
          key={agent.name}
          src={agent.src}
          alt={agent.name}
          fill
          sizes="340px"
          data-testid="agent-artwork"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: D.state, ease: EASE.out } }}
          exit={{ opacity: 0, transition: { duration: D.state, ease: EASE.out } }}
          className="absolute inset-0 object-contain"
        />
      </AnimatePresence>
    </div>
  );
}
