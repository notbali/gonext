import { TopNav } from "@/components/TopNav";
import { PageHeader } from "@/components/PageHeader";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { LegendCard } from "@/components/LegendCard";
import { MatchesCard } from "@/components/MatchesCard";
import { getWeekDates } from "@/lib/dates";
import { TEAMMATES, getMatches } from "@/lib/mock-data";

export default function SchedulePage() {
  const today = new Date();
  const weekDates = getWeekDates(today);
  const matches = getMatches(weekDates);

  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <PageHeader weekDates={weekDates} />
      <div className="flex gap-6 px-8 py-6">
        <AvailabilityGrid weekDates={weekDates} teammates={TEAMMATES} matches={matches} />
        <div className="flex w-[340px] shrink-0 flex-col gap-4">
          <LegendCard />
          <MatchesCard matches={matches} teammates={TEAMMATES} weekDates={weekDates} today={today} />
        </div>
      </div>
    </div>
  );
}
