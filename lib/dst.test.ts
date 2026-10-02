import { describe, expect, it } from "vitest";
import {
  countdownLabel,
  easternPartsToUtc,
  getEasternParts,
  getLookaheadDates,
  matchDateLine,
  teamMinuteOfDay,
} from "./dates";
import { getConfirmedTeammates } from "./matches";
import { buildDuePings, type PingTeammate } from "./bot-pings";
import type { Match } from "./types";

// US Eastern falls back from EDT (UTC-4) to EST (UTC-5) at 2AM on Sun Nov 1 2026.
// Everything here is pinned to Eastern wall-clock time, so none of it may shift an hour.

const et = (month: number, day: number, hours: number, minutes = 0) =>
  easternPartsToUtc({ year: 2026, month, day, hours, minutes });
const OCT = 9;
const NOV = 10;

describe("Eastern time across the Nov 1 2026 fall-back", () => {
  it("converts evening times on either side of the change with the right offset", () => {
    expect(et(OCT, 31, 19).toISOString()).toBe("2026-10-31T23:00:00.000Z"); // EDT
    expect(et(NOV, 1, 19).toISOString()).toBe("2026-11-02T00:00:00.000Z"); // EST
    expect(et(NOV, 2, 19).toISOString()).toBe("2026-11-03T00:00:00.000Z");
  });

  it("reads a post-change instant back as the same Eastern wall clock", () => {
    const p = getEasternParts(new Date("2026-11-02T00:00:00.000Z"));
    expect({ day: p.day, hours: p.hours, dayOfWeek: p.dayOfWeek }).toEqual({ day: 1, hours: 19, dayOfWeek: 0 });
    expect(teamMinuteOfDay(et(NOV, 1, 20))).toBe(20 * 60);
  });

  it("labels a Nov 1 match at its Eastern time", () => {
    expect(matchDateLine({ date: et(NOV, 1, 20) }, "ASCENT")).toBe("SUN NOV 1 · 8:00 PM ET · ASCENT");
  });

  it("counts a Sunday-night match as tomorrow from Saturday, across the change", () => {
    const week = getLookaheadDates(new Date(2026, OCT, 26), 1);
    expect(countdownLabel(et(NOV, 1, 20), et(OCT, 31, 12), week)).toBe("TOMORROW");
    expect(countdownLabel(et(NOV, 1, 20), et(NOV, 1, 9), week)).toBe("TODAY");
  });

  it("keeps the change week as seven distinct calendar days", () => {
    const days = getLookaheadDates(new Date(2026, OCT, 28), 1).map((d) => `${d.getMonth()}/${d.getDate()}`);
    expect(days).toEqual(["9/26", "9/27", "9/28", "9/29", "9/30", "9/31", "10/1"]);
  });
});

describe("matches and pings across the Nov 1 2026 fall-back", () => {
  // Mon Oct 26 – Sun Nov 8; Nov 1 is index 6.
  const dates = getLookaheadDates(new Date(2026, OCT, 26), 2);
  const SUNDAY_NOV_1 = 6;
  const match: Match = { id: "m1", date: et(NOV, 1, 20), isPlayoffs: false, map: "ASCENT", availabilityCollected: true };

  const mate = (n: number, timeRange?: string): PingTeammate => ({
    id: `t${n}`,
    name: `Player${n}`,
    discordId: `${100 + n}`,
    week: dates.map((_, i) => (i === SUNDAY_NOV_1 ? { status: "available", timeRange } : { status: "available" })),
  });

  it("confirms a teammate whose Eastern range covers the 8PM match, and not one who leaves at 8PM", () => {
    const confirmed = getConfirmedTeammates(match, [mate(1, "7PM–11PM"), mate(2, "5PM–8PM")], dates);
    expect(confirmed.map((t) => t.id)).toEqual(["t1"]);
  });

  const pingsAt = (now: Date) =>
    buildDuePings({ now, dates, teammates: [mate(1)], matches: [match], siteUrl: "https://gonext.example" }).map(
      (p) => p.key,
    );

  it("opens the match-day ping at noon EST, not an hour early", () => {
    expect(pingsAt(new Date("2026-11-01T16:30:00.000Z"))).not.toContain("match-day:m1"); // 11:30AM EST
    expect(pingsAt(new Date("2026-11-01T17:00:00.000Z"))).toContain("match-day:m1"); // noon EST
  });

  it("sends the 30-minute warning 30 minutes before the EST start", () => {
    expect(pingsAt(new Date("2026-11-02T00:20:00.000Z"))).not.toContain("match-soon:m1"); // 7:20PM EST
    expect(pingsAt(new Date("2026-11-02T00:30:00.000Z"))).toContain("match-soon:m1"); // 7:30PM EST
  });
});
