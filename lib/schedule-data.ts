import { db as defaultDb } from "@/lib/db";
import { getLookaheadDates, isOnTeamDay, isSameDate } from "@/lib/dates";
import { mapForWeek } from "@/lib/week-schedule";
import type { Match as PrismaMatch, PrismaClient } from "@/lib/generated/prisma/client";
import type { AvailabilityStatus, DayAvailability, Match, Teammate, WeekMapInfo } from "@/lib/types";

/** How many calendar weeks ahead the schedule view shows by default. */
export const WEEKS_AHEAD = 4;

export interface ScheduleData {
  teamName: string;
  teamDivision: string;
  weekDates: Date[];
  teammates: Teammate[];
  matches: Match[];
  weekMaps: WeekMapInfo[];
  /**
   * The nearest upcoming Playoffs match, surfaced independently of `matches`
   * (which only carries the next 2 upcoming matches) since Playoffs may be
   * scheduled well beyond that slice or the lookahead window, but still
   * needs to render on the home page's weekly-maps panel.
   */
  playoffsMatch: Match | null;
}

/**
 * Loads the (single, for now) team's schedule for the `weekCount` calendar
 * weeks starting with the week containing `weekReference`. `today` is the
 * real current date, used to decide which matches count as "upcoming"
 * regardless of which week is being viewed.
 */
export async function getScheduleData(
  weekReference: Date,
  today: Date,
  db: PrismaClient = defaultDb,
  weekCount: number = WEEKS_AHEAD,
): Promise<ScheduleData | null> {
  const team = await db.team.findFirst({
    include: {
      teammates: {
        where: { active: true },
        include: { availability: true, weeklyDefaults: true, user: true },
        orderBy: { order: "asc" },
      },
      matches: { orderBy: { date: "asc" } },
      weekMaps: true,
    },
  });

  if (!team) return null;

  const weekDates = getLookaheadDates(weekReference, weekCount);

  const teammates: Teammate[] = team.teammates.map((t) => ({
    id: t.id,
    name: t.user.name ?? "Unknown",
    avatarUrl: t.user.image,
    week: weekDates.map((date): DayAvailability => {
      const record = t.availability.find((a) => isSameDate(a.date, date));
      const note = record?.note ?? undefined;
      if (record && record.status !== "not-set") {
        return { status: record.status as AvailabilityStatus, timeRange: record.timeRange ?? undefined, note };
      }
      const fallback = t.weeklyDefaults.find((d) => d.dayOfWeek === (date.getDay() + 6) % 7);
      if (fallback) {
        return {
          status: fallback.status as AvailabilityStatus,
          timeRange: fallback.timeRange ?? undefined,
          note,
          fromDefault: true,
        };
      }
      return { status: "not-set", note };
    }),
  }));

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const weekMaps: WeekMapInfo[] = team.weekMaps.map((w) => ({ weekStart: w.weekStart, map: w.map }));

  function toMatch(m: PrismaMatch): Match {
    return {
      id: m.id,
      date: m.date,
      isPlayoffs: m.isPlayoffs,
      map: m.isPlayoffs ? null : mapForWeek(weekMaps, m.date),
      availabilityCollected: weekDates.some((d) => isOnTeamDay(m.date, d)),
    };
  }

  const upcoming = team.matches.filter((m) => m.date >= startOfToday);
  const upcomingMatches = upcoming.slice(0, 2).map(toMatch);
  const upcomingPlayoffs = upcoming.find((m) => m.isPlayoffs);

  return {
    teamName: team.name,
    teamDivision: team.division,
    weekDates,
    teammates,
    matches: upcomingMatches,
    weekMaps,
    playoffsMatch: upcomingPlayoffs ? toMatch(upcomingPlayoffs) : null,
  };
}
