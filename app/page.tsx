import { auth } from "@/auth";
import { TopNav } from "@/components/TopNav";
import { AccessGate } from "@/components/AccessGate";
import { PageHeader } from "@/components/PageHeader";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { LegendCard } from "@/components/LegendCard";
import { MatchesCard } from "@/components/MatchesCard";
import { getScheduleData } from "@/lib/schedule-data";
import { addWeeks } from "@/lib/dates";

function parseWeekOffset(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) ? n : 0;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekOffset = parseWeekOffset(week);
  const today = new Date();
  const weekReference = addWeeks(today, weekOffset);
  const [session, schedule] = await Promise.all([auth(), getScheduleData(weekReference, today)]);

  if (!schedule) {
    return (
      <div className="flex min-h-screen items-center justify-center text-body text-text-muted">
        No team has been seeded yet — run{" "}
        <code className="mx-1 rounded bg-surface px-1.5 py-0.5">npx prisma db seed</code>.
      </div>
    );
  }

  const nav = (
    <TopNav
      active="schedule"
      teamDivision={schedule.teamDivision}
      isSignedIn={Boolean(session?.user)}
      userName={session?.user?.name}
      userImage={session?.user?.image}
    />
  );

  if (!session?.teammateId) {
    return (
      <div className="min-h-screen bg-bg">
        {nav}
        <AccessGate isSignedIn={Boolean(session?.user)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {nav}
      <PageHeader weekDates={schedule.weekDates} weekOffset={weekOffset} />
      <div className="flex gap-6 px-8 py-6">
        <AvailabilityGrid
          weekDates={schedule.weekDates}
          teammates={schedule.teammates}
          matches={schedule.matches}
          myTeammateId={session?.teammateId}
        />
        <div className="flex w-[340px] shrink-0 flex-col gap-4">
          <LegendCard />
          <MatchesCard
            matches={schedule.matches}
            teammates={schedule.teammates}
            weekDates={schedule.weekDates}
            today={today}
          />
        </div>
      </div>
    </div>
  );
}
