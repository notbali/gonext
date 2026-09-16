import { getWeekStart, isSameDate } from "./dates";
import type { WeekMapInfo } from "./types";

/** The map Riot assigned to the calendar week containing `date`, or null if none is set yet. */
export function mapForWeek(weekMaps: WeekMapInfo[], date: Date): string | null {
  const weekStart = getWeekStart(date);
  return weekMaps.find((w) => isSameDate(w.weekStart, weekStart))?.map ?? null;
}
