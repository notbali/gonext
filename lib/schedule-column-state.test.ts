import { describe, expect, it } from "vitest";
import { isColumnFullyAvailable, isDayMatchReady, MATCH_READY_THRESHOLD } from "./schedule-column-state";
import type { Teammate } from "./types";

function teammateWithStatuses(statuses: Teammate["week"][number]["status"][]): Teammate {
  return {
    id: "t",
    name: "t",
    avatarUrl: null,
    week: statuses.map((status) => ({ status })),
  };
}

describe("isColumnFullyAvailable", () => {
  it("is false when there are no teammates", () => {
    expect(isColumnFullyAvailable([], 0)).toBe(false);
  });

  it("is true when every teammate is available on that day", () => {
    const teammates = [
      teammateWithStatuses(["available", "tentative"]),
      teammateWithStatuses(["available", "unavailable"]),
    ];
    expect(isColumnFullyAvailable(teammates, 0)).toBe(true);
  });

  it("is false when any teammate is not available on that day", () => {
    const teammates = [
      teammateWithStatuses(["available", "tentative"]),
      teammateWithStatuses(["tentative", "available"]),
    ];
    expect(isColumnFullyAvailable(teammates, 0)).toBe(false);
  });

  it("is false when a teammate has no entry for that day", () => {
    const teammates = [teammateWithStatuses(["available"])];
    expect(isColumnFullyAvailable(teammates, 3)).toBe(false);
  });
});

function teammatesAvailable(count: number, total: number): Teammate[] {
  return Array.from({ length: total }, (_, i) =>
    teammateWithStatuses([i < count ? "available" : "unavailable"]),
  );
}

describe("isDayMatchReady", () => {
  it(`is true when exactly ${MATCH_READY_THRESHOLD} teammates are available`, () => {
    const teammates = teammatesAvailable(MATCH_READY_THRESHOLD, MATCH_READY_THRESHOLD + 2);
    expect(isDayMatchReady(teammates, 0)).toBe(true);
  });

  it(`is true when more than ${MATCH_READY_THRESHOLD} teammates are available`, () => {
    const teammates = teammatesAvailable(MATCH_READY_THRESHOLD + 2, MATCH_READY_THRESHOLD + 2);
    expect(isDayMatchReady(teammates, 0)).toBe(true);
  });

  it(`is false when fewer than ${MATCH_READY_THRESHOLD} teammates are available`, () => {
    const teammates = teammatesAvailable(MATCH_READY_THRESHOLD - 1, MATCH_READY_THRESHOLD + 2);
    expect(isDayMatchReady(teammates, 0)).toBe(false);
  });

  it("is false when there are no teammates", () => {
    expect(isDayMatchReady([], 0)).toBe(false);
  });

  it("respects a custom threshold", () => {
    const teammates = teammatesAvailable(2, 3);
    expect(isDayMatchReady(teammates, 0, 2)).toBe(true);
    expect(isDayMatchReady(teammates, 0, 3)).toBe(false);
  });
});
