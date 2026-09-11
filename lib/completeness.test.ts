import { describe, expect, it } from "vitest";
import { completenessOf } from "./completeness";
import type { Teammate } from "./types";

function teammateWithStatuses(statuses: Teammate["week"][number]["status"][]): Teammate {
  return { id: "t", name: "t", avatarUrl: null, week: statuses.map((status) => ({ status })) };
}

describe("completenessOf", () => {
  it("is 0 when every day is not-set", () => {
    expect(completenessOf(teammateWithStatuses(["not-set", "not-set"]))).toBe(0);
  });

  it("is 1 when every day has a real status", () => {
    expect(completenessOf(teammateWithStatuses(["available", "tentative", "unavailable"]))).toBe(1);
  });

  it("is the fraction of days that have a real status", () => {
    expect(completenessOf(teammateWithStatuses(["available", "not-set", "not-set", "available"]))).toBe(
      0.5,
    );
  });

  it("is 0 for a teammate with an empty week", () => {
    expect(completenessOf(teammateWithStatuses([]))).toBe(0);
  });
});
