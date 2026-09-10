import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestDb, testDb } from "../../tests/test-db";

vi.mock("@/lib/db", () => ({ db: testDb }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const { createMatch, updateMatch, deleteMatch } = await import("./actions");

beforeEach(async () => {
  await resetTestDb();
  auth.mockReset();
});

async function makeTeam() {
  return testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
}

function matchFormData(fields: Partial<{ group: string; date: string; time: string }> = {}) {
  const data = new FormData();
  data.set("group", fields.group ?? "Scrim");
  data.set("date", fields.date ?? "2026-09-14");
  data.set("time", fields.time ?? "19:00");
  return data;
}

describe("createMatch", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    await makeTeam();

    await expect(createMatch(matchFormData())).rejects.toThrow("Only a coach can manage matches.");
    const matches = await testDb.match.findMany();
    expect(matches).toHaveLength(0);
  });

  it("throws when there is no session", async () => {
    auth.mockResolvedValue(null);
    await makeTeam();

    await expect(createMatch(matchFormData())).rejects.toThrow("Only a coach can manage matches.");
  });

  it("throws when required fields are missing", async () => {
    auth.mockResolvedValue({ isCoach: true });
    await makeTeam();

    await expect(createMatch(matchFormData({ group: "" }))).rejects.toThrow(
      "Group, date, and time are all required.",
    );
  });

  it("throws when there is no team yet", async () => {
    auth.mockResolvedValue({ isCoach: true });

    await expect(createMatch(matchFormData())).rejects.toThrow("No team found.");
  });

  it("creates the match on the existing team when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();

    await createMatch(matchFormData({ group: "Scrim", date: "2026-09-14", time: "19:00" }));

    const matches = await testDb.match.findMany();
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      teamId: team.id,
      group: "Scrim",
      date: new Date("2026-09-14T19:00:00"),
    });
  });
});

describe("updateMatch", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    const team = await makeTeam();
    const match = await testDb.match.create({
      data: { teamId: team.id, group: "Scrim", date: new Date("2026-09-14T19:00:00") },
    });

    await expect(updateMatch(match.id, matchFormData({ group: "Ranked" }))).rejects.toThrow(
      "Only a coach can manage matches.",
    );
    const unchanged = await testDb.match.findUnique({ where: { id: match.id } });
    expect(unchanged?.group).toBe("Scrim");
  });

  it("updates the match when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const match = await testDb.match.create({
      data: { teamId: team.id, group: "Scrim", date: new Date("2026-09-14T19:00:00") },
    });

    await updateMatch(match.id, matchFormData({ group: "Ranked", date: "2026-09-15", time: "20:30" }));

    const updated = await testDb.match.findUnique({ where: { id: match.id } });
    expect(updated).toMatchObject({ group: "Ranked", date: new Date("2026-09-15T20:30:00") });
  });
});

describe("deleteMatch", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    const team = await makeTeam();
    const match = await testDb.match.create({
      data: { teamId: team.id, group: "Scrim", date: new Date("2026-09-14T19:00:00") },
    });

    await expect(deleteMatch(match.id)).rejects.toThrow("Only a coach can manage matches.");
    const stillThere = await testDb.match.findUnique({ where: { id: match.id } });
    expect(stillThere).not.toBeNull();
  });

  it("deletes the match when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const match = await testDb.match.create({
      data: { teamId: team.id, group: "Scrim", date: new Date("2026-09-14T19:00:00") },
    });

    await deleteMatch(match.id);

    const gone = await testDb.match.findUnique({ where: { id: match.id } });
    expect(gone).toBeNull();
  });
});
