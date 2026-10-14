import { describe, expect, it } from "vitest";
import { getWeekStart, isSameDate } from "./dates";
import { PREMIER_STAGES, stageWeekFor, upcomingStageWeeks } from "./premier-stages";

describe("stageWeekFor", () => {
  it("finds the numbered week and map for a queue day", () => {
    expect(stageWeekFor(new Date(2026, 9, 23))).toMatchObject({ stage: "V26A6", number: 1, map: "BIND" });
  });

  it("covers the whole Monday–Sunday week, not just the queue days", () => {
    expect(stageWeekFor(new Date(2026, 9, 19))).toMatchObject({ number: 1, map: "BIND" }); // Mon before the Wed window
  });

  it("knows Summit is week 5", () => {
    expect(stageWeekFor(new Date(2026, 10, 18))).toMatchObject({ number: 5, map: "SUMMIT" });
  });

  it("puts Playoffs Sunday in week 7's calendar week", () => {
    expect(stageWeekFor(new Date(2026, 11, 6))).toMatchObject({ number: 7, map: "LOTUS" });
  });

  it("returns null outside every stage", () => {
    expect(stageWeekFor(new Date(2026, 9, 14))).toBeNull();
    expect(stageWeekFor(new Date(2026, 11, 8))).toBeNull();
  });
});

describe("upcomingStageWeeks", () => {
  it("lists every week of a stage that hasn't started yet", () => {
    expect(upcomingStageWeeks(new Date(2026, 9, 14)).map((w) => w.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps the current week and drops finished ones", () => {
    expect(upcomingStageWeeks(new Date(2026, 10, 18)).map((w) => w.number)).toEqual([5, 6, 7]);
  });

  it("is empty once every stage is over", () => {
    expect(upcomingStageWeeks(new Date(2027, 0, 4))).toEqual([]);
  });
});

describe("PREMIER_STAGES", () => {
  it.each(PREMIER_STAGES.map((s) => [s.name, s] as const))(
    "%s has consecutive, numbered weeks whose queue days sit inside them",
    (_, stage) => {
      stage.weeks.forEach((week, i) => {
        expect(week.number).toBe(i + 1);
        expect(week.weekStart.getDay()).toBe(1);
        expect(isSameDate(getWeekStart(week.queueStart), week.weekStart)).toBe(true);
        expect(isSameDate(getWeekStart(week.queueEnd), week.weekStart)).toBe(true);
        if (i > 0) {
          const gap = (week.weekStart.getTime() - stage.weeks[i - 1].weekStart.getTime()) / 86_400_000;
          expect(Math.round(gap)).toBe(7);
        }
      });
      expect(stage.playoffs > stage.weeks.at(-1)!.queueEnd).toBe(true);
    },
  );

  it("never overlaps one stage with another", () => {
    const starts = PREMIER_STAGES.flatMap((s) => s.weeks.map((w) => w.weekStart.getTime()));
    expect(new Set(starts).size).toBe(starts.length);
  });
});
