import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestDb, testDb } from "../../tests/test-db";

vi.mock("@/lib/db", () => ({ db: testDb }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const { createMatch, updateMatch, deleteMatch, setWeekMap, setMatchResult } = await import("./actions");

beforeEach(async () => {
  await resetTestDb();
  auth.mockReset();
});

async function makeTeam() {
  return testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
}

function matchFormData(
  fields: Partial<{ date: string; time: string; isPlayoffs: boolean }> = {},
) {
  const data = new FormData();
  data.set("date", fields.date ?? "2026-09-14"); // Mon Sep 14 2026
  data.set("time", fields.time ?? "19:00");
  if (fields.isPlayoffs) data.set("isPlayoffs", "on");
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

    await expect(createMatch(matchFormData({ date: "" }))).rejects.toThrow(
      "Date and time are required.",
    );
  });

  it("throws when there is no team yet", async () => {
    auth.mockResolvedValue({ isCoach: true });

    await expect(createMatch(matchFormData())).rejects.toThrow("No team found.");
  });

  it("creates a non-playoffs match by default on the existing team when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();

    await createMatch(matchFormData({ date: "2026-09-14", time: "19:00" }));

    const matches = await testDb.match.findMany();
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      teamId: team.id,
      isPlayoffs: false,
      // 7:00 PM entered is Eastern time (EDT, UTC-4 in September).
      date: new Date("2026-09-14T23:00:00Z"),
    });
  });

  it("creates a Playoffs match when the checkbox is set", async () => {
    auth.mockResolvedValue({ isCoach: true });
    await makeTeam();

    await createMatch(matchFormData({ isPlayoffs: true }));

    const matches = await testDb.match.findMany();
    expect(matches[0].isPlayoffs).toBe(true);
  });

  it("allows up to 2 non-playoffs matches in the same week", async () => {
    auth.mockResolvedValue({ isCoach: true });
    await makeTeam();

    await createMatch(matchFormData({ date: "2026-09-14" }));
    await createMatch(matchFormData({ date: "2026-09-15" }));

    const matches = await testDb.match.findMany();
    expect(matches).toHaveLength(2);
  });

  it("rejects a 3rd non-playoffs match in the same week", async () => {
    auth.mockResolvedValue({ isCoach: true });
    await makeTeam();
    await createMatch(matchFormData({ date: "2026-09-14" }));
    await createMatch(matchFormData({ date: "2026-09-15" }));

    await expect(createMatch(matchFormData({ date: "2026-09-16" }))).rejects.toThrow(
      "Only 2 matches can be scheduled per week.",
    );
    expect(await testDb.match.findMany()).toHaveLength(2);
  });

  it("does not reject a 3rd match in the same week if it's flagged Playoffs", async () => {
    auth.mockResolvedValue({ isCoach: true });
    await makeTeam();
    await createMatch(matchFormData({ date: "2026-09-14" }));
    await createMatch(matchFormData({ date: "2026-09-15" }));

    await createMatch(matchFormData({ date: "2026-09-16", isPlayoffs: true }));

    expect(await testDb.match.findMany()).toHaveLength(3);
  });

  it("allows a non-playoffs match in the same week as an existing Playoffs match", async () => {
    auth.mockResolvedValue({ isCoach: true });
    await makeTeam();
    await createMatch(matchFormData({ date: "2026-09-14", isPlayoffs: true }));
    await createMatch(matchFormData({ date: "2026-09-15" }));

    await createMatch(matchFormData({ date: "2026-09-16" }));

    expect(await testDb.match.findMany()).toHaveLength(3);
  });

  it("allows the 2-match cap to reset in a different week", async () => {
    auth.mockResolvedValue({ isCoach: true });
    await makeTeam();
    await createMatch(matchFormData({ date: "2026-09-14" }));
    await createMatch(matchFormData({ date: "2026-09-15" }));

    await createMatch(matchFormData({ date: "2026-09-21" })); // next week's Monday

    expect(await testDb.match.findMany()).toHaveLength(3);
  });
});

describe("updateMatch", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    const team = await makeTeam();
    const match = await testDb.match.create({
      data: { teamId: team.id, date: new Date("2026-09-14T19:00:00") },
    });

    await expect(updateMatch(match.id, matchFormData({ date: "2026-09-15" }))).rejects.toThrow(
      "Only a coach can manage matches.",
    );
    const unchanged = await testDb.match.findUnique({ where: { id: match.id } });
    expect(unchanged?.date).toEqual(new Date("2026-09-14T19:00:00"));
  });

  it("updates the match when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const match = await testDb.match.create({
      data: { teamId: team.id, date: new Date("2026-09-14T19:00:00") },
    });

    await updateMatch(match.id, matchFormData({ date: "2026-09-15", time: "20:30", isPlayoffs: true }));

    const updated = await testDb.match.findUnique({ where: { id: match.id } });
    // 8:30 PM entered is Eastern time (EDT, UTC-4 in September).
    expect(updated).toMatchObject({ isPlayoffs: true, date: new Date("2026-09-16T00:30:00Z") });
  });

  it("does not count the match against its own week's cap when re-saved unchanged", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const match = await testDb.match.create({
      data: { teamId: team.id, date: new Date("2026-09-14T19:00:00") },
    });
    await createMatch(matchFormData({ date: "2026-09-15" }));

    await expect(
      updateMatch(match.id, matchFormData({ date: "2026-09-14", time: "20:00" })),
    ).resolves.toBeUndefined();
  });

  it("rejects moving a match into a week that already has 2 non-playoffs matches", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    await createMatch(matchFormData({ date: "2026-09-14" }));
    await createMatch(matchFormData({ date: "2026-09-15" }));
    const other = await testDb.match.create({
      data: { teamId: team.id, date: new Date("2026-09-21T19:00:00") },
    });

    await expect(updateMatch(other.id, matchFormData({ date: "2026-09-16" }))).rejects.toThrow(
      "Only 2 matches can be scheduled per week.",
    );
  });
});

describe("deleteMatch", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    const team = await makeTeam();
    const match = await testDb.match.create({
      data: { teamId: team.id, date: new Date("2026-09-14T19:00:00") },
    });

    await expect(deleteMatch(match.id)).rejects.toThrow("Only a coach can manage matches.");
    const stillThere = await testDb.match.findUnique({ where: { id: match.id } });
    expect(stillThere).not.toBeNull();
  });

  it("deletes the match when the caller is a coach", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const match = await testDb.match.create({
      data: { teamId: team.id, date: new Date("2026-09-14T19:00:00") },
    });

    await deleteMatch(match.id);

    const gone = await testDb.match.findUnique({ where: { id: match.id } });
    expect(gone).toBeNull();
  });
});

describe("setWeekMap", () => {
  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    await makeTeam();

    await expect(setWeekMap("2026-09-14", "ASCENT")).rejects.toThrow(
      "Only a coach can manage matches.",
    );
    expect(await testDb.weekMap.findMany()).toHaveLength(0);
  });

  it("creates a WeekMap for a week that doesn't have one yet", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();

    await setWeekMap("2026-09-14", "ASCENT");

    const weekMaps = await testDb.weekMap.findMany();
    expect(weekMaps).toHaveLength(1);
    expect(weekMaps[0]).toMatchObject({
      teamId: team.id,
      weekStart: new Date("2026-09-14"),
      map: "ASCENT",
    });
  });

  it("overwrites the existing map when the week already has one set", async () => {
    auth.mockResolvedValue({ isCoach: true });
    await makeTeam();
    await setWeekMap("2026-09-14", "ASCENT");

    await setWeekMap("2026-09-14", "BIND");

    const weekMaps = await testDb.weekMap.findMany();
    expect(weekMaps).toHaveLength(1);
    expect(weekMaps[0].map).toBe("BIND");
  });
});

describe("setMatchResult", () => {
  async function pastMatch() {
    const team = await makeTeam();
    return testDb.match.create({ data: { teamId: team.id, date: new Date("2020-01-01T00:00:00Z") } });
  }

  it("throws when the caller is not a coach", async () => {
    auth.mockResolvedValue({ isCoach: false });
    const match = await pastMatch();

    await expect(setMatchResult(match.id, "WIN")).rejects.toThrow("Only a coach can manage matches.");
    expect((await testDb.match.findUniqueOrThrow({ where: { id: match.id } })).result).toBeNull();
  });

  it("records a win or a loss on a played match", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const match = await pastMatch();

    await setMatchResult(match.id, "LOSS");
    expect((await testDb.match.findUniqueOrThrow({ where: { id: match.id } })).result).toBe("LOSS");

    await setMatchResult(match.id, "WIN");
    expect((await testDb.match.findUniqueOrThrow({ where: { id: match.id } })).result).toBe("WIN");
  });

  it("clears a result", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const match = await pastMatch();
    await setMatchResult(match.id, "WIN");

    await setMatchResult(match.id, null);
    expect((await testDb.match.findUniqueOrThrow({ where: { id: match.id } })).result).toBeNull();
  });

  it("refuses a result for a match that hasn't started", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const team = await makeTeam();
    const future = await testDb.match.create({ data: { teamId: team.id, date: new Date("2099-01-01T00:00:00Z") } });

    await expect(setMatchResult(future.id, "WIN")).rejects.toThrow(/hasn't been played/i);
  });

  it("rejects anything other than WIN, LOSS or null", async () => {
    auth.mockResolvedValue({ isCoach: true });
    const match = await pastMatch();
    await expect(setMatchResult(match.id, "DRAW" as never)).rejects.toThrow(/result/i);
  });
});
