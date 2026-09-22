const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const MONTH_LABELS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

/**
 * This team is US-based and single-timezone; rather than build out general
 * i18n/timezone support we just pin all match-time display and "current
 * week" calculations to Eastern Time, regardless of the server's own clock
 * (Neon/hosting typically runs in UTC).
 */
export const TEAM_TIMEZONE = "America/New_York";

/** Eastern-local wall-clock fields for a given instant. */
export interface EasternParts {
  year: number;
  month: number; // 0-indexed, matches Date#getMonth()
  day: number;
  hours: number;
  minutes: number;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday, matches Date#getDay()
}

const EASTERN_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: TEAM_TIMEZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Reads `date`'s wall-clock day/hour/minute as observed in `TEAM_TIMEZONE`. */
export function getEasternParts(date: Date): EasternParts {
  const parts = EASTERN_FORMATTER.formatToParts(date);
  const lookup: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of parts) lookup[part.type] = part.value;

  return {
    year: Number(lookup.year),
    month: Number(lookup.month) - 1,
    day: Number(lookup.day),
    hours: Number(lookup.hour) % 24, // h23 can format midnight as "24"
    minutes: Number(lookup.minute),
    dayOfWeek: WEEKDAY_INDEX[lookup.weekday as string],
  };
}

/**
 * Inverse of `getEasternParts`: converts Eastern-local wall-clock fields
 * (e.g. entered by a coach into a date/time form, since match times are
 * always meant as the team's own Eastern time) into the real UTC instant
 * they represent. Resolves DST with a single correction pass against the
 * actual Eastern UTC offset for the target date.
 */
export function easternPartsToUtc(
  parts: Pick<EasternParts, "year" | "month" | "day" | "hours" | "minutes">,
): Date {
  const targetMillis = Date.UTC(parts.year, parts.month, parts.day, parts.hours, parts.minutes);
  const guessedAsEastern = getEasternParts(new Date(targetMillis));
  const guessedMillis = Date.UTC(
    guessedAsEastern.year,
    guessedAsEastern.month,
    guessedAsEastern.day,
    guessedAsEastern.hours,
    guessedAsEastern.minutes,
  );
  return new Date(targetMillis + (targetMillis - guessedMillis));
}

/**
 * The current instant, as a `Date` whose *local* getters (getFullYear,
 * getMonth, getDate, getDay, getHours, ...) report `TEAM_TIMEZONE`'s
 * wall-clock, regardless of the server process's own timezone. Intended for
 * feeding into date-math helpers below (`getWeekStart`, `getLookaheadDates`,
 * ...) that operate on local Date getters/setters.
 */
export function nowInTeamTimezone(): Date {
  const p = getEasternParts(new Date());
  return new Date(p.year, p.month, p.day, p.hours, p.minutes);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Monday of the real calendar week containing `today`. */
export function getWeekStart(today: Date): Date {
  const d = startOfDay(today);
  const isoDayOfWeek = (d.getDay() + 6) % 7; // 0 = Monday ... 6 = Sunday
  d.setDate(d.getDate() - isoDayOfWeek);
  return d;
}

/** The 7 dates (Monday–Sunday) of the real calendar week containing `today`. */
export function getWeekDates(today: Date): Date[] {
  const monday = getWeekStart(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** `date` shifted by `weeks` whole weeks (negative for earlier weeks). */
export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/**
 * Parses a `week` search-param value into a validated offset (in weeks) from
 * the current week. Invalid or non-integer input defaults to 0 (the current
 * week). The result is clamped so the schedule can never navigate before the
 * current week, nor further ahead than one `weekCount`-week page past it —
 * the same `weekCount`-week window already used for the lookahead range (see
 * `WEEKS_AHEAD` / `getLookaheadDates`).
 */
export function parseWeekOffset(raw: string | undefined, weekCount: number): number {
  const n = Number(raw);
  const parsed = Number.isInteger(n) ? n : 0;
  return Math.min(Math.max(parsed, 0), weekCount);
}

/**
 * Flat, chronological list of dates spanning `weekCount` consecutive calendar
 * weeks (Monday-Sunday each), starting with the week containing `weekReference`.
 */
export function getLookaheadDates(weekReference: Date, weekCount: number): Date[] {
  const start = getWeekStart(weekReference);
  return Array.from({ length: weekCount * 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Splits a flat per-day array back into consecutive 7-day (Monday-first) chunks. */
export function chunkIntoWeeks<T>(days: T[]): T[][] {
  const weeks: T[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function isSameDate(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Days since the epoch of `instant`'s Eastern calendar day — for whole-day differences. */
function teamDayNumber(instant: Date): number {
  const p = getEasternParts(instant);
  return Date.UTC(p.year, p.month, p.day) / 86_400_000;
}

/**
 * Whether a real instant (e.g. a Match's date) falls on `day`, a schedule day
 * whose local getters stand in for the Eastern wall clock (see
 * `nowInTeamTimezone`). Unlike `isSameDate`, this doesn't depend on the
 * server's own timezone — a 9PM ET match is already tomorrow in UTC.
 */
export function isOnTeamDay(instant: Date, day: Date): boolean {
  const p = getEasternParts(instant);
  return p.year === day.getFullYear() && p.month === day.getMonth() && p.day === day.getDate();
}

/** Minutes since Eastern midnight for a real instant. */
export function teamMinuteOfDay(instant: Date): number {
  const p = getEasternParts(instant);
  return p.hours * 60 + p.minutes;
}

export function dayOfWeekLabel(date: Date): string {
  return DAY_LABELS[(date.getDay() + 6) % 7];
}

export function weekRangeLabel(weekDates: Date[]): string {
  return `Week of ${dateRangeLabel(weekDates)}`;
}

/** Formats the first and last of `dates` as a span, e.g. "SEP 8 — 14" or "SEP 28 — OCT 11". */
export function dateRangeLabel(dates: Date[]): string {
  const start = dates[0];
  const end = dates[dates.length - 1];
  const startLabel = `${MONTH_LABELS[start.getMonth()]} ${start.getDate()}`;
  const endLabel =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}`
      : `${MONTH_LABELS[end.getMonth()]} ${end.getDate()}`;
  return `${startLabel} — ${endLabel}`;
}

/** `label` is the match's Map name, or "PLAYOFFS" — resolved by the caller, since this
 * module stays free of map/DB knowledge. */
export function matchDateLine(match: { date: Date }, label: string): string {
  const p = getEasternParts(match.date);
  const day = DAY_LABELS[(p.dayOfWeek + 6) % 7];
  const month = MONTH_LABELS[p.month];
  const hours12 = ((p.hours + 11) % 12) + 1;
  const meridiem = p.hours < 12 ? "AM" : "PM";
  const minutes = p.minutes.toString().padStart(2, "0");
  return `${day} ${month} ${p.day} · ${hours12}:${minutes} ${meridiem} ET · ${label}`;
}

/** Compact time for tight UI, e.g. "7P" or "7:30P" — in Eastern Time. */
export function shortTimeLabel(date: Date): string {
  const p = getEasternParts(date);
  const hours12 = ((p.hours + 11) % 12) + 1;
  const meridiem = p.hours < 12 ? "A" : "P";
  return p.minutes === 0 ? `${hours12}${meridiem}` : `${hours12}:${p.minutes.toString().padStart(2, "0")}${meridiem}`;
}

/** Whole minutes from `now` until `date` (negative once `date` is in the past). */
export function minutesUntil(date: Date, now: Date): number {
  return Math.round((date.getTime() - now.getTime()) / 60_000);
}

/** "TODAY" / "TOMORROW" / "IN N DAYS" within the displayed week, else "NEXT WEEK". */
export function countdownLabel(matchDate: Date, today: Date, weekDates: Date[]): string {
  const diffDays = teamDayNumber(matchDate) - teamDayNumber(today);

  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "TOMORROW";

  const withinDisplayedWeek = weekDates.some((d) => isOnTeamDay(matchDate, d));
  if (withinDisplayedWeek && diffDays > 0) return `IN ${diffDays} DAYS`;

  return "NEXT WEEK";
}
