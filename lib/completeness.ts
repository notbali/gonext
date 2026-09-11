import type { Teammate } from "./types";

/** Fraction (0-1) of `teammate`'s week that has a real status set, i.e. isn't "not-set". */
export function completenessOf(teammate: Teammate): number {
  if (teammate.week.length === 0) return 0;
  const set = teammate.week.filter((d) => d.status !== "not-set").length;
  return set / teammate.week.length;
}
