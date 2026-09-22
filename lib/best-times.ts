import type { Teammate } from "./types";
import { isSameDate, shortDayLabel } from "./dates";
import { formatTimeRange, parseTimeRange, rangeCoversMinute } from "./time-range";
import { MATCH_READY_THRESHOLD } from "./schedule-column-state";

/** Premier windows are evenings; only suggest start times from noon to 11PM ET. */
const FIRST_HOUR = 12;
const LAST_HOUR = 23;

export interface TimeSuggestion {
  /** Index into the `dates` passed in. */
  dayIndex: number;
  /** The best window's start and end, as whole Eastern hours (end exclusive). */
  startHour: number;
  endHour: number;
  /** How many teammates would count as Confirmed for a match starting in the window. */
  count: number;
  ready: boolean;
  label: string;
}

function availableAt(teammate: Pick<Teammate, "week">, dayIndex: number, minute: number): boolean {
  const day = teammate.week[dayIndex];
  if (day?.status !== "available") return false;
  const range = day.timeRange ? parseTimeRange(day.timeRange) : null;
  return !range || rangeCoversMinute(range, minute);
}

/**
 * For each day from `today` on, the earliest run of start hours where the most
 * teammates would be Confirmed — the Coach's best bets for scheduling a match.
 * Best days first (most available, then soonest).
 */
export function suggestMatchTimes(
  teammates: Pick<Teammate, "week">[],
  dates: Date[],
  today: Date,
  limit = 3,
): TimeSuggestion[] {
  const suggestions: TimeSuggestion[] = [];

  dates.forEach((date, dayIndex) => {
    if (date < today && !isSameDate(date, today)) return;

    const counts: number[] = [];
    for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
      counts.push(teammates.filter((t) => availableAt(t, dayIndex, hour * 60)).length);
    }
    const best = Math.max(...counts);
    if (best === 0) return;

    const first = counts.indexOf(best);
    let last = first;
    while (counts[last + 1] === best) last++;
    const startHour = FIRST_HOUR + first;
    const endHour = FIRST_HOUR + last + 1;

    suggestions.push({
      dayIndex,
      startHour,
      endHour,
      count: best,
      ready: best >= MATCH_READY_THRESHOLD,
      label: `${shortDayLabel(date)} · ${formatTimeRange({ start: startHour * 60, end: endHour * 60 })}`,
    });
  });

  return suggestions.sort((a, b) => b.count - a.count || a.dayIndex - b.dayIndex).slice(0, limit);
}
