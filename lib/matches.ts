import type { Match, Teammate } from "./types";
import { isOnTeamDay, teamMinuteOfDay } from "./dates";
import { parseTimeRange, rangeCoversMinute } from "./time-range";

/**
 * A teammate counts as confirmed when they're Available on the match's
 * (Eastern) date and, if they gave a time range, it covers the match's start.
 * A legacy free-text range that can't be read gets the benefit of the doubt
 * — new ranges are validated on save (see normalizeTimeRange).
 */
export function getConfirmedTeammates<T extends Pick<Teammate, "week">>(
  match: Pick<Match, "date">,
  teammates: T[],
  weekDates: Date[],
): T[] {
  const dayIndex = weekDates.findIndex((d) => isOnTeamDay(match.date, d));
  if (dayIndex === -1) return [];
  const startMinute = teamMinuteOfDay(match.date);

  return teammates.filter((t) => {
    const day = t.week[dayIndex];
    if (day?.status !== "available") return false;
    const range = day.timeRange ? parseTimeRange(day.timeRange) : null;
    return !range || rangeCoversMinute(range, startMinute);
  });
}
