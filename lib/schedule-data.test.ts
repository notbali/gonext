import { beforeEach, describe, expect, it } from "vitest";
import { resetTestDb, testDb } from "../tests/test-db";
import { getScheduleData, WEEKS_AHEAD } from "./schedule-data";

beforeEach(async () => {
  await resetTestDb();
});

async function makeTeam() {
  return testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
}

async function makeTeammate(teamId: string, name: string, order = 0) {
  const user = await testDb.user.create({ data: { name } });
  return testDb.teammate.create({ data: { teamId, userId: user.id, order } });
}

// Mon Aug 31 2026 is the start of the calendar week containing this reference.
const REFERENCE = new Date(2026, 8, 3, 12);
const TODAY = REFERENCE;

describe("getScheduleData", () => {
  it("spans WEEKS_AHEAD calendar weeks of dates by default", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.weekDates).toHaveLength(WEEKS_AHEAD * 7);
    expect(schedule!.weekDates[0].getDate()).toBe(31); // Mon Aug 31
    expect(schedule!.weekDates[0].getMonth()).toBe(7);
  });

  it("respects an explicit weekCount override", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb, 2);

    expect(schedule!.weekDates).toHaveLength(14);
  });

  it("places a teammate's availability at the matching day across later weeks", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice");
    // Third displayed week: Mon Sep 14 2026.
    const thirdWeekMonday = new Date(2026, 8, 14);
    await testDb.availability.create({
      data: {
        teammateId: alice.id,
        date: thirdWeekMonday,
        status: "available",
        timeRange: "6-9pm",
      },
    });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    const dayIndex = schedule!.weekDates.findIndex(
      (d) => d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 14,
    );
    expect(dayIndex).toBeGreaterThan(6); // not in the first displayed week
    expect(schedule!.teammates[0].week[dayIndex]).toMatchObject({
      status: "available",
      timeRange: "6-9pm",
    });
  });

  it("marks a match several weeks out as availability-collected, unlike a single-week view", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");
    // Third displayed week: falls outside a single-week view but inside the lookahead.
    await testDb.match.create({
      data: { teamId: team.id, date: new Date(2026, 8, 16, 19) },
    });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.matches).toHaveLength(1);
    expect(schedule!.matches[0].availabilityCollected).toBe(true);
  });

  it("does not mark a match beyond the lookahead range as availability-collected", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");
    await testDb.match.create({
      data: { teamId: team.id, date: new Date(2026, 10, 1, 19) }, // Nov 1, well past WEEKS_AHEAD
    });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.matches[0].availabilityCollected).toBe(false);
  });

  it("resolves a match's map from the WeekMap covering the week its date falls in", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");
    // Third displayed week: Mon Sep 14 2026.
    await testDb.weekMap.create({
      data: { teamId: team.id, weekStart: new Date(2026, 8, 14), map: "BIND" },
    });
    await testDb.match.create({
      data: { teamId: team.id, date: new Date(2026, 8, 16, 19) },
    });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.matches[0].map).toBe("BIND");
  });

  it("resolves a match's map to null when no WeekMap is set for its week", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");
    await testDb.match.create({
      data: { teamId: team.id, date: new Date(2026, 8, 16, 19) },
    });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.matches[0].map).toBeNull();
  });

  it("resolves a Playoffs match's map as null even when its week has a WeekMap", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");
    await testDb.weekMap.create({
      data: { teamId: team.id, weekStart: new Date(2026, 8, 14), map: "BIND" },
    });
    await testDb.match.create({
      data: { teamId: team.id, date: new Date(2026, 8, 16, 19), isPlayoffs: true },
    });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.matches[0]).toMatchObject({ isPlayoffs: true, map: null });
  });

  it("surfaces an upcoming Playoffs match separately even when it falls beyond the lookahead window", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");
    await testDb.match.create({
      data: { teamId: team.id, date: new Date(2026, 10, 1, 19), isPlayoffs: true }, // Nov 1, past WEEKS_AHEAD
    });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.playoffsMatch).toMatchObject({ isPlayoffs: true });
  });

  it("surfaces an upcoming Playoffs match separately even when two nearer matches fill the normal slice", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");
    await testDb.match.create({ data: { teamId: team.id, date: new Date(2026, 8, 8, 19) } });
    await testDb.match.create({ data: { teamId: team.id, date: new Date(2026, 8, 9, 19) } });
    await testDb.match.create({
      data: { teamId: team.id, date: new Date(2026, 8, 10, 19), isPlayoffs: true },
    });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.matches).toHaveLength(2);
    expect(schedule!.matches.some((m) => m.isPlayoffs)).toBe(false);
    expect(schedule!.playoffsMatch).toMatchObject({ isPlayoffs: true });
  });

  it("leaves playoffsMatch null when there is no upcoming Playoffs match", async () => {
    const team = await makeTeam();
    await makeTeammate(team.id, "Alice");
    await testDb.match.create({ data: { teamId: team.id, date: new Date(2026, 8, 8, 19) } });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.playoffsMatch).toBeNull();
  });
});

describe("getScheduleData notes", () => {
  it("carries a day's note through", async () => {
    const team = await makeTeam();
    const alice = await makeTeammate(team.id, "Alice");
    await testDb.availability.create({
      data: { teammateId: alice.id, date: new Date(2026, 7, 31), status: "tentative", note: "might be late" },
    });

    const schedule = await getScheduleData(REFERENCE, TODAY, testDb);

    expect(schedule!.teammates[0].week[0]).toEqual({ status: "tentative", note: "might be late" });
  });
});
