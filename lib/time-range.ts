/**
 * An Available day's optional time window, in minutes since the team-local
 * (Eastern) midnight of that day. `end` may exceed 1440 for a window that
 * runs past midnight (e.g. 8PM–1AM is { start: 1200, end: 1500 }).
 */
export interface TimeRange {
  start: number;
  end: number;
}

const DAY = 24 * 60;
const HALF_DAY = 12 * 60;

interface ClockTime {
  hours: number;
  minutes: number;
  meridiem: "am" | "pm" | null;
}

const TIME = String.raw`(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?`;
const RANGE_PATTERN = new RegExp(String.raw`^\s*${TIME}\s*(?:-|–|—|to)\s*${TIME}\s*$`, "i");

function toClockTime(hours: string, minutes: string | undefined, meridiem: string | undefined): ClockTime | null {
  const h = Number(hours);
  const m = minutes ? Number(minutes) : 0;
  const mer = meridiem ? (meridiem.toLowerCase() === "a" ? "am" : "pm") : null;
  if (m > 59) return null;
  if (mer ? h < 1 || h > 12 : h > 23) return null;
  return { hours: h, minutes: m, meridiem: mer };
}

/** Minutes since midnight for `t`, reading a missing meridiem as `fallback`. */
function toMinutes(t: ClockTime, fallback: "am" | "pm" | null): number {
  const meridiem = t.meridiem ?? fallback;
  if (!meridiem || t.hours > 12) return t.hours * 60 + t.minutes; // 24-hour clock
  const hours12 = t.hours % 12;
  return (meridiem === "pm" ? hours12 + 12 : hours12) * 60 + t.minutes;
}

/** Duration from `start` to `end`, wrapping past midnight. */
function span(start: number, end: number): number {
  return (end - start + DAY) % DAY;
}

/**
 * Reads a free-text window like "6pm-11pm", "6:30 PM to 11", "6-11pm" or
 * "18:00-23:00". A side with no AM/PM borrows the other side's, choosing the
 * shorter reading; with none on either side, 12-hour times are read as PM
 * since the team plays evenings. Returns null when it can't be read.
 */
export function parseTimeRange(text: string): TimeRange | null {
  const match = RANGE_PATTERN.exec(text);
  if (!match) return null;

  const a = toClockTime(match[1], match[2], match[3]);
  const b = toClockTime(match[4], match[5], match[6]);
  if (!a || !b) return null;

  const is24h = a.hours > 12 || b.hours > 12 || (a.hours === 0 && !a.meridiem) || (b.hours === 0 && !b.meridiem);
  let start: number;
  let end: number;
  if (a.meridiem || b.meridiem || is24h) {
    end = toMinutes(b, is24h ? null : a.meridiem);
    const candidates = a.meridiem || is24h ? [toMinutes(a, null)] : [toMinutes(a, "am"), toMinutes(a, "pm")];
    start = candidates.reduce((best, c) => (span(c, end) > 0 && span(c, end) < span(best, end) ? c : best));
  } else {
    start = toMinutes(a, "pm");
    end = toMinutes(b, "pm");
  }

  if (start === end) return null;
  return { start, end: end < start ? end + DAY : end };
}

function formatClock(minutes: number): string {
  const m = minutes % DAY;
  const hours12 = Math.floor(m / 60) % 12 || 12;
  const mins = m % 60;
  const meridiem = m < HALF_DAY ? "AM" : "PM";
  return mins === 0 ? `${hours12}${meridiem}` : `${hours12}:${mins.toString().padStart(2, "0")}${meridiem}`;
}

/** Canonical display form, e.g. "6PM–11PM" or "6:30PM–1AM". */
export function formatTimeRange(range: TimeRange): string {
  return `${formatClock(range.start)}–${formatClock(range.end)}`;
}

/**
 * Validates a range entered by a teammate and returns its canonical form, or
 * null for a blank one (meaning all day). Throws a user-facing error for text
 * that can't be read, so a Confirmed check never has to guess at it.
 */
export function normalizeTimeRange(text: string | null): string | null {
  if (!text || !text.trim()) return null;
  const range = parseTimeRange(text);
  if (!range) {
    throw new Error(`Couldn't read the time range "${text.trim()}" — try something like 6PM–11PM.`);
  }
  return formatTimeRange(range);
}

/** Whether `minuteOfDay` falls within `range` (start inclusive, end exclusive). */
export function rangeCoversMinute(range: TimeRange, minuteOfDay: number): boolean {
  return minuteOfDay >= range.start && minuteOfDay < range.end;
}
