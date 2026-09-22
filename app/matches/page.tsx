import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AccessGate } from "@/components/AccessGate";
import { PageContainer } from "@/components/PageContainer";
import { MatchEditor } from "@/components/MatchEditor";
import { CreateMatchForm } from "@/components/CreateMatchForm";
import { CalendarSubscribeCard } from "@/components/CalendarSubscribeCard";
import { WeekMapEditor } from "@/components/WeekMapEditor";
import { chunkIntoWeeks, getLookaheadDates, matchDateLine, nowInTeamTimezone } from "@/lib/dates";
import { mapForWeek } from "@/lib/week-schedule";
import { WEEKS_AHEAD } from "@/lib/schedule-data";
import { createMatch, setWeekMap } from "@/app/matches/actions";

type MatchRow = { id: string; date: Date; isPlayoffs: boolean; map: string | null };

function MatchList({
  title,
  matches,
  isCoach,
}: {
  title: string;
  matches: MatchRow[];
  isCoach: boolean;
}) {
  return (
    <div className="mt-6">
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
        {title}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {matches.map((m) => {
          const label = m.isPlayoffs ? "PLAYOFFS" : (m.map ?? "MAP TBD");
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
            >
              <p
                className={`text-body-lg font-semibold ${m.isPlayoffs ? "text-warning" : "text-text-primary"}`}
              >
                {matchDateLine(m, label)}
              </p>
              {isCoach && (
                <MatchEditor matchId={m.id} date={m.date} isPlayoffs={m.isPlayoffs} map={m.map} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function MatchesPage() {
  const session = await auth();

  const team = await db.team.findFirst({
    include: { matches: { orderBy: { date: "asc" } }, weekMaps: true },
  });

  if (!team) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-body text-text-muted">
        No team has been seeded yet.
      </div>
    );
  }

  const isCoach = session?.isCoach ?? false;
  const now = new Date();
  const weekMaps = team.weekMaps.map((w) => ({ weekStart: w.weekStart, map: w.map }));
  const toRow = (m: (typeof team.matches)[number]): MatchRow => ({
    id: m.id,
    date: m.date,
    isPlayoffs: m.isPlayoffs,
    map: m.isPlayoffs ? null : mapForWeek(weekMaps, m.date),
  });
  const upcoming = team.matches.filter((m) => m.date >= now).map(toRow);
  const past = team.matches
    .filter((m) => m.date < now)
    .reverse()
    .map(toRow);

  if (!session?.teammateId) {
    return <AccessGate isSignedIn={Boolean(session?.user)} />;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
  const feedUrl = `${proto}://${host}/api/calendar/${team.calendarToken}`;

  const weeks = chunkIntoWeeks(getLookaheadDates(nowInTeamTimezone(), WEEKS_AHEAD)).map((weekDates) => ({
    weekDates,
    map: mapForWeek(weekMaps, weekDates[0]),
  }));

  return (
    <PageContainer>
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
        Matches
      </p>
      <h1 className="mt-1 text-title font-bold text-text-primary">{team.name}</h1>

      {upcoming.length > 0 ? (
        <MatchList title="Upcoming" matches={upcoming} isCoach={isCoach} />
      ) : (
        <p className="mt-6 text-body text-text-muted">No upcoming matches scheduled.</p>
      )}
      {past.length > 0 && <MatchList title="Past" matches={past} isCoach={isCoach} />}

      <CalendarSubscribeCard feedUrl={feedUrl} />

      {isCoach && <CreateMatchForm action={createMatch} />}
      {isCoach && <WeekMapEditor weeks={weeks} action={setWeekMap} />}
    </PageContainer>
  );
}
