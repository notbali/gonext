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

export function isSameDate(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function dayOfWeekLabel(date: Date): string {
  return DAY_LABELS[(date.getDay() + 6) % 7];
}

export function weekRangeLabel(weekDates: Date[]): string {
  const start = weekDates[0];
  const end = weekDates[6];
  const startLabel = `${MONTH_LABELS[start.getMonth()]} ${start.getDate()}`;
  const endLabel =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}`
      : `${MONTH_LABELS[end.getMonth()]} ${end.getDate()}`;
  return `Week of ${startLabel} — ${endLabel}`;
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
