import type { Match, Teammate } from "./types";

export interface FaviconSignals {
  hasUnsetDays: boolean;
  nearestMatchDate: Date | null;
}

/**
 * Derives the two real triggers for FaviconController from data the schedule
 * page already fetches — no separate query needed. `matches` is assumed
 * sorted ascending by date (as getScheduleData returns it).
 */
export function getFaviconSignals(
  schedule: { teammates: Teammate[]; matches: Match[] },
  teammateId: string,
): FaviconSignals {
  const teammate = schedule.teammates.find((t) => t.id === teammateId);
  const hasUnsetDays = teammate ? teammate.week.some((d) => d.status === "not-set") : false;
  const nearestMatchDate = schedule.matches[0]?.date ?? null;
  return { hasUnsetDays, nearestMatchDate };
}
