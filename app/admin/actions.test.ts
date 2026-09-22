import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestDb, testDb } from "../../tests/test-db";

vi.mock("@/lib/db", () => ({ db: testDb }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const {
  adminAddUserToTeam,
  adminDeactivateTeammate,
  adminReactivateTeammate,
  adminPromoteTeammate,
  adminDemoteTeammate,
  adminRegenerateInvite,
} = await import("./actions");

beforeEach(async () => {
  await resetTestDb();
  auth.mockReset();
});

async function makeTeam() {
  return testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
}

async function makeTeammate(teamId: string, name: string, opts: Partial<{ isCoach: boolean; active: boolean }> = {}) {
  const user = await testDb.user.create({ data: { name } });
  return testDb.teammate.create({
    data: { teamId, userId: user.id, isCoach: opts.isCoach ?? false, active: opts.active ?? true },
  });
}

const DENIED = "Only an admin can do this.";

describe("admin actions reject non-admins", () => {
  it.each([
    ["no session", null],
    ["a regular teammate", { isAdmin: false, isCoach: false }],
    ["a coach who isn't an admin", { isAdmin: false, isCoach: true }],
  ])("rejects every action for %s", async (_label, session) => {
    auth.mockResolvedValue(session);
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice", { isCoach: true });
    const stray = await testDb.user.create({ data: { name: "Stray" } });

    await expect(adminAddUserToTeam(stray.id)).rejects.toThrow(DENIED);
    await expect(adminDeactivateTeammate(alice.id)).rejects.toThrow(DENIED);
    await expect(adminReactivateTeammate(alice.id)).rejects.toThrow(DENIED);
    await expect(adminPromoteTeammate(alice.id)).rejects.toThrow(DENIED);
    await expect(adminDemoteTeammate(alice.id)).rejects.toThrow(DENIED);
    await expect(adminRegenerateInvite(team.id)).rejects.toThrow(DENIED);

    expect(await testDb.teammate.count()).toBe(1);
    const unchanged = await testDb.teammate.findUnique({ where: { id: alice.id } });
    expect(unchanged).toMatchObject({ active: true, isCoach: true });
    expect((await testDb.team.findUnique({ where: { id: team.id } }))?.inviteToken).toBe(team.inviteToken);
  });
});

describe("as an admin", () => {
  beforeEach(() => {
    auth.mockResolvedValue({ isAdmin: true, isCoach: false, teammateId: null });
  });

  it("adds an unassigned user to the team", async () => {
    const team = await makeTeam();
    const stray = await testDb.user.create({ data: { name: "Stray" } });

    await adminAddUserToTeam(stray.id);

    const created = await testDb.teammate.findUnique({ where: { userId: stray.id } });
    expect(created?.teamId).toBe(team.id);
  });

  it("throws when adding a user who is already on the team", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice");

    await expect(adminAddUserToTeam(alice.userId)).rejects.toThrow("That user is already on the team.");
  });

  it("throws when there is no team to add to", async () => {
    const stray = await testDb.user.create({ data: { name: "Stray" } });

    await expect(adminAddUserToTeam(stray.id)).rejects.toThrow("There is no team yet.");
  });

  it("can deactivate a coach, which a coach can't do on the roster page", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice", { isCoach: true });

    await adminDeactivateTeammate(alice.id);

    expect((await testDb.teammate.findUnique({ where: { id: alice.id } }))?.active).toBe(false);
  });

  it("reactivates a teammate", async () => {
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { active: false });

    await adminReactivateTeammate(bob.id);

    expect((await testDb.teammate.findUnique({ where: { id: bob.id } }))?.active).toBe(true);
  });

  it("promotes and demotes coaches", async () => {
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob");

    await adminPromoteTeammate(bob.id);
    expect((await testDb.teammate.findUnique({ where: { id: bob.id } }))?.isCoach).toBe(true);

    await adminDemoteTeammate(bob.id);
    expect((await testDb.teammate.findUnique({ where: { id: bob.id } }))?.isCoach).toBe(false);
  });

  it("throws for an unknown teammate id", async () => {
    await expect(adminDeactivateTeammate("nope")).rejects.toThrow("That teammate no longer exists.");
    await expect(adminPromoteTeammate("nope")).rejects.toThrow("That teammate no longer exists.");
  });

  it("regenerates the invite link", async () => {
    const team = await makeTeam();

    await adminRegenerateInvite(team.id);

    expect((await testDb.team.findUnique({ where: { id: team.id } }))?.inviteToken).not.toBe(team.inviteToken);
  });
});
