import { describe, expect, it } from "vitest";
import { buildDuePings, type PingTeammate } from "./bot-pings";
import { easternPartsToUtc } from "./dates";
import type { DayAvailability, Match } from "./types";

// Two schedule weeks: Mon Sep 21 – Sun Oct 4 2026.
const dates = Array.from({ length: 14 }, (_, i) => new Date(2026, 8, 21 + i));
const TUESDAY = 1;
const SITE = "https://gonext.example";

const et = (day: number, hours: number, minutes = 0) =>
  easternPartsToUtc({ year: 2026, month: 8, day, hours, minutes });

function mate(n: number, tuesday: DayAvailability, rest: DayAvailability = { status: "available" }): PingTeammate {
  return {
    id: `t${n}`,
    name: `Player${n}`,
    discordId: `${100 + n}`,
    week: dates.map((_, i) => (i === TUESDAY ? tuesday : rest)),
  };
}

const tuesdayMatch: Match = {
  id: "m1",
  date: et(22, 20), // Tue Sep 22, 8PM ET
  isPlayoffs: false,
  map: "ASCENT",
  availabilityCollected: true,
};

const available = { status: "available" } as const;

function pingsAt(now: Date, teammates: PingTeammate[], matches: Match[] = [tuesdayMatch]) {
  return buildDuePings({ now, dates, teammates, matches, siteUrl: SITE });
}

describe("buildDuePings — match day", () => {
  it("posts nothing before the match-day window opens", () => {
    expect(pingsAt(et(22, 11), [mate(1, available)])).toEqual([]);
  });

  it("opens the match-day ping at noon ET, keyed to the match", () => {
    const [ping] = pingsAt(et(22, 12), [mate(1, available)]);
    expect(ping.key).toBe("match-day:m1");
  });

  it("opens earlier for a match that starts early, 4 hours before it", () => {
    const morning = { ...tuesdayMatch, date: et(22, 13) };
    expect(pingsAt(et(22, 9, 30), [mate(1, available)], [morning]).map((p) => p.key)).toEqual(["match-day:m1"]);
  });

  it("@s confirmed teammates, and flags how many more are needed below five", () => {
    const team = [
      mate(1, available),
      mate(2, { status: "available", timeRange: "6PM–11PM" }),
      mate(3, { status: "available", timeRange: "5PM–7PM" }), // gone before 8PM
      mate(4, { status: "tentative" }),
      mate(5, { status: "not-set" }),
      mate(6, { status: "unavailable" }),
    ];
    const [ping] = pingsAt(et(22, 12), team);

    expect(ping.content).toContain("TUE SEP 22 · 8:00 PM ET · ASCENT");
    expect(ping.content).toMatch(/confirmed \(2\/5\): <@101> <@102>/i);
    expect(ping.content).toMatch(/need 3 more/i);
    expect(ping.content).toMatch(/tentative: <@104>/i);
    expect(ping.content).toMatch(/not set: <@105>/i);
    expect(ping.content).toContain(SITE);
    expect(ping.content).not.toContain("<@103>");
    expect(ping.content).not.toContain("<@106>");
    expect(ping.mentionUserIds.sort()).toEqual(["101", "102", "104", "105"]);
  });

  it("says the team is set once five are confirmed", () => {
    const team = [1, 2, 3, 4, 5].map((n) => mate(n, available));
    const [ping] = pingsAt(et(22, 12), team);
    expect(ping.content).toMatch(/confirmed \(5\/5\)/i);
    expect(ping.content).not.toMatch(/need \d+ more/i);
  });

  it("labels a Playoffs match PLAYOFFS", () => {
    const playoffs = { ...tuesdayMatch, isPlayoffs: true, map: null };
    const [ping] = pingsAt(et(22, 12), [mate(1, available)], [playoffs]);
    expect(ping.content).toContain("PLAYOFFS");
  });

  it("names a teammate with no linked Discord account instead of @ing them", () => {
    const noDiscord = { ...mate(1, available), discordId: null };
    const [ping] = pingsAt(et(22, 12), [noDiscord]);
    expect(ping.content).toContain("Player1");
    expect(ping.mentionUserIds).toEqual([]);
  });

  it("stops offering the match-day ping once the 30-minute warning takes over", () => {
    expect(pingsAt(et(22, 19, 30), [mate(1, available)]).map((p) => p.key)).toEqual(["match-soon:m1"]);
  });
});

describe("buildDuePings — match starting soon", () => {
  it("@s just the confirmed teammates 30 minutes out when five are in", () => {
    const team = [...[1, 2, 3, 4, 5].map((n) => mate(n, available)), mate(6, { status: "tentative" })];
    const [ping] = pingsAt(et(22, 19, 30), team);

    expect(ping.key).toBe("match-soon:m1");
    expect(ping.content).toMatch(/30 min/i);
    expect(ping.content).toContain("<@101> <@102> <@103> <@104> <@105>");
    expect(ping.mentionUserIds).not.toContain("106");
  });

  it("asks Tentative and Not set teammates to fill in when short-handed", () => {
    const team = [mate(1, available), mate(2, { status: "tentative" }), mate(3, { status: "not-set" }), mate(4, { status: "unavailable" })];
    const [ping] = pingsAt(et(22, 19, 45), team);

    expect(ping.content).toMatch(/need 4 more/i);
    expect(ping.mentionUserIds.sort()).toEqual(["101", "102", "103"]);
  });

  it("stays available until 15 minutes after the start, then goes quiet", () => {
    expect(pingsAt(et(22, 20, 14), [mate(1, available)]).map((p) => p.key)).toEqual(["match-soon:m1"]);
    expect(pingsAt(et(22, 20, 15), [mate(1, available)])).toEqual([]);
  });

  it("uses the match's Eastern day even though 8PM ET is already tomorrow in UTC", () => {
    const [ping] = pingsAt(et(22, 19, 30), [mate(1, available, { status: "unavailable" })]);
    expect(ping.mentionUserIds).toEqual(["101"]);
  });
});

describe("buildDuePings — next week's availability reminder", () => {
  const unsetNextWeek = (n: number): PingTeammate => ({
    ...mate(n, available),
    week: dates.map((_, i) => (i >= 7 && i % 2 === 0 ? { status: "not-set" } : available)),
  });

  it("reminds teammates with unset days next week, Sunday evening ET", () => {
    const [ping] = pingsAt(et(27, 18), [unsetNextWeek(1), mate(2, available)], []);
    expect(ping.key).toBe("week-reminder:2026-09-28");
    expect(ping.content).toContain("<@101>");
    expect(ping.content).toContain(`${SITE}/?week=1`);
    expect(ping.mentionUserIds).toEqual(["101"]);
  });

  it("doesn't remind anyone before Sunday 6PM ET", () => {
    expect(pingsAt(et(27, 17, 59), [unsetNextWeek(1)], [])).toEqual([]);
  });

  it("stays quiet when everyone has filled in next week", () => {
    expect(pingsAt(et(27, 18), [mate(1, available)], [])).toEqual([]);
  });
});

describe("buildDuePings — notes", () => {
  it("shows a teammate's note beside their mention on the match-day roll call", () => {
    const [ping] = pingsAt(et(22, 12), [mate(1, { status: "tentative", note: "might be late" })]);
    expect(ping.content).toContain("<@101> (might be late)");
  });

  it("strips mention syntax out of a note so it can't ping anyone", () => {
    const [ping] = pingsAt(et(22, 12), [mate(1, { status: "tentative", note: "@everyone <@999>" })]);
    expect(ping.content).not.toContain("@everyone");
    expect(ping.content).not.toContain("<@999>");
  });
});
