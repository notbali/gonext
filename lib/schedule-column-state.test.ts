import { describe, expect, it } from "vitest";
import { isColumnFullyAvailable } from "./schedule-column-state";
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
