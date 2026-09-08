import { db as defaultDb } from "@/lib/db";
import { getLookaheadDates, isSameDate } from "@/lib/dates";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { AvailabilityStatus, DayAvailability, Match, Teammate } from "@/lib/types";

/** How many calendar weeks ahead the schedule view shows by default. */
export const WEEKS_AHEAD = 4;

export interface ScheduleData {
  teamName: string;
  teamDivision: string;
  weekDates: Date[];
  teammates: Teammate[];
  matches: Match[];
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
        include: { availability: true, user: true },
        orderBy: { order: "asc" },
      },
      matches: { orderBy: { date: "asc" } },
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
      if (!record) return { status: "not-set" };
      return {
        status: record.status as AvailabilityStatus,
        timeRange: record.timeRange ?? undefined,
      };
    }),
  }));

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const upcomingMatches: Match[] = team.matches
    .filter((m) => m.date >= startOfToday)
    .slice(0, 2)
    .map((m) => ({
      id: m.id,
      date: m.date,
      group: m.group,
      availabilityCollected: weekDates.some((d) => isSameDate(d, m.date)),
    }));

  return {
    teamName: team.name,
    teamDivision: team.division,
    weekDates,
    teammates,
    matches: upcomingMatches,
  };
}
