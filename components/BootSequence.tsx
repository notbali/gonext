"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@/lib/motion";

const SESSION_KEY = "gonext-booted";
const NORMAL_DURATION_MS = 1900;
const REDUCED_DURATION_MS = 120;

const STAGES = ["SESSION", "ROSTER", "SCHEDULE", "READY"];

function subscribeNoop() {
  return () => {};
}
function getIsColdSession() {
  return !sessionStorage.getItem(SESSION_KEY);
}
function getIsColdSessionServerSnapshot() {
  // Never show the boot sequence during SSR — it's a client-only, post-hydration reveal.
  return false;
}

/**
 * A scripted, branded reveal shown once per cold session (gated by
 * sessionStorage — skipped on warm client-side navigation). This app
 * resolves all data server-side before any client JS runs, so there's no
 * real fetch waterfall to gate this on; it's honest chrome, not a
 * disguised loading state.
 */
export function BootSequence() {
  const reducedMotion = usePrefersReducedMotion();
  // Server and the first client (hydration) render both resolve to false via
  // getServerSnapshot, so there's nothing to mismatch — this only reflects
  // sessionStorage once the client has actually mounted.
  const isColdSession = useSyncExternalStore(
    subscribeNoop,
    getIsColdSession,
    getIsColdSessionServerSnapshot,
  );
  const [dismissed, setDismissed] = useState(false);
  const visible = isColdSession && !dismissed;

  useEffect(() => {
    if (!visible) return;
    const duration = reducedMotion ? REDUCED_DURATION_MS : NORMAL_DURATION_MS;
    const t = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setDismissed(true);
    }, duration);
    return () => clearTimeout(t);
  }, [visible, reducedMotion]);

  if (!visible) return null;

  return (
    <div
      data-testid="boot-sequence"
      className="boot-sequence fixed inset-0 z-[100] flex items-center justify-center bg-bg"
    >
      <div className="flex flex-col items-center gap-7">
        <div className="flex items-center gap-4">
          <div className="boot-mark flex h-11 w-11 rotate-45 items-center justify-center border-2 border-brand">
            <div className="boot-mark-dot h-3.5 w-3.5 bg-brand" />
          </div>
          <div className="overflow-hidden">
            <div className="boot-wordmark whitespace-nowrap font-mono text-3xl font-bold tracking-wide text-text-primary">
              GO//NEXT
            </div>
          </div>
        </div>
        <div className="grid w-[280px] gap-2">
          {STAGES.map((stage, i) => (
            <div
              key={stage}
              style={{ animationDelay: `${i * 110}ms` }}
              className="boot-stage-row flex justify-between font-mono text-[11px] tracking-wider text-text-dim"
            >
              <span>{stage}</span>
              <span className="boot-stage-ok font-bold" style={{ animationDelay: `${i * 110 + 200}ms` }}>
                OK
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
