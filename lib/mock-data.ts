import type { AvailabilityStatus, DayAvailability, Match, Teammate } from "./types";
import { isSameDate } from "./dates";

function day(status: AvailabilityStatus, timeRange?: string): DayAvailability {
  return timeRange ? { status, timeRange } : { status };
}

const available = (timeRange?: string) => day("available", timeRange);
const tentative = () => day("tentative");
const unavailable = () => day("unavailable");
const notSet = () => day("not-set");

export const TEAM_NAME = "GO//NEXT";
export const TEAM_DIVISION = "DIV 2 · GROUP C";
export const CURRENT_USER_INITIALS = "MB";

/** Monday-first per-day availability for the current displayed week. */
export const TEAMMATES: Teammate[] = [
  {
    id: "raize",
    name: "raize",
    initials: "RZ",
    week: [available(), available(), available("6P–11P"), available("6P–11P"), tentative(), unavailable(), notSet()],
  },
  {
    id: "kiko",
    name: "kiko",
    initials: "KK",
    week: [available(), available("6P–11P"), available(), available("6P–11P"), available(), tentative(), unavailable()],
  },
  {
    id: "vex",
    name: "vex",
    initials: "VX",
    week: [tentative(), available(), unavailable(), tentative(), available("6P–11P"), available(), notSet()],
  },
  {
    id: "night",
    name: "night",
    initials: "NT",
    week: [unavailable(), tentative(), available(), available("6P–11P"), tentative(), unavailable(), available()],
  },
  {
    id: "ember",
    name: "ember",
    initials: "EM",
    week: [available(), available(), available(), available("6P–11P"), available(), available(), tentative()],
  },
  {
    id: "coach-mint",
    name: "coach mint",
    initials: "CM",
    week: [notSet(), notSet(), tentative(), available("6P–11P"), notSet(), notSet(), notSet()],
  },
];

/** Builds this week's and next week's Premier matches against the displayed week's real dates. */
export function getMatches(weekDates: Date[]): Match[] {
  const thisWeekMatch = new Date(weekDates[3]); // Thursday of the displayed week
  thisWeekMatch.setHours(19, 0, 0, 0);

  const nextWeekMatch = new Date(weekDates[1]);
  nextWeekMatch.setDate(nextWeekMatch.getDate() + 7); // Tuesday of the following week
  nextWeekMatch.setHours(20, 0, 0, 0);

  return [
    {
      id: "blackout-five",
      opponent: "Blackout Five",
      date: thisWeekMatch,
      group: "GROUP C",
      availabilityCollected: true,
    },
    {
      id: "null-sector",
      opponent: "Null Sector",
      date: nextWeekMatch,
      group: "GROUP C",
      availabilityCollected: false,
    },
  ];
}

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
