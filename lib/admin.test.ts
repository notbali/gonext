import { beforeEach, describe, expect, it } from "vitest";
import { resetTestDb, testDb } from "../tests/test-db";
import {
  addUserToTeam,
  getAdminOverview,
  isAdminUser,
  parseAdminDiscordIds,
  setTeammateActive,
  setTeammateCoach,
} from "./admin";

beforeEach(async () => {
  await resetTestDb();
});

async function makeTeam(name = "GO//NEXT") {
  return testDb.team.create({ data: { name, division: "DIV 2" } });
}

async function makeUser(name: string, discordId?: string) {
  return testDb.user.create({
    data: {
      name,
      accounts: discordId
        ? { create: { type: "oauth", provider: "discord", providerAccountId: discordId } }
        : undefined,
    },
  });
}

async function makeTeammate(
  teamId: string,
  name: string,
  opts: Partial<{ isCoach: boolean; active: boolean; order: number; discordId: string }> = {},
) {
  const user = await makeUser(name, opts.discordId);
  return testDb.teammate.create({
    data: {
      teamId,
      userId: user.id,
      order: opts.order ?? 0,
      isCoach: opts.isCoach ?? false,
      active: opts.active ?? true,
    },
  });
}

describe("parseAdminDiscordIds", () => {
  it("returns an empty set when the variable is unset or blank", () => {
    expect(parseAdminDiscordIds(undefined).size).toBe(0);
    expect(parseAdminDiscordIds("").size).toBe(0);
    expect(parseAdminDiscordIds("  ,  ").size).toBe(0);
  });

  it("splits on commas and whitespace and trims each id", () => {
    const ids = parseAdminDiscordIds(" 111, 222\n333 ");
    expect([...ids].sort()).toEqual(["111", "222", "333"]);
  });
});

describe("isAdminUser", () => {
  it("is true when the user's linked Discord account id is on the allowlist", async () => {
    const user = await makeUser("Bali", "111");

    expect(await isAdminUser(user.id, new Set(["111"]), testDb)).toBe(true);
  });

  it("is false when the user's Discord id isn't on the allowlist", async () => {
    const user = await makeUser("Bob", "222");

    expect(await isAdminUser(user.id, new Set(["111"]), testDb)).toBe(false);
  });

  it("is false for an empty allowlist without querying accounts", async () => {
    const user = await makeUser("Bali", "111");

    expect(await isAdminUser(user.id, new Set(), testDb)).toBe(false);
  });

  it("only matches the Discord provider, not another provider's account id", async () => {
    const user = await testDb.user.create({
      data: {
        name: "Mallory",
        accounts: { create: { type: "oauth", provider: "github", providerAccountId: "111" } },
      },
    });

    expect(await isAdminUser(user.id, new Set(["111"]), testDb)).toBe(false);
  });

  it("does not grant admin to a different user whose id is on the list", async () => {
    await makeUser("Bali", "111");
    const bob = await makeUser("Bob", "222");

    expect(await isAdminUser(bob.id, new Set(["111"]), testDb)).toBe(false);
  });
});

describe("getAdminOverview", () => {
  it("returns a null team and every user as unassigned when no team exists", async () => {
    await makeUser("Stray", "999");

    const overview = await getAdminOverview(testDb);

    expect(overview.team).toBeNull();
    expect(overview.teammates).toEqual([]);
    expect(overview.unassignedUsers.map((u) => u.name)).toEqual(["Stray"]);
  });

  it("lists every teammate, active and inactive, in roster order with their Discord id", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Bob", { order: 1, active: false, discordId: "222" });
    await makeTeammate(team.id, "Alice", { order: 0, isCoach: true, discordId: "111" });

    const overview = await getAdminOverview(testDb);

    expect(overview.team).toMatchObject({ id: team.id, name: "GO//NEXT", inviteToken: team.inviteToken });
    expect(overview.teammates).toMatchObject([
      { name: "Alice", isCoach: true, active: true, discordId: "111" },
      { name: "Bob", isCoach: false, active: false, discordId: "222" },
    ]);
  });

  it("lists signed-in users who aren't on the team as unassigned", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");
    await makeUser("Newcomer", "333");

    const overview = await getAdminOverview(testDb);

    expect(overview.unassignedUsers).toMatchObject([{ name: "Newcomer", discordId: "333" }]);
  });

  it("reports a null Discord id for a user with no linked Discord account", async () => {
    await makeUser("NoDiscord");

    const overview = await getAdminOverview(testDb);

    expect(overview.unassignedUsers[0].discordId).toBeNull();
  });
});

describe("addUserToTeam", () => {
  it("returns user-not-found for an unknown user", async () => {
    const team = await makeTeam();

    expect(await addUserToTeam("nope", team.id, testDb)).toEqual({ status: "user-not-found" });
  });

  it("returns team-not-found for an unknown team", async () => {
    const user = await makeUser("Newcomer");

    expect(await addUserToTeam(user.id, "nope", testDb)).toEqual({ status: "team-not-found" });
  });

  it("adds the user as an active non-coach teammate at the end of the roster", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice", { order: 0, isCoach: true });
    const user = await makeUser("Newcomer");

    const result = await addUserToTeam(user.id, team.id, testDb);

    expect(result.status).toBe("added");
    const created = await testDb.teammate.findUnique({ where: { userId: user.id } });
    expect(created).toMatchObject({ teamId: team.id, order: 1, isCoach: false, active: true });
  });

  it("returns already-on-team and changes nothing when the user is already a teammate", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice");

    const result = await addUserToTeam(alice.userId, team.id, testDb);

    expect(result).toEqual({ status: "already-on-team", teammateId: alice.id });
    expect(await testDb.teammate.count()).toBe(1);
  });

  it("gives concurrent adds distinct roster orders", async () => {
    const team = await makeTeam();
    const users = await Promise.all(Array.from({ length: 5 }, (_, i) => makeUser(`P${i}`)));

    await Promise.all(users.map((u) => addUserToTeam(u.id, team.id, testDb)));

    const orders = (await testDb.teammate.findMany({ where: { teamId: team.id } })).map((t) => t.order);
    expect(new Set(orders).size).toBe(5);
  });
});

describe("setTeammateActive", () => {
  it("returns not-found for an unknown teammate", async () => {
    expect(await setTeammateActive("nope", false, testDb)).toEqual({ status: "not-found" });
  });

  it("deactivates any teammate, including a coach", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice", { isCoach: true });

    expect(await setTeammateActive(alice.id, false, testDb)).toEqual({ status: "updated" });
    expect((await testDb.teammate.findUnique({ where: { id: alice.id } }))?.active).toBe(false);
  });

  it("reactivates an inactive teammate", async () => {
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { active: false });

    await setTeammateActive(bob.id, true, testDb);

    expect((await testDb.teammate.findUnique({ where: { id: bob.id } }))?.active).toBe(true);
  });
});

describe("setTeammateCoach", () => {
  it("returns not-found for an unknown teammate", async () => {
    expect(await setTeammateCoach("nope", true, testDb)).toEqual({ status: "not-found" });
  });

  it("promotes a player to coach", async () => {
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob");

    expect(await setTeammateCoach(bob.id, true, testDb)).toEqual({ status: "updated" });
    expect((await testDb.teammate.findUnique({ where: { id: bob.id } }))?.isCoach).toBe(true);
  });

  it("demotes a coach back to a player", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice", { isCoach: true });

    await setTeammateCoach(alice.id, false, testDb);

    expect((await testDb.teammate.findUnique({ where: { id: alice.id } }))?.isCoach).toBe(false);
  });
});
