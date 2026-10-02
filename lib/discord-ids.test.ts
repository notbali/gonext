import { beforeEach, describe, expect, it } from "vitest";
import { resetTestDb, testDb } from "../tests/test-db";
import { loadDiscordIds } from "./discord-ids";

beforeEach(async () => {
  await resetTestDb();
});

async function makeTeammate(teamId: string, name: string, discordId: string | null) {
  const user = await testDb.user.create({ data: { name } });
  if (discordId) {
    await testDb.account.create({
      data: { userId: user.id, type: "oauth", provider: "discord", providerAccountId: discordId },
    });
  }
  return testDb.teammate.create({ data: { teamId, userId: user.id } });
}

describe("loadDiscordIds", () => {
  it("maps each teammate to their linked Discord user id, or null without one", async () => {
    const team = await testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
    const alice = await makeTeammate(team.id, "Alice", "111");
    const bob = await makeTeammate(team.id, "Bob", null);

    const ids = await loadDiscordIds([alice.id, bob.id], testDb);
    expect(ids.get(alice.id)).toBe("111");
    expect(ids.get(bob.id)).toBeNull();
  });

  it("only looks up the teammates asked for", async () => {
    const team = await testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
    const alice = await makeTeammate(team.id, "Alice", "111");
    await makeTeammate(team.id, "Bob", "222");

    expect([...(await loadDiscordIds([alice.id], testDb)).keys()]).toEqual([alice.id]);
  });
});
