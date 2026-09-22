import { describe, expect, it } from "vitest";
import { buildMatchCalendar } from "./ics";

const match = (id: string, iso: string, label: string) => ({ id, date: new Date(iso), label });

describe("buildMatchCalendar", () => {
  const ics = buildMatchCalendar("GO//NEXT", [match("m1", "2026-09-23T00:00:00.000Z", "ASCENT")], new Date("2026-09-20T12:00:00Z"));
  const lines = ics.split("\r\n");

  it("is a CRLF-delimited VCALENDAR", () => {
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("names the calendar after the team", () => {
    expect(lines).toContain("X-WR-CALNAME:GO//NEXT Premier");
  });

  it("adds one event per match with a stable UID and UTC start/end", () => {
    expect(lines.filter((l) => l === "BEGIN:VEVENT")).toHaveLength(1);
    expect(lines).toContain("UID:match-m1@gonext");
    expect(lines).toContain("DTSTART:20260923T000000Z");
    expect(lines).toContain("DTEND:20260923T013000Z");
    expect(lines).toContain("DTSTAMP:20260920T120000Z");
    expect(lines).toContain("SUMMARY:Premier — ASCENT");
  });

  it("escapes commas, semicolons and backslashes in text", () => {
    const out = buildMatchCalendar("A, B; C\\D", [], new Date("2026-09-20T12:00:00Z"));
    expect(out).toContain("X-WR-CALNAME:A\\, B\; C\\\\D Premier");
  });

  it("is a valid empty calendar with no matches", () => {
    const out = buildMatchCalendar("GO//NEXT", [], new Date());
    expect(out).not.toContain("BEGIN:VEVENT");
    expect(out).toContain("END:VCALENDAR");
  });
});
