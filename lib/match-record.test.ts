import { describe, expect, it } from "vitest";
import { summarizeRecord } from "./match-record";

const m = (map: string | null, result: "WIN" | "LOSS" | null, isPlayoffs = false) => ({ map, result, isPlayoffs });

describe("summarizeRecord", () => {
  it("counts wins and losses, ignoring matches with no result yet", () => {
    const record = summarizeRecord([m("ASCENT", "WIN"), m("ASCENT", "LOSS"), m("BIND", "WIN"), m("BIND", null)]);
    expect(record.wins).toBe(2);
    expect(record.losses).toBe(1);
  });

  it("breaks the record down by map, most-played first, then alphabetically", () => {
    const record = summarizeRecord([
      m("BIND", "WIN"),
      m("ASCENT", "WIN"),
      m("LOTUS", "LOSS"),
      m("LOTUS", "WIN"),
    ]);
    expect(record.byMap).toEqual([
      { map: "LOTUS", wins: 1, losses: 1 },
      { map: "ASCENT", wins: 1, losses: 0 },
      { map: "BIND", wins: 1, losses: 0 },
    ]);
  });

  it("files Playoffs under PLAYOFFS rather than a map", () => {
    const record = summarizeRecord([m(null, "WIN", true)]);
    expect(record.byMap).toEqual([{ map: "PLAYOFFS", wins: 1, losses: 0 }]);
  });

  it("files a regular match with no week map under MAP TBD", () => {
    expect(summarizeRecord([m(null, "LOSS")]).byMap).toEqual([{ map: "MAP TBD", wins: 0, losses: 1 }]);
  });

  it("is empty with no results", () => {
    expect(summarizeRecord([m("ASCENT", null)])).toEqual({ wins: 0, losses: 0, byMap: [] });
  });
});
