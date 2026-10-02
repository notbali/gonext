"use client";

import { useHasMounted } from "@/lib/use-has-mounted";
import { TEAM_TIMEZONE } from "@/lib/dates";

/** e.g. "Wed 5:00 PM PDT". Built from parts so it doesn't vary with the runtime's ICU punctuation and spacing. */
function wallClock(date: Date, timeZone: string, withZone: boolean): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const clock = `${part("weekday")} ${part("hour")}:${part("minute")} ${part("dayPeriod")}`;
  return withZone ? `${clock} ${part("timeZoneName")}` : clock;
}

/**
 * A match's start in the viewer's own timezone, under the Eastern time every
 * match is listed in. Hidden when the viewer's clock already reads the same as
 * Eastern. Browser-only (the viewer's zone isn't known on the server), so it
 * appears after hydration. `timeZone` overrides the browser's, for tests.
 */
export function LocalMatchTime({ date, timeZone, className = "" }: { date: Date; timeZone?: string; className?: string }) {
  const mounted = useHasMounted();
  if (!mounted) return null;

  const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (wallClock(date, zone, false) === wallClock(date, TEAM_TIMEZONE, false)) return null;

  return (
    <p data-testid="local-time" className={`font-mono text-caption tracking-wide text-text-dim ${className}`}>
      Your time · {wallClock(date, zone, true)}
    </p>
  );
}
