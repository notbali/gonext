import { describe, expect, it, vi } from "vitest";
import {
  chunkIntoWeeks,
  dateRangeLabel,
  easternPartsToUtc,
  getEasternParts,
  getLookaheadDates,
  matchDateLine,
  minutesUntil,
  nowInTeamTimezone,
  parseWeekOffset,
  shortTimeLabel,
} from "./dates";

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

describe("minutesUntil", () => {
  const now = new Date(2026, 8, 8, 18, 0, 0);

  it("returns whole minutes remaining until a future date", () => {
    expect(minutesUntil(new Date(2026, 8, 8, 18, 45, 0), now)).toBe(45);
  });

  it("returns 0 for the exact same instant", () => {
    expect(minutesUntil(now, now)).toBe(0);
  });

  it("returns a negative number for a date already in the past", () => {
    expect(minutesUntil(new Date(2026, 8, 8, 17, 0, 0), now)).toBe(-60);
  });
});

describe("parseWeekOffset", () => {
  const weekCount = 4;

  it("passes through a valid in-range offset unchanged", () => {
    expect(parseWeekOffset("2", weekCount)).toBe(2);
  });

  it("defaults to 0 for undefined", () => {
    expect(parseWeekOffset(undefined, weekCount)).toBe(0);
  });

  it("defaults to 0 for non-numeric garbage", () => {
    expect(parseWeekOffset("banana", weekCount)).toBe(0);
  });

  it("defaults to 0 for a non-integer value", () => {
    expect(parseWeekOffset("2.5", weekCount)).toBe(0);
  });

  it("clamps a very large positive offset down to weekCount", () => {
    expect(parseWeekOffset("999999", weekCount)).toBe(weekCount);
  });

  it("clamps a very large negative offset up to 0", () => {
    expect(parseWeekOffset("-999999", weekCount)).toBe(0);
  });

  it("allows exactly weekCount weeks ahead but no further", () => {
    expect(parseWeekOffset(String(weekCount), weekCount)).toBe(weekCount);
    expect(parseWeekOffset(String(weekCount + 1), weekCount)).toBe(weekCount);
  });

  it("never returns a negative offset", () => {
    expect(parseWeekOffset("-1", weekCount)).toBe(0);
  });
});

describe("getEasternParts", () => {
  it("reads Eastern-local day/hour/minute parts from a UTC instant", () => {
    // 8pm UTC on Sep 8 2026 is 4pm Eastern (EDT, UTC-4) the same day.
    const parts = getEasternParts(new Date("2026-09-08T20:00:00Z"));

    expect(parts).toEqual({
      year: 2026,
      month: 8, // September (0-indexed)
      day: 8,
      hours: 16,
      minutes: 0,
      dayOfWeek: 2, // Tuesday
    });
  });

  it("shows the previous Eastern-local day for a UTC instant just after midnight (the old bug)", () => {
    // 2:30am UTC on Jan 15 2026 is 9:30pm Eastern (EST, UTC-5) on Jan 14 —
    // a naive server-local read (UTC) would wrongly report Jan 15/Thursday.
    const parts = getEasternParts(new Date("2026-01-15T02:30:00Z"));

    expect(parts).toEqual({
      year: 2026,
      month: 0, // January
      day: 14,
      hours: 21,
      minutes: 30,
      dayOfWeek: 3, // Wednesday
    });
  });
});

describe("easternPartsToUtc", () => {
  it("converts Eastern wall-clock fields entered by a coach (EST, winter) into the correct UTC instant", () => {
    // A coach types "9:30 PM" meaning Eastern time, on Jan 14 2026 (EST, UTC-5).
    const result = easternPartsToUtc({ year: 2026, month: 0, day: 14, hours: 21, minutes: 30 });

    expect(result.toISOString()).toBe("2026-01-15T02:30:00.000Z");
  });

  it("converts Eastern wall-clock fields entered by a coach (EDT, summer) into the correct UTC instant", () => {
    // A coach types "7:00 PM" meaning Eastern time, on Sep 14 2026 (EDT, UTC-4).
    const result = easternPartsToUtc({ year: 2026, month: 8, day: 14, hours: 19, minutes: 0 });

    expect(result.toISOString()).toBe("2026-09-14T23:00:00.000Z");
  });

  it("round-trips with getEasternParts", () => {
    const parts = { year: 2026, month: 8, day: 14, hours: 19, minutes: 0 };
    const utc = easternPartsToUtc(parts);

    expect(getEasternParts(utc)).toMatchObject(parts);
  });
});

describe("nowInTeamTimezone", () => {
  it("returns a Date whose local getters reflect Eastern time for the current instant, regardless of the runner's local TZ", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T02:30:00Z"));

    try {
      const result = nowInTeamTimezone();

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(14);
      expect(result.getHours()).toBe(21);
      expect(result.getMinutes()).toBe(30);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("matchDateLine", () => {
  it("labels the match using Eastern time, not the raw UTC/server-local instant", () => {
    // Same boundary instant as above: 2:30am UTC Jan 15 is 9:30pm Eastern Jan 14.
    const line = matchDateLine({ date: new Date("2026-01-15T02:30:00Z"), group: "Group A" });

    expect(line).toBe("WED JAN 14 · 9:30 PM ET · Group A");
  });
});

describe("shortTimeLabel", () => {
  it("formats a UTC instant near a day boundary using its Eastern-local time", () => {
    expect(shortTimeLabel(new Date("2026-01-15T02:30:00Z"))).toBe("9:30P");
  });

  it("omits minutes on the hour", () => {
    // 8pm UTC on Sep 8 2026 is 4pm Eastern (EDT).
    expect(shortTimeLabel(new Date("2026-09-08T20:00:00Z"))).toBe("4P");
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
