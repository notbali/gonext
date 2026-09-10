import { beforeEach, describe, expect, it } from "vitest";
import { resetTestDb, testDb } from "../tests/test-db";
import { claimVacantCoachRole, promoteToCoach } from "./coach";

beforeEach(async () => {
  await resetTestDb();
});

async function makeTeam() {
  return testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
}

async function makeTeammate(teamId: string, name: string, opts: Partial<{ isCoach: boolean; active: boolean; order: number }> = {}) {
  const user = await testDb.user.create({ data: { name } });
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

describe("promoteToCoach", () => {
  it("returns not-found for an unknown teammate id", async () => {
    const result = await promoteToCoach("does-not-exist", testDb);

    expect(result).toEqual({ status: "not-found" });
  });

  it("promotes a teammate to coach", async () => {
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { isCoach: false });

    const result = await promoteToCoach(bob.id, testDb);

    expect(result).toEqual({ status: "promoted" });
    const updated = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(updated?.isCoach).toBe(true);
  });

  it("returns already-coach and makes no change when the teammate is already a coach", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice", { isCoach: true });

    const result = await promoteToCoach(alice.id, testDb);

    expect(result).toEqual({ status: "already-coach" });
  });

  it("does not affect other teammates on the team", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice", { isCoach: true, order: 0 });
    const bob = await makeTeammate(team.id, "Bob", { isCoach: false, order: 1 });

    await promoteToCoach(bob.id, testDb);

    const aliceAfter = await testDb.teammate.findUnique({ where: { id: alice.id } });
    expect(aliceAfter?.isCoach).toBe(true);
  });
});

describe("claimVacantCoachRole", () => {
  it("returns not-found for an unknown teammate id", async () => {
    const result = await claimVacantCoachRole("does-not-exist", testDb);

    expect(result).toEqual({ status: "not-found" });
  });

  it("returns not-found for an inactive teammate", async () => {
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { active: false });

    const result = await claimVacantCoachRole(bob.id, testDb);

    expect(result).toEqual({ status: "not-found" });
  });

  it("claims the coach role when the team has zero active coaches", async () => {
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { isCoach: false });

    const result = await claimVacantCoachRole(bob.id, testDb);

    expect(result).toEqual({ status: "claimed" });
    const updated = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(updated?.isCoach).toBe(true);
  });

  it("refuses to claim when the team already has an active coach", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice", { isCoach: true, active: true });
    const bob = await makeTeammate(team.id, "Bob", { isCoach: false });

    const result = await claimVacantCoachRole(bob.id, testDb);

    expect(result).toEqual({ status: "coach-exists" });
    const updated = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(updated?.isCoach).toBe(false);
  });

  it("allows claiming when the only coach on the team is inactive", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice", { isCoach: true, active: false });
    const bob = await makeTeammate(team.id, "Bob", { isCoach: false, active: true });

    const result = await claimVacantCoachRole(bob.id, testDb);

    expect(result).toEqual({ status: "claimed" });
  });

  it("does not let a claim on one team be affected by a coach on a different team", async () => {
    const teamA = await makeTeam();
    const teamB = await testDb.team.create({ data: { name: "Other Team", division: "DIV 1" } });
    await makeTeammate(teamB.id, "Alice", { isCoach: true });
    const bob = await makeTeammate(teamA.id, "Bob", { isCoach: false });

    const result = await claimVacantCoachRole(bob.id, testDb);

    expect(result).toEqual({ status: "claimed" });
  });

  it("lets exactly one teammate win when multiple race to claim a vacant coach role", async () => {
    const team = await makeTeam();
    const teammates = await Promise.all(
      Array.from({ length: 6 }, (_, i) => makeTeammate(team.id, `Player ${i}`, { order: i })),
    );

    const results = await Promise.all(
      teammates.map((t) => claimVacantCoachRole(t.id, testDb)),
    );

    const claimed = results.filter((r) => r.status === "claimed");
    expect(claimed).toHaveLength(1);

    const coaches = await testDb.teammate.findMany({ where: { teamId: team.id, isCoach: true } });
    expect(coaches).toHaveLength(1);
  });
});
