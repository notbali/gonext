import { describe, expect, it } from "vitest";
import { mapForWeek } from "./week-schedule";
import type { WeekMapInfo } from "./types";

describe("mapForWeek", () => {
  it("returns the map for the week containing the given date", () => {
    const weekMaps: WeekMapInfo[] = [
      { weekStart: new Date(2026, 8, 7), map: "ASCENT" }, // Mon Sep 7
      { weekStart: new Date(2026, 8, 14), map: "BIND" }, // Mon Sep 14
    ];

    // Wednesday within the second week.
    expect(mapForWeek(weekMaps, new Date(2026, 8, 16))).toBe("BIND");
  });

  it("returns null when no WeekMap is set for that week", () => {
    const weekMaps: WeekMapInfo[] = [{ weekStart: new Date(2026, 8, 7), map: "ASCENT" }];

    expect(mapForWeek(weekMaps, new Date(2026, 8, 21))).toBeNull();
  });

  it("returns null for an empty weekMaps list", () => {
    expect(mapForWeek([], new Date(2026, 8, 7))).toBeNull();
  });
});
