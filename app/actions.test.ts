import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestDb, testDb } from "../tests/test-db";

vi.mock("@/lib/db", () => ({ db: testDb }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const { setWeekAvailability } = await import("./actions");
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
    expect(rows.every((r) => r.status === "available" && r.timeRange === "6pm-9pm")).toBe(true);
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
