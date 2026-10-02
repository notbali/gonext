import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AccessGate } from "@/components/AccessGate";
import { PageContainer } from "@/components/PageContainer";
import { MatchEditor } from "@/components/MatchEditor";
import { CreateMatchForm } from "@/components/CreateMatchForm";
import { CalendarSubscribeCard } from "@/components/CalendarSubscribeCard";
import { MatchResultPicker } from "@/components/MatchResultPicker";
import { RecordCard } from "@/components/RecordCard";
import { BestTimesCard } from "@/components/BestTimesCard";
import { suggestMatchTimes } from "@/lib/best-times";
import { getScheduleData, WEEKS_AHEAD } from "@/lib/schedule-data";
import { summarizeRecord, type MatchResultValue } from "@/lib/match-record";
import { WeekMapEditor } from "@/components/WeekMapEditor";
import { chunkIntoWeeks, getEasternParts, getLookaheadDates, matchDateLine, nowInTeamTimezone } from "@/lib/dates";
import { getSeason, isHalloweenNight, type Season } from "@/lib/season";
import { HalloweenBadge } from "@/components/MatchesCard";
import { mapForWeek } from "@/lib/week-schedule";
import { createMatch, setWeekMap } from "@/app/matches/actions";

type MatchRow = {
  id: string;
  date: Date;
  isPlayoffs: boolean;
  map: string | null;
  result: MatchResultValue | null;
};

function MatchList({
  title,
  matches,
  isCoach,
  showResults = false,
  season,
}: {
  title: string;
  matches: MatchRow[];
  isCoach: boolean;
  showResults?: boolean;
  season: Season;
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
              <div>
                <p
                  className={`text-body-lg font-semibold ${m.isPlayoffs ? "text-warning" : "text-text-primary"}`}
                >
                  {matchDateLine(m, label)}
                </p>
                {season === "halloween" && isHalloweenNight(m.date) && <HalloweenBadge />}
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {showResults && <MatchResultPicker matchId={m.id} result={m.result} canEdit={isCoach} />}
                {isCoach && (
                  <MatchEditor matchId={m.id} date={m.date} isPlayoffs={m.isPlayoffs} map={m.map} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Whether `date` falls in October of `now`'s year, by the Eastern calendar. */
function isThisOctober(date: Date, now: Date): boolean {
  const p = getEasternParts(date);
  return p.month === 9 && p.year === getEasternParts(now).year;
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
  const season = getSeason(now);
  const weekMaps = team.weekMaps.map((w) => ({ weekStart: w.weekStart, map: w.map }));
  const toRow = (m: (typeof team.matches)[number]): MatchRow => ({
    id: m.id,
    date: m.date,
    isPlayoffs: m.isPlayoffs,
    map: m.isPlayoffs ? null : mapForWeek(weekMaps, m.date),
    result: m.result,
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

  // Two weeks is far enough ahead for a Premier schedule; beyond that little is set.
  const today = nowInTeamTimezone();
  const schedule = isCoach ? await getScheduleData(today, now, db, 2) : null;
  const suggestions = schedule ? suggestMatchTimes(schedule.teammates, schedule.weekDates, today) : [];

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
        <MatchList title="Upcoming" matches={upcoming} isCoach={isCoach} season={season} />
      ) : (
        <p className="mt-6 text-body text-text-muted">No upcoming matches scheduled.</p>
      )}
      {past.length > 0 && <MatchList title="Past" matches={past} isCoach={isCoach} showResults season={season} />}
      <RecordCard
        record={summarizeRecord(past)}
        october={season === "halloween" ? summarizeRecord(past.filter((m) => isThisOctober(m.date, now))) : undefined}
      />

      <CalendarSubscribeCard feedUrl={feedUrl} />

      {isCoach && <BestTimesCard suggestions={suggestions} />}
      {isCoach && <CreateMatchForm action={createMatch} />}
      {isCoach && <WeekMapEditor weeks={weeks} action={setWeekMap} />}
    </PageContainer>
  );
}
