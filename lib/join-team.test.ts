import { beforeEach, describe, expect, it } from "vitest";
import { resetTestDb, testDb } from "../tests/test-db";
import { joinTeamByInviteToken } from "./join-team";

beforeEach(async () => {
  await resetTestDb();
});

async function makeTeam() {
  return testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
}

async function makeUser(name: string) {
  return testDb.user.create({ data: { name } });
}

describe("joinTeamByInviteToken", () => {
  it("returns invalid-token for an unknown invite token", async () => {
    const user = await makeUser("Alice");

    const result = await joinTeamByInviteToken("not-a-real-token", user.id, testDb);

    expect(result).toEqual({ status: "invalid-token" });
  });

  it("makes the first joiner the coach with order 0", async () => {
    const team = await makeTeam();
    const alice = await makeUser("Alice");

    const result = await joinTeamByInviteToken(team.inviteToken, alice.id, testDb);

    expect(result.status).toBe("joined");
    const teammate = await testDb.teammate.findUnique({ where: { userId: alice.id } });
    expect(teammate).toMatchObject({ order: 0, isCoach: true, teamId: team.id });
  });

  it("gives sequential joiners increasing order and no extra coaches", async () => {
    const team = await makeTeam();
    const alice = await makeUser("Alice");
    const bob = await makeUser("Bob");

    await joinTeamByInviteToken(team.inviteToken, alice.id, testDb);
    await joinTeamByInviteToken(team.inviteToken, bob.id, testDb);

    const aliceTeammate = await testDb.teammate.findUnique({ where: { userId: alice.id } });
    const bobTeammate = await testDb.teammate.findUnique({ where: { userId: bob.id } });
    expect(aliceTeammate).toMatchObject({ order: 0, isCoach: true });
    expect(bobTeammate).toMatchObject({ order: 1, isCoach: false });
  });

  it("does not create a new teammate (or move order) for someone who already joined", async () => {
    const team = await makeTeam();
    const alice = await makeUser("Alice");
    const first = await joinTeamByInviteToken(team.inviteToken, alice.id, testDb);

    const second = await joinTeamByInviteToken(team.inviteToken, alice.id, testDb);

    expect(second).toEqual({ status: "already-joined", teammateId: (first as { teammateId: string }).teammateId });
    const count = await testDb.teammate.count({ where: { userId: alice.id } });
    expect(count).toBe(1);
  });

  it("never lets a brand new teammate see another teammate's availability", async () => {
    const team = await makeTeam();
    const alice = await makeUser("Alice");
    await joinTeamByInviteToken(team.inviteToken, alice.id, testDb);
    const aliceTeammate = await testDb.teammate.findUnique({ where: { userId: alice.id } });
    await testDb.availability.create({
      data: {
        teammateId: aliceTeammate!.id,
        date: new Date("2026-09-07T00:00:00.000Z"),
        status: "available",
        timeRange: "6-9pm",
      },
    });

    const bob = await makeUser("Bob");
    const result = await joinTeamByInviteToken(team.inviteToken, bob.id, testDb);

    const bobAvailability = await testDb.availability.findMany({
      where: { teammateId: (result as { teammateId: string }).teammateId },
    });
    expect(bobAvailability).toEqual([]);
  });

  it("assigns every concurrent joiner a unique, contiguous order with exactly one coach", async () => {
    const team = await makeTeam();
    const users = await Promise.all(
      Array.from({ length: 8 }, (_, i) => makeUser(`Player ${i}`)),
    );

    await Promise.all(users.map((u) => joinTeamByInviteToken(team.inviteToken, u.id, testDb)));

    const teammates = await testDb.teammate.findMany({ where: { teamId: team.id } });
    expect(teammates).toHaveLength(8);

    const orders = teammates.map((t) => t.order).sort((a, b) => a - b);
    expect(orders).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

    const coaches = teammates.filter((t) => t.isCoach);
    expect(coaches).toHaveLength(1);
  });
});
