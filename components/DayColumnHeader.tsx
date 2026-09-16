"use client";

import { useEffect, useRef, useState } from "react";

const SWEEP_DURATION_MS = 640;

export function DayColumnHeader({
  dow,
  num,
  matchLabel,
  complete,
  matchReady,
  revealDelayMs,
  hasMatch,
}: {
  dow: string;
  num: string;
  matchLabel?: string;
  complete: boolean;
  /** True once 5+ teammates are available this day — a real Match candidate. */
  matchReady: boolean;
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

  const wasMatchReady = useRef(matchReady);
  const [sweepingReady, setSweepingReady] = useState(false);

  useEffect(() => {
    if (matchReady && !wasMatchReady.current) {
      setSweepingReady(true);
      const t = setTimeout(() => setSweepingReady(false), SWEEP_DURATION_MS);
      wasMatchReady.current = matchReady;
      return () => clearTimeout(t);
    }
    wasMatchReady.current = matchReady;
  }, [matchReady]);

  return (
    <div
      data-testid="grid-column-header"
      data-reveal
      data-complete={complete ? "" : undefined}
      data-sweep={sweeping ? "" : undefined}
      data-match-ready={matchReady ? "" : undefined}
      data-sweep-ready={sweepingReady ? "" : undefined}
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
