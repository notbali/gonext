import type { Teammate } from "./types";

/** Whether every teammate is marked "available" for the day at `dayIndex` in their `week`. */
export function isColumnFullyAvailable(teammates: Teammate[], dayIndex: number): boolean {
  if (teammates.length === 0) return false;
  return teammates.every((t) => t.week[dayIndex]?.status === "available");
}
