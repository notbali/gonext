import { describe, expect, it } from "vitest";
import { chunkIntoWeeks, dateRangeLabel, getLookaheadDates } from "./dates";

describe("getLookaheadDates", () => {
  it("returns weekCount * 7 consecutive dates starting on the Monday of the reference week", () => {
    // Thu Sep 3 2026 falls in the week of Mon Aug 31 - Sun Sep 6.
    const reference = new Date(2026, 8, 3, 12);

    const dates = getLookaheadDates(reference, 3);

    expect(dates).toHaveLength(21);
    expect(dates[0].getDate()).toBe(31);
    expect(dates[0].getMonth()).toBe(7); // August
    expect(dates[20].getDate()).toBe(20);
    expect(dates[20].getMonth()).toBe(8); // September
    for (let i = 1; i < dates.length; i++) {
      const diffDays = (dates[i].getTime() - dates[i - 1].getTime()) / 86_400_000;
      expect(diffDays).toBe(1);
    }
  });

  it("starts with the current week when weekReference is today (offset 0)", () => {
    const today = new Date(2026, 8, 8, 9); // Tue Sep 8 2026

    const dates = getLookaheadDates(today, 1);

    expect(dates).toHaveLength(7);
    expect(dates[0].getDate()).toBe(7); // Monday Sep 7
  });
});

describe("chunkIntoWeeks", () => {
  it("splits a flat array into consecutive groups of 7", () => {
    const days = Array.from({ length: 14 }, (_, i) => i);

    const weeks = chunkIntoWeeks(days);

    expect(weeks).toEqual([
      [0, 1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12, 13],
    ]);
  });

  it("returns an empty array for an empty input", () => {
    expect(chunkIntoWeeks([])).toEqual([]);
  });
});

describe("dateRangeLabel", () => {
  it("collapses the end date to just a day number when both ends share a month", () => {
    const dates = [new Date(2026, 8, 1), new Date(2026, 8, 14)];

    expect(dateRangeLabel(dates)).toBe("SEP 1 — 14");
  });

  it("spells out the month on both ends when the range crosses a month boundary", () => {
    const dates = [new Date(2026, 8, 28), new Date(2026, 9, 11)];

    expect(dateRangeLabel(dates)).toBe("SEP 28 — OCT 11");
  });
});
