"use client";

import { useEffect, useRef, useState } from "react";

const SWEEP_DURATION_MS = 640;

export function DayColumnHeader({
  dow,
  num,
  matchLabel,
  complete,
  revealDelayMs,
  hasMatch,
}: {
  dow: string;
  num: string;
  matchLabel?: string;
  complete: boolean;
  revealDelayMs: number;
  hasMatch: boolean;
}) {
  const wasComplete = useRef(complete);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    if (complete && !wasComplete.current) {
      setSweeping(true);
      const t = setTimeout(() => setSweeping(false), SWEEP_DURATION_MS);
      wasComplete.current = complete;
      return () => clearTimeout(t);
    }
    wasComplete.current = complete;
  }, [complete]);

  return (
    <div
      data-testid="grid-column-header"
      data-reveal
      data-complete={complete ? "" : undefined}
      data-sweep={sweeping ? "" : undefined}
      style={{ transitionDelay: `${revealDelayMs}ms` }}
      className={`day-column-header relative flex flex-col items-center gap-1 overflow-hidden border-l border-border py-3 ${
        hasMatch ? "bg-brand-dim/40" : ""
      }`}
    >
      <span className="font-mono text-caption font-medium uppercase tracking-widest text-text-dim">
        {dow}
      </span>
      <span className="text-body-lg font-bold text-text-primary">{num}</span>
      {matchLabel && (
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-bright">
          Match {matchLabel}
        </span>
      )}
    </div>
  );
}
