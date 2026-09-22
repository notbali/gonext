import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestDb, testDb } from "../tests/test-db";

vi.mock("@/lib/db", () => ({ db: testDb }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const { setWeekAvailability, updateAvailability, updateAvailabilityNote, setWeeklyDefaults } = await import("./actions");
const { revalidatePath } = await import("next/cache");

beforeEach(async () => {
  await resetTestDb();
  auth.mockReset();
  vi.mocked(revalidatePath).mockClear();
});

async function makeTeammate() {
  const team = await testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
  const user = await testDb.user.create({ data: { name: "Alice" } });
  return testDb.teammate.create({
    data: { teamId: team.id, userId: user.id, order: 0, isCoach: false, active: true },
  });
}

const DATES = ["2026-09-14T00:00:00.000Z", "2026-09-15T00:00:00.000Z", "2026-09-16T00:00:00.000Z"];

describe("setWeekAvailability", () => {
  it("throws when there is no session", async () => {
    auth.mockResolvedValue(null);
    const teammate = await makeTeammate();

    await expect(
      setWeekAvailability(teammate.id, DATES, "available", null),
    ).rejects.toThrow("You can only edit your own availability.");
  });

  it("throws when the caller is editing someone else's availability", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: "someone-else" });

    await expect(
      setWeekAvailability(teammate.id, DATES, "available", null),
    ).rejects.toThrow("You can only edit your own availability.");

    const rows = await testDb.availability.findMany({ where: { teammateId: teammate.id } });
    expect(rows).toHaveLength(0);
  });

  it("creates an availability row for every date given", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await setWeekAvailability(teammate.id, DATES, "unavailable", null);

    const rows = await testDb.availability.findMany({ where: { teammateId: teammate.id } });
    expect(rows).toHaveLength(DATES.length);
    expect(rows.every((r) => r.status === "unavailable")).toBe(true);
  });

  it("overwrites existing availability rows for the given dates", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });
    await testDb.availability.create({
      data: { teammateId: teammate.id, date: new Date(DATES[0]), status: "tentative" },
    });

    await setWeekAvailability(teammate.id, DATES, "available", "6pm-9pm");

    const rows = await testDb.availability.findMany({ where: { teammateId: teammate.id } });
    expect(rows).toHaveLength(DATES.length);
    expect(rows.every((r) => r.status === "available" && r.timeRange === "6PM–9PM")).toBe(true);
  });

  it("clears the time range when status is not available", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await setWeekAvailability(teammate.id, DATES, "tentative", "6pm-9pm");

    const rows = await testDb.availability.findMany({ where: { teammateId: teammate.id } });
    expect(rows.every((r) => r.timeRange === null)).toBe(true);
  });

  it("revalidates the schedule page once", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await setWeekAvailability(teammate.id, DATES, "available", null);

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });
});

describe("time ranges", () => {
  it("setWeekAvailability rejects a time range it can't read, writing nothing", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await expect(
      setWeekAvailability(teammate.id, DATES, "available", "after work"),
    ).rejects.toThrow(/time range/i);

    expect(await testDb.availability.count()).toBe(0);
  });

  it("updateAvailability stores the canonical form of a range", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await updateAvailability(teammate.id, DATES[0], "available", "7-11pm");

    const row = await testDb.availability.findFirstOrThrow({ where: { teammateId: teammate.id } });
    expect(row.timeRange).toBe("7PM–11PM");
  });

  it("updateAvailability stores a blank range as all day", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await updateAvailability(teammate.id, DATES[0], "available", "   ");

    const row = await testDb.availability.findFirstOrThrow({ where: { teammateId: teammate.id } });
    expect(row.timeRange).toBeNull();
  });

  it("updateAvailability rejects a range it can't read", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await expect(
      updateAvailability(teammate.id, DATES[0], "available", "whenever"),
    ).rejects.toThrow(/time range/i);
  });

  it("ignores an unreadable range when the status isn't Available", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await updateAvailability(teammate.id, DATES[0], "tentative", "whenever");

    const row = await testDb.availability.findFirstOrThrow({ where: { teammateId: teammate.id } });
    expect(row.timeRange).toBeNull();
  });
});

describe("updateAvailabilityNote", () => {
  it("only lets a teammate note their own day", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: "someone-else" });

    await expect(updateAvailabilityNote(teammate.id, DATES[0], "late")).rejects.toThrow(
      "You can only edit your own availability.",
    );
  });

  it("adds a trimmed note to a day with no availability yet, leaving it Not set", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await updateAvailabilityNote(teammate.id, DATES[0], "  might be late  ");

    const row = await testDb.availability.findFirstOrThrow({ where: { teammateId: teammate.id } });
    expect(row.note).toBe("might be late");
    expect(row.status).toBe("not-set");
  });

  it("keeps the day's status and range when changing its note", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });
    await updateAvailability(teammate.id, DATES[0], "available", "6pm-11pm");

    await updateAvailabilityNote(teammate.id, DATES[0], "on mobile data");

    const row = await testDb.availability.findFirstOrThrow({ where: { teammateId: teammate.id } });
    expect(row).toMatchObject({ status: "available", timeRange: "6PM–11PM", note: "on mobile data" });
  });

  it("clears a blank note", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });
    await updateAvailabilityNote(teammate.id, DATES[0], "late");

    await updateAvailabilityNote(teammate.id, DATES[0], "   ");

    const row = await testDb.availability.findFirstOrThrow({ where: { teammateId: teammate.id } });
    expect(row.note).toBeNull();
  });

  it("rejects a note longer than 60 characters", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await expect(updateAvailabilityNote(teammate.id, DATES[0], "x".repeat(61))).rejects.toThrow(/60/);
  });

  it("keeps the note when the status changes", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });
    await updateAvailabilityNote(teammate.id, DATES[0], "late");

    await updateAvailability(teammate.id, DATES[0], "tentative", null);

    const row = await testDb.availability.findFirstOrThrow({ where: { teammateId: teammate.id } });
    expect(row.note).toBe("late");
  });
});

describe("setWeeklyDefaults", () => {
  it("only lets a teammate set their own defaults", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: "someone-else" });

    await expect(setWeeklyDefaults(teammate.id, [{ dayOfWeek: 1, status: "available", timeRange: null }])).rejects.toThrow(
      "You can only edit your own availability.",
    );
  });

  it("replaces all defaults, canonicalizing ranges and dropping Not set days", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });
    await setWeeklyDefaults(teammate.id, [{ dayOfWeek: 0, status: "unavailable", timeRange: null }]);

    await setWeeklyDefaults(teammate.id, [
      { dayOfWeek: 1, status: "available", timeRange: "7-11pm" },
      { dayOfWeek: 3, status: "tentative", timeRange: "ignored" },
      { dayOfWeek: 5, status: "not-set", timeRange: null },
    ]);

    const rows = await testDb.weeklyDefault.findMany({ where: { teammateId: teammate.id }, orderBy: { dayOfWeek: "asc" } });
    expect(rows.map((r) => [r.dayOfWeek, r.status, r.timeRange])).toEqual([
      [1, "available", "7PM–11PM"],
      [3, "tentative", null],
    ]);
  });

  it("rejects an unreadable range without changing anything", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });
    await setWeeklyDefaults(teammate.id, [{ dayOfWeek: 0, status: "unavailable", timeRange: null }]);

    await expect(
      setWeeklyDefaults(teammate.id, [{ dayOfWeek: 1, status: "available", timeRange: "whenever" }]),
    ).rejects.toThrow(/time range/i);

    expect(await testDb.weeklyDefault.count({ where: { teammateId: teammate.id } })).toBe(1);
  });

  it("rejects a day outside Monday (0) to Sunday (6)", async () => {
    const teammate = await makeTeammate();
    auth.mockResolvedValue({ teammateId: teammate.id });

    await expect(setWeeklyDefaults(teammate.id, [{ dayOfWeek: 7, status: "available", timeRange: null }])).rejects.toThrow(
      /day/i,
    );
  });
});
