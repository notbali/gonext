import { describe, expect, it } from "vitest";
import { getFaviconSignals } from "./favicon-data";
import type { Match, Teammate } from "./types";

function teammate(id: string, statuses: Teammate["week"][number]["status"][]): Teammate {
  return { id, name: id, avatarUrl: null, week: statuses.map((status) => ({ status })) };
}

function match(id: string, date: Date): Match {
  return { id, date, group: "Group C", availabilityCollected: true };
}

describe("getFaviconSignals", () => {
  it("reports hasUnsetDays true when the viewer's own week has a not-set day", () => {
    const schedule = { teammates: [teammate("me", ["available", "not-set"])], matches: [] };
    expect(getFaviconSignals(schedule, "me").hasUnsetDays).toBe(true);
  });

  it("reports hasUnsetDays false when the viewer's week is fully set", () => {
    const schedule = { teammates: [teammate("me", ["available", "unavailable"])], matches: [] };
    expect(getFaviconSignals(schedule, "me").hasUnsetDays).toBe(false);
  });

  it("reports hasUnsetDays false when the viewer isn't in the teammate list", () => {
    const schedule = { teammates: [teammate("other", ["not-set"])], matches: [] };
    expect(getFaviconSignals(schedule, "me").hasUnsetDays).toBe(false);
  });

  it("reports the nearest upcoming match's date", () => {
    const soon = new Date(2026, 8, 10);
    const schedule = { teammates: [], matches: [match("m1", soon), match("m2", new Date(2026, 8, 17))] };
    expect(getFaviconSignals(schedule, "me").nearestMatchDate).toEqual(soon);
  });

  it("reports null when there are no upcoming matches", () => {
    const schedule = { teammates: [], matches: [] };
    expect(getFaviconSignals(schedule, "me").nearestMatchDate).toBeNull();
  });
});
