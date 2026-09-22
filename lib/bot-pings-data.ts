import { db as defaultDb } from "@/lib/db";
import { getEasternParts } from "@/lib/dates";
import { getScheduleData } from "@/lib/schedule-data";
import { buildDuePings, type BotPing } from "@/lib/bot-pings";
import type { PrismaClient } from "@/lib/generated/prisma/client";

/** This week plus next, so Sunday's reminder can see next week's gaps. */
const PING_WEEKS = 2;

/** Loads the team's schedule around `now` and returns the Discord pings due then. */
export async function loadDuePings(
  now: Date,
  siteUrl: string,
  db: PrismaClient = defaultDb,
): Promise<BotPing[]> {
  const p = getEasternParts(now);
  const weekReference = new Date(p.year, p.month, p.day, p.hours, p.minutes);
  const schedule = await getScheduleData(weekReference, now, db, PING_WEEKS);
  if (!schedule) return [];

  const links = await db.teammate.findMany({
    where: { id: { in: schedule.teammates.map((t) => t.id) } },
    select: {
      id: true,
      user: { select: { accounts: { where: { provider: "discord" }, select: { providerAccountId: true } } } },
    },
  });
  const discordIdOf = new Map(links.map((l) => [l.id, l.user.accounts[0]?.providerAccountId ?? null]));

  return buildDuePings({
    now,
    dates: schedule.weekDates,
    teammates: schedule.teammates.map((t) => ({ ...t, discordId: discordIdOf.get(t.id) ?? null })),
    matches: schedule.matches,
    siteUrl,
  });
}
