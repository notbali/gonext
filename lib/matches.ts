import type { Match, Teammate } from "./types";
import { isSameDate } from "./dates";

/** A teammate counts as confirmed when they're Available on the match's date. */
export function getConfirmedTeammates(
  match: Match,
  teammates: Teammate[],
  weekDates: Date[],
): Teammate[] {
  const dayIndex = weekDates.findIndex((d) => isSameDate(d, match.date));
  if (dayIndex === -1) return [];
  return teammates.filter((t) => t.week[dayIndex]?.status === "available");
}
