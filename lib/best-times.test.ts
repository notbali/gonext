import { describe, expect, it } from "vitest";
import { suggestMatchTimes } from "./best-times";
import type { DayAvailability, Teammate } from "./types";

// Mon Sep 21 – Sun Sep 27 2026.
const dates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 21 + i));
const today = new Date(2026, 8, 21);

function mate(id: string, days: Record<number, DayAvailability>): Teammate {
  return { id, name: id, avatarUrl: null, week: dates.map((_, i) => days[i] ?? { status: "not-set" }) };
}

const allDay = { status: "available" } as const;
const range = (timeRange: string) => ({ status: "available" as const, timeRange });

describe("suggestMatchTimes", () => {
  it("finds each day's window where the most teammates are available", () => {
    const team = [
      mate("a", { 2: allDay }),
      mate("b", { 2: range("7PM–11PM") }),
      mate("c", { 2: range("8PM–10PM") }),
    ];
    const [best] = suggestMatchTimes(team, dates, today);

    expect(best).toMatchObject({ dayIndex: 2, startHour: 20, endHour: 22, count: 3 });
    expect(best.label).toBe("WED SEP 23 · 8PM–10PM");
  });

  it("ranks days by how many are available, then by date", () => {
    const team = [
      mate("a", { 1: allDay, 3: allDay, 4: allDay }),
      mate("b", { 3: allDay, 4: allDay }),
      mate("c", { 4: allDay }),
    ];
    expect(suggestMatchTimes(team, dates, today).map((s) => s.dayIndex)).toEqual([4, 3, 1]);
  });

  it("marks a window ready once five can play", () => {
    const five = ["a", "b", "c", "d", "e"].map((id) => mate(id, { 5: allDay }));
    const [best] = suggestMatchTimes(five, dates, today);
    expect(best.ready).toBe(true);
    expect(suggestMatchTimes(five.slice(0, 4), dates, today)[0].ready).toBe(false);
  });

  it("only considers evening start times (noon to 11PM ET)", () => {
    const [best] = suggestMatchTimes([mate("a", { 2: range("6AM–10AM") }), mate("b", { 2: range("7PM–9PM") })], dates, today);
    expect(best).toMatchObject({ startHour: 19, endHour: 21, count: 1 });
  });

  it("skips days before today", () => {
    const team = [mate("a", { 0: allDay, 1: allDay, 6: allDay })];
    expect(suggestMatchTimes(team, dates, new Date(2026, 8, 23)).map((s) => s.dayIndex)).toEqual([6]);
  });

  it("returns at most `limit` suggestions and leaves out days nobody can play", () => {
    const team = [mate("a", { 1: allDay, 2: allDay, 3: allDay, 4: allDay })];
    expect(suggestMatchTimes(team, dates, today, 2)).toHaveLength(2);
    expect(suggestMatchTimes([mate("a", {})], dates, today)).toEqual([]);
  });
});
