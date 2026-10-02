"use client";

import { useEffect, useState } from "react";
import { minutesUntil, preciseCountdown } from "@/lib/dates";

const TICK_MS = 15_000;
const URGENCY_WINDOW_MINUTES = 60;

/**
 * A match card's countdown badge, ticking on the client ("IN 3H 12M" → "LIVE")
 * and taking on the urgency pulse once the match is within the hour. Renders
 * against the server's `now` first so the hydrated HTML matches.
 */
export function LiveCountdown({ date, now: serverNow }: { date: Date; now: Date }) {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    // The client clock only exists after mount; syncing it in here is the point of the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const minutesOut = minutesUntil(date, now);
  const isUrgent = minutesOut >= 0 && minutesOut <= URGENCY_WINDOW_MINUTES;

  return (
    <span
      data-testid="match-countdown"
      data-urgent={isUrgent ? "" : undefined}
      className={`shrink-0 rounded-full bg-brand-dim px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-brand-bright ${
        isUrgent ? "urgency-breathe" : ""
      }`}
    >
      {preciseCountdown(date, now)}
    </span>
  );
}
