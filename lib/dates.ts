const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const MONTH_LABELS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

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

export function matchDateLine(match: { date: Date; group: string }): string {
  const d = match.date;
  const day = DAY_LABELS[(d.getDay() + 6) % 7];
  const month = MONTH_LABELS[d.getMonth()];
  const hours24 = d.getHours();
  const hours12 = ((hours24 + 11) % 12) + 1;
  const meridiem = hours24 < 12 ? "AM" : "PM";
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${d.getDate()} · ${hours12}:${minutes} ${meridiem} ET · ${match.group}`;
}

/** Compact time for tight UI, e.g. "7P" or "7:30P". */
export function shortTimeLabel(date: Date): string {
  const hours24 = date.getHours();
  const hours12 = ((hours24 + 11) % 12) + 1;
  const meridiem = hours24 < 12 ? "A" : "P";
  const minutes = date.getMinutes();
  return minutes === 0 ? `${hours12}${meridiem}` : `${hours12}:${minutes.toString().padStart(2, "0")}${meridiem}`;
}

/** Whole minutes from `now` until `date` (negative once `date` is in the past). */
export function minutesUntil(date: Date, now: Date): number {
  return Math.round((date.getTime() - now.getTime()) / 60_000);
}

/** "TODAY" / "TOMORROW" / "IN N DAYS" within the displayed week, else "NEXT WEEK". */
export function countdownLabel(matchDate: Date, today: Date, weekDates: Date[]): string {
  const diffDays = Math.round(
    (startOfDay(matchDate).getTime() - startOfDay(today).getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "TOMORROW";

  const withinDisplayedWeek = weekDates.some((d) => isSameDate(d, matchDate));
  if (withinDisplayedWeek && diffDays > 0) return `IN ${diffDays} DAYS`;

  return "NEXT WEEK";
}
