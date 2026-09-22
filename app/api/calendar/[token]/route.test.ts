import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestDb, testDb } from "../../../../tests/test-db";

vi.mock("@/lib/db", () => ({ db: testDb }));

const { GET } = await import("./route");

beforeEach(async () => {
  await resetTestDb();
});

function get(token: string) {
  return GET(new Request(`https://site/api/calendar/${token}`), { params: Promise.resolve({ token }) });
}

describe("GET /api/calendar/[token]", () => {
  it("404s an unknown token", async () => {
    await testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
    const res = await get("nope");
    expect(res.status).toBe(404);
  });

  it("serves the team's matches as text/calendar, labelled by week map or Playoffs", async () => {
    const team = await testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
    await testDb.weekMap.create({ data: { teamId: team.id, weekStart: new Date(2026, 8, 21), map: "LOTUS" } });
    await testDb.match.create({ data: { teamId: team.id, date: new Date("2026-09-23T00:00:00Z") } });
    await testDb.match.create({ data: { teamId: team.id, date: new Date("2026-10-10T00:00:00Z"), isPlayoffs: true } });

    const res = await get(team.calendarToken);
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/calendar/);
    expect(body).toContain("SUMMARY:Premier — LOTUS");
    expect(body).toContain("SUMMARY:Premier — PLAYOFFS");
  });

  it("does not accept the invite token", async () => {
    const team = await testDb.team.create({ data: { name: "GO//NEXT", division: "DIV 2" } });
    const res = await get(team.inviteToken);
    expect(res.status).toBe(404);
  });
});
