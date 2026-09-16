import type { Teammate } from "./types";

/** Whether every teammate is marked "available" for the day at `dayIndex` in their `week`. */
export function isColumnFullyAvailable(teammates: Teammate[], dayIndex: number): boolean {
  if (teammates.length === 0) return false;
  return teammates.every((t) => t.week[dayIndex]?.status === "available");
}

/** Riot Premier windows realistically need a 5-stack; below this a day isn't worth scheduling. */
export const MATCH_READY_THRESHOLD = 5;

/** Whether at least `threshold` teammates are "available" for the day at `dayIndex`. */
export function isDayMatchReady(
  teammates: Teammate[],
  dayIndex: number,
  threshold: number = MATCH_READY_THRESHOLD,
): boolean {
  const availableCount = teammates.filter((t) => t.week[dayIndex]?.status === "available").length;
  return availableCount >= threshold;
}
