import { auth } from "@/auth";
import { AccessGate } from "@/components/AccessGate";
import { PageHeader } from "@/components/PageHeader";
import { ScheduleLayout } from "@/components/ScheduleLayout";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { LegendCard } from "@/components/LegendCard";
import { MatchesCard } from "@/components/MatchesCard";
import { getScheduleData, WEEKS_AHEAD } from "@/lib/schedule-data";
import { addWeeks, nowInTeamTimezone, parseWeekOffset } from "@/lib/dates";
import { db } from "@/lib/db";
import type { AvailabilityStatus } from "@/lib/types";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekOffset = parseWeekOffset(week, WEEKS_AHEAD);
  const today = new Date();
  const weekReference = addWeeks(nowInTeamTimezone(), weekOffset);
  const [session, schedule] = await Promise.all([auth(), getScheduleData(weekReference, today)]);

  if (!schedule) {
    return (
      <div className="flex min-h-screen items-center justify-center text-body text-text-muted">
        No team has been seeded yet — run{" "}
        <code className="mx-1 rounded bg-surface px-1.5 py-0.5">npx prisma db seed</code>.
      </div>
    );
  }

  if (!session?.teammateId) {
    return <AccessGate isSignedIn={Boolean(session?.user)} />;
  }

  const myDefaults = (
    await db.weeklyDefault.findMany({ where: { teammateId: session.teammateId } })
  ).map((d) => ({ dayOfWeek: d.dayOfWeek, status: d.status as AvailabilityStatus, timeRange: d.timeRange }));

  return (
    <div className="min-h-dvh bg-bg">
      <PageHeader
        weekDates={schedule.weekDates}
        weekOffset={weekOffset}
        weekCount={WEEKS_AHEAD}
        myTeammateId={session.teammateId}
        myDefaults={myDefaults}
      />
      <ScheduleLayout
        sidebar={
          <>
            <LegendCard />
            <MatchesCard
              matches={schedule.matches}
              teammates={schedule.teammates}
              weekDates={schedule.weekDates}
              today={today}
            />
          </>
        }
      >
        <AvailabilityGrid
          weekDates={schedule.weekDates}
          teammates={schedule.teammates}
          matches={schedule.matches}
          myTeammateId={session?.teammateId}
          weekMaps={schedule.weekMaps}
        />
      </ScheduleLayout>
    </div>
  );
}
