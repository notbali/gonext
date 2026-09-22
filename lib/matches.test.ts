import { describe, expect, it } from "vitest";
import { getConfirmedTeammates } from "./matches";
import { easternPartsToUtc } from "./dates";
import type { DayAvailability, Match, Teammate } from "./types";

// Mon Sep 21 – Sun Sep 27 2026, as the schedule builds them: local-midnight Dates
// whose local getters stand in for Eastern wall-clock days.
const weekDates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 21 + i));
const TUESDAY = 1;

function teammate(id: string, tuesday: DayAvailability): Teammate {
  return {
    id,
    name: id,
    avatarUrl: null,
    week: weekDates.map((_, i) => (i === TUESDAY ? tuesday : { status: "not-set" })),
  };
}

/** A match at `hours:minutes` Eastern on Tuesday Sep 22. */
function tuesdayMatch(hours: number, minutes = 0): Match {
  return {
    id: "m1",
    date: easternPartsToUtc({ year: 2026, month: 8, day: 22, hours, minutes }),
    isPlayoffs: false,
    map: "ASCENT",
    availabilityCollected: true,
  };
}

const ids = (ts: Teammate[]) => ts.map((t) => t.id);

describe("getConfirmedTeammates", () => {
  it("confirms an Available teammate with no time range (all day)", () => {
    const team = [teammate("a", { status: "available" })];
    expect(ids(getConfirmedTeammates(tuesdayMatch(19), team, weekDates))).toEqual(["a"]);
  });

  it("does not confirm Tentative, Unavailable, or Not set teammates", () => {
    const team = [
      teammate("t", { status: "tentative" }),
      teammate("u", { status: "unavailable" }),
      teammate("n", { status: "not-set" }),
    ];
    expect(getConfirmedTeammates(tuesdayMatch(19), team, weekDates)).toEqual([]);
  });

  it("confirms a teammate whose time range covers the match's start", () => {
    const team = [teammate("a", { status: "available", timeRange: "6PM–11PM" })];
    expect(ids(getConfirmedTeammates(tuesdayMatch(19), team, weekDates))).toEqual(["a"]);
  });

  it("does not confirm a teammate whose time range ends before the match starts", () => {
    const team = [teammate("a", { status: "available", timeRange: "6PM–8PM" })];
    expect(getConfirmedTeammates(tuesdayMatch(21), team, weekDates)).toEqual([]);
  });

  it("does not confirm a teammate whose time range starts after the match starts", () => {
    const team = [teammate("a", { status: "available", timeRange: "9PM–11PM" })];
    expect(getConfirmedTeammates(tuesdayMatch(20), team, weekDates)).toEqual([]);
  });

  it("gives a legacy free-text range it can't read the benefit of the doubt", () => {
    const team = [teammate("a", { status: "available", timeRange: "after work" })];
    expect(ids(getConfirmedTeammates(tuesdayMatch(21), team, weekDates))).toEqual(["a"]);
  });

  it("reads a late-evening Eastern match on its Eastern day, even when that's already tomorrow in UTC", () => {
    // 9PM EDT Tuesday is 1AM UTC Wednesday — the server (Vercel) runs in UTC.
    const team = [teammate("a", { status: "available" })];
    expect(ids(getConfirmedTeammates(tuesdayMatch(21), team, weekDates))).toEqual(["a"]);
  });

  it("returns nobody for a match outside the given dates", () => {
    const team = [teammate("a", { status: "available" })];
    const outside = { ...tuesdayMatch(19), date: easternPartsToUtc({ year: 2026, month: 9, day: 6, hours: 19, minutes: 0 }) };
    expect(getConfirmedTeammates(outside, team, weekDates)).toEqual([]);
  });
});
