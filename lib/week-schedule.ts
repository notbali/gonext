import { chunkIntoWeeks, getLookaheadDates, getWeekDates, getWeekStart, isSameDate } from "./dates";
import { stageWeekFor, upcomingStageWeeks } from "./premier-stages";
import type { WeekMapInfo } from "./types";

/**
 * The map Riot assigned to the calendar week containing `date`, or null if none is set yet.
 * A Premier Stage's schedule wins; a coach-set WeekMap only fills weeks no Stage covers.
 */
export function mapForWeek(weekMaps: WeekMapInfo[], date: Date): string | null {
  const stageWeek = stageWeekFor(date);
  if (stageWeek) return stageWeek.map;
  const weekStart = getWeekStart(date);
  return weekMaps.find((w) => isSameDate(w.weekStart, weekStart))?.map ?? null;
}

export interface WeekToAssign {
  weekDates: Date[];
  map: string | null;
  /** Set when a Premier Stage already assigns this week's map, so it isn't the coach's to pick. */
  stageWeek: { stage: string; number: number } | null;
}

/**
 * The weeks a coach sees in the weekly-maps list: the next `weekCount` weeks from `today`,
 * plus every remaining week of the current/next Stage so the whole stage shows at once.
 */
export function weeksToAssign(today: Date, weekMaps: WeekMapInfo[], weekCount: number): WeekToAssign[] {
  const lookahead = chunkIntoWeeks(getLookaheadDates(today, weekCount));
  const stageWeeks = upcomingStageWeeks(today).map((w) => getWeekDates(w.weekStart));
  const seen = new Set<number>();

  return [...lookahead, ...stageWeeks]
    .filter((weekDates) => {
      const key = weekDates[0].getTime();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a[0].getTime() - b[0].getTime())
    .map((weekDates) => {
      const stageWeek = stageWeekFor(weekDates[0]);
      return {
        weekDates,
        map: mapForWeek(weekMaps, weekDates[0]),
        stageWeek: stageWeek ? { stage: stageWeek.stage, number: stageWeek.number } : null,
      };
    });
}
