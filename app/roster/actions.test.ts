import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestDb, testDb } from "../../tests/test-db";

vi.mock("@/lib/db", () => ({ db: testDb }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const {
  deactivateTeammate,
  reactivateTeammate,
  regenerateInvite,
  promoteTeammate,
  claimCoachRole,
} = await import("./actions");

beforeEach(async () => {
  await resetTestDb();
  auth.mockReset();
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

describe("deactivateTeammate", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob");

    await expect(deactivateTeammate(bob.id)).rejects.toThrow("Only a coach can manage the roster.");
    const unchanged = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(unchanged?.active).toBe(true);
  });

  it("throws when there is no session", async () => {
    auth.mockResolvedValue(null);
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob");

    await expect(deactivateTeammate(bob.id)).rejects.toThrow("Only a coach can manage the roster.");
  });

  it("deactivates the teammate when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob");

    await deactivateTeammate(bob.id);

    const updated = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(updated?.active).toBe(false);
  });

  it("throws when the target teammate is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice", { isCoach: true });

    await expect(deactivateTeammate(alice.id)).rejects.toThrow(
      "Coaches cannot be removed. Promote another teammate first.",
    );
    const unchanged = await testDb.teammate.findUnique({ where: { id: alice.id } });
    expect(unchanged?.active).toBe(true);
  });

  it("throws when a coach tries to deactivate themselves", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice", { isCoach: true });
    auth.mockResolvedValue({ isCoach: true, teammateId: alice.id });

    await expect(deactivateTeammate(alice.id)).rejects.toThrow(
      "Coaches cannot be removed. Promote another teammate first.",
    );
    const unchanged = await testDb.teammate.findUnique({ where: { id: alice.id } });
    expect(unchanged?.active).toBe(true);
  });
});

describe("reactivateTeammate", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { active: false });

    await expect(reactivateTeammate(bob.id)).rejects.toThrow("Only a coach can manage the roster.");
    const unchanged = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(unchanged?.active).toBe(false);
  });

  it("reactivates the teammate when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { active: false });

    await reactivateTeammate(bob.id);

    const updated = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(updated?.active).toBe(true);
  });
});

describe("regenerateInvite", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    const team = await makeTeam();

    await expect(regenerateInvite(team.id)).rejects.toThrow("Only a coach can manage the roster.");
    const unchanged = await testDb.team.findUnique({ where: { id: team.id } });
    expect(unchanged?.inviteToken).toBe(team.inviteToken);
  });

  it("issues a new invite token when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();

    await regenerateInvite(team.id);

    const updated = await testDb.team.findUnique({ where: { id: team.id } });
    expect(updated?.inviteToken).not.toBe(team.inviteToken);
  });
});

describe("promoteTeammate", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { isCoach: false });

    await expect(promoteTeammate(bob.id)).rejects.toThrow("Only a coach can manage the roster.");
    const unchanged = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(unchanged?.isCoach).toBe(false);
  });

  it("promotes the teammate when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { isCoach: false });

    await promoteTeammate(bob.id);

    const updated = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(updated?.isCoach).toBe(true);
  });
});

describe("claimCoachRole", () => {
  it("throws when the caller has no teammate id", async () => {
    auth.mockResolvedValue({ teammateId: null });

    await expect(claimCoachRole()).rejects.toThrow("You must be a teammate to do this.");
  });

  it("throws when there is no session", async () => {
    auth.mockResolvedValue(null);

    await expect(claimCoachRole()).rejects.toThrow("You must be a teammate to do this.");
  });

  it("throws when the team already has an active coach", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice", { isCoach: true });
    const bob = await makeTeammate(team.id, "Bob", { isCoach: false });
    auth.mockResolvedValue({ teammateId: bob.id });

    await expect(claimCoachRole()).rejects.toThrow("This team already has an active coach.");
    const unchanged = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(unchanged?.isCoach).toBe(false);
  });

  it("claims the coach role when the team has no active coach", async () => {
    const team = await makeTeam();
    const bob = await makeTeammate(team.id, "Bob", { isCoach: false });
    auth.mockResolvedValue({ teammateId: bob.id });

    await claimCoachRole();

    const updated = await testDb.teammate.findUnique({ where: { id: bob.id } });
    expect(updated?.isCoach).toBe(true);
  });
});
