import { db } from "@/lib/db";
import { getWeekDates, isSameDate } from "@/lib/dates";
import type { AvailabilityStatus, DayAvailability, Match, Teammate } from "@/lib/types";

export interface ScheduleData {
  teamName: string;
  teamDivision: string;
  weekDates: Date[];
  teammates: Teammate[];
  matches: Match[];
}

/**
 * Loads the (single, for now) team's schedule for the calendar week containing
 * `weekReference`. `today` is the real current date, used to decide which
 * matches count as "upcoming" regardless of which week is being viewed.
 */
export async function getScheduleData(weekReference: Date, today: Date): Promise<ScheduleData | null> {
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

  const weekDates = getWeekDates(weekReference);

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
