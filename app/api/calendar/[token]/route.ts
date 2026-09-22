import { db } from "@/lib/db";
import { buildMatchCalendar } from "@/lib/ics";
import { mapForWeek } from "@/lib/week-schedule";

export const dynamic = "force-dynamic";

/** The team's matches as a subscribable calendar; the token is Team.calendarToken. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const team = await db.team.findUnique({
    where: { calendarToken: token },
    include: { matches: { orderBy: { date: "asc" } }, weekMaps: true },
  });
  if (!team) return new Response("Not found", { status: 404 });

  const weekMaps = team.weekMaps.map((w) => ({ weekStart: w.weekStart, map: w.map }));
  const ics = buildMatchCalendar(
    team.name,
    team.matches.map((m) => ({
      id: m.id,
      date: m.date,
      label: m.isPlayoffs ? "PLAYOFFS" : (mapForWeek(weekMaps, m.date) ?? "MAP TBD"),
    })),
    new Date(),
  );

  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'inline; filename="premier.ics"',
      "cache-control": "no-store",
    },
  });
}
