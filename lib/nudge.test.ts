import { describe, expect, it } from "vitest";
import { easternPartsToUtc } from "./dates";
import { nudgeMessage, unsetForRestOfWeek } from "./nudge";
import type { AvailabilityStatus } from "./types";

// Mon Sep 21 – Sun Sep 27 2026.
const dates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 21 + i));
const thursdayNoon = easternPartsToUtc({ year: 2026, month: 8, day: 24, hours: 12, minutes: 0 });

function mate(id: string, statuses: AvailabilityStatus[], discordId: string | null = id) {
  return { id, name: id.toUpperCase(), discordId, week: statuses.map((status) => ({ status })) };
}

const set: AvailabilityStatus = "available";

describe("unsetForRestOfWeek", () => {
  it("lists teammates with a day not set from today through Sunday", () => {
    const sundayGap = mate("a", [set, set, set, set, set, set, "not-set"]);
    const allSet = mate("b", Array(7).fill(set));
    expect(unsetForRestOfWeek([sundayGap, allSet], dates, thursdayNoon).map((t) => t.id)).toEqual(["a"]);
  });

  it("counts today, by the Eastern calendar", () => {
    const thursdayGap = mate("a", [set, set, set, "not-set", set, set, set]);
    expect(unsetForRestOfWeek([thursdayGap], dates, thursdayNoon)).toHaveLength(1);
  });

  it("ignores gaps on days that have already passed", () => {
    const mondayGap = mate("a", ["not-set", set, set, set, set, set, set]);
    expect(unsetForRestOfWeek([mondayGap], dates, thursdayNoon)).toEqual([]);
  });

  it("treats every day as remaining when now is before the week", () => {
    const mondayGap = mate("a", ["not-set", set, set, set, set, set, set]);
    const sundayBefore = easternPartsToUtc({ year: 2026, month: 8, day: 20, hours: 20, minutes: 0 });
    expect(unsetForRestOfWeek([mondayGap], dates, sundayBefore)).toHaveLength(1);
  });

  it("finds nothing once the week is over", () => {
    const sundayGap = mate("a", [set, set, set, set, set, set, "not-set"]);
    const nextMonday = easternPartsToUtc({ year: 2026, month: 8, day: 28, hours: 9, minutes: 0 });
    expect(unsetForRestOfWeek([sundayGap], dates, nextMonday)).toEqual([]);
  });
});

describe("nudgeMessage", () => {
  it("@s each teammate by Discord id and links the schedule", () => {
    expect(nudgeMessage([mate("1", []), mate("2", [])], "https://gonext.example")).toBe(
      "<@1> <@2> — you've still got days not set this week. Fill them in: https://gonext.example/",
    );
  });

  it("falls back to a plain name for a teammate with no linked Discord account", () => {
    expect(nudgeMessage([mate("a", [], null)], "https://gonext.example")).toMatch(/^A — /);
  });
});
