import { beforeEach, describe, expect, it } from "vitest";
import { resetTestDb, testDb } from "../tests/test-db";
import { loadDuePings } from "./bot-pings-data";
import { easternPartsToUtc } from "./dates";

beforeEach(async () => {
  await resetTestDb();
});

const et = (day: number, hours: number, minutes = 0) =>
  easternPartsToUtc({ year: 2026, month: 8, day, hours, minutes });

async function makeTeam() {
  return testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
}

async function makeTeammate(teamId: string, name: string, discordId: string | null, active = true, order = 0) {
  const user = await testDb.user.create({ data: { name } });
  if (discordId) {
    await testDb.account.create({
      data: { userId: user.id, type: "oauth", provider: "discord", providerAccountId: discordId },
    });
  }
  return testDb.teammate.create({ data: { teamId, userId: user.id, order, active } });
}

// Schedule days are stored at local midnight, like the grid writes them.
const TUESDAY = new Date(2026, 8, 22);

describe("loadDuePings", () => {
  it("returns nothing when no team exists", async () => {
    expect(await loadDuePings(et(22, 12), "https://site", testDb)).toEqual([]);
  });

  it("@s an active teammate by their linked Discord id on a match day", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice", "111");
    await testDb.availability.create({ data: { teammateId: alice.id, date: TUESDAY, status: "available" } });
    await testDb.match.create({ data: { teamId: team.id, date: et(22, 20) } });

    const pings = await loadDuePings(et(22, 12), "https://site", testDb);

    expect(pings).toHaveLength(1);
    expect(pings[0].key).toMatch(/^match-day:/);
    expect(pings[0].content).toContain("<@111>");
    expect(pings[0].content).toContain("https://site");
  });

  it("leaves out deactivated teammates", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice", "111");
    await makeTeammate(team.id, "Gone", "222", false, 1);
    await testDb.match.create({ data: { teamId: team.id, date: et(22, 20) } });

    const [ping] = await loadDuePings(et(22, 12), "https://site", testDb);

    expect(ping.mentionUserIds).toEqual(["111"]);
  });

  it("resolves the match's map from its week", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice", "111");
    await testDb.weekMap.create({ data: { teamId: team.id, weekStart: new Date(2026, 8, 21), map: "LOTUS" } });
    await testDb.match.create({ data: { teamId: team.id, date: et(22, 20) } });

    const [ping] = await loadDuePings(et(22, 12), "https://site", testDb);

    expect(ping.content).toContain("LOTUS");
  });

  it("covers next week too, for Sunday's reminder", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice", "111");

    const pings = await loadDuePings(et(27, 18), "https://site", testDb);

    expect(pings.map((p) => p.key)).toEqual(["week-reminder:2026-09-28"]);
  });
});
