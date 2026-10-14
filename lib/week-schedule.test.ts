import { describe, expect, it } from "vitest";
import { mapForWeek, weeksToAssign } from "./week-schedule";
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

  it("uses Riot's stage schedule for a week a stage covers, with no WeekMap needed", () => {
    expect(mapForWeek([], new Date(2026, 10, 5))).toBe("SUNSET");
  });

  it("lets the stage schedule win over a stale WeekMap for the same week", () => {
    const weekMaps: WeekMapInfo[] = [{ weekStart: new Date(2026, 10, 2), map: "ASCENT" }];

    expect(mapForWeek(weekMaps, new Date(2026, 10, 5))).toBe("SUNSET");
  });
});

describe("weeksToAssign", () => {
  it("lists the lookahead weeks plus the rest of the stage, in order, without duplicates", () => {
    const weeks = weeksToAssign(new Date(2026, 9, 14), [], 2); // Oct 12 + Oct 19, then stage weeks to Nov 30

    expect(weeks.map((w) => `${w.weekDates[0].getMonth() + 1}/${w.weekDates[0].getDate()}`)).toEqual([
      "10/12", "10/19", "10/26", "11/2", "11/9", "11/16", "11/23", "11/30",
    ]);
    expect(weeks.every((w) => w.weekDates.length === 7)).toBe(true);
  });

  it("marks stage weeks with their number and map, and leaves other weeks to the coach", () => {
    const weekMaps: WeekMapInfo[] = [{ weekStart: new Date(2026, 9, 12), map: "PEARL" }];
    const [offStage, week1] = weeksToAssign(new Date(2026, 9, 14), weekMaps, 2);

    expect(offStage).toMatchObject({ map: "PEARL", stageWeek: null });
    expect(week1).toMatchObject({ map: "BIND", stageWeek: { stage: "V26A6", number: 1 } });
  });
});
