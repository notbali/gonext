import { getWeekStart, isSameDate } from "./dates";
import type { ValorantMap } from "@/lib/generated/prisma/client";

/**
 * Riot's Premier schedule, one entry per Stage. Days and maps are the same in every
 * zone — only the queue times differ, and those live on each Match a Coach creates —
 * so the schedule is kept here rather than entered per team.
 *
 * To add a stage, copy Riot's announcement into one more `stage(...)` call: each week is
 * [map, first queue day, last queue day], then the Playoffs day. Dates are the team's
 * Eastern calendar, "YYYY-MM-DD". A new map also needs a line in valorant-maps.ts.
 */
const STAGES: PremierStage[] = [
  stage(
    "V26A6",
    [
      ["BIND", "2026-10-21", "2026-10-25"],
      ["CORRODE", "2026-10-28", "2026-11-01"],
      ["SUNSET", "2026-11-04", "2026-11-08"],
      ["HAVEN", "2026-11-11", "2026-11-15"],
      ["SUMMIT", "2026-11-18", "2026-11-22"],
      ["ABYSS", "2026-11-25", "2026-11-29"],
      ["LOTUS", "2026-12-02", "2026-12-05"],
    ],
    "2026-12-06",
  ),
];

export interface StageWeek {
  /** The Stage's name, e.g. "V26A6". */
  stage: string;
  /** 1-based, as Riot numbers them ("WEEK 3"). */
  number: number;
  map: ValorantMap;
  /** Monday 00:00 of the calendar week, team-local — matches getWeekStart. */
  weekStart: Date;
  /** First and last days Riot opens queue windows that week. */
  queueStart: Date;
  queueEnd: Date;
}

export interface PremierStage {
  name: string;
  weeks: StageWeek[];
  playoffs: Date;
}

export const PREMIER_STAGES: readonly PremierStage[] = STAGES;

function day(iso: string): Date {
  const [year, month, date] = iso.split("-").map(Number);
  return new Date(year, month - 1, date);
}

function stage(name: string, weeks: [ValorantMap, string, string][], playoffs: string): PremierStage {
  return {
    name,
    weeks: weeks.map(([map, start, end], i) => ({
      stage: name,
      number: i + 1,
      map,
      weekStart: getWeekStart(day(start)),
      queueStart: day(start),
      queueEnd: day(end),
    })),
    playoffs: day(playoffs),
  };
}

/** The Stage week whose Monday–Sunday contains `date`, or null outside every Stage. */
export function stageWeekFor(date: Date): StageWeek | null {
  const weekStart = getWeekStart(date);
  for (const s of STAGES) {
    const week = s.weeks.find((w) => isSameDate(w.weekStart, weekStart));
    if (week) return week;
  }
  return null;
}

/** Every Stage week from the one containing `today` onward, chronological. */
export function upcomingStageWeeks(today: Date): StageWeek[] {
  const thisWeek = getWeekStart(today);
  return STAGES.flatMap((s) => s.weeks).filter((w) => w.weekStart >= thisWeek);
}

/** The next Stage Playoffs on or after `today`, if one is scheduled. */
export function upcomingPlayoffs(today: Date): { stage: string; date: Date } | null {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const next = STAGES.find((s) => s.playoffs >= start);
  return next ? { stage: next.name, date: next.playoffs } : null;
}
