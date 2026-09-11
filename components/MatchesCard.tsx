import type { Match, Teammate } from "@/lib/types";
import { countdownLabel, matchDateLine, minutesUntil } from "@/lib/dates";
import { getConfirmedTeammates } from "@/lib/matches";
import { Avatar } from "@/components/Avatar";
import { GridReveal } from "@/components/GridReveal";

const ENTRANCE_STAGGER_MS = 70;
const URGENCY_WINDOW_MINUTES = 60;

function MatchItem({
  match,
  teammates,
  weekDates,
  today,
  index,
  isNext,
}: {
  match: Match;
  teammates: Teammate[];
  weekDates: Date[];
  today: Date;
  index: number;
  isNext: boolean;
}) {
  const countdown = countdownLabel(match.date, today, weekDates);
  const isThisWeek = match.availabilityCollected;
  const confirmed = isThisWeek ? getConfirmedTeammates(match, teammates, weekDates) : [];
  const minutesOut = minutesUntil(match.date, today);
  const isUrgent = minutesOut >= 0 && minutesOut <= URGENCY_WINDOW_MINUTES;

  return (
    <div
      data-testid="match-card"
      data-reveal
      style={{ transitionDelay: `${index * ENTRANCE_STAGGER_MS}ms` }}
      className={`relative border-t border-border py-4 pl-3 first:border-t-0 ${isNext ? "accent-wipe" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-lg font-semibold text-text-primary">{matchDateLine(match)}</p>
        <span
          data-testid="match-countdown"
          data-urgent={isUrgent ? "" : undefined}
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${
            isThisWeek ? "bg-brand-dim text-brand-bright" : "border border-border text-text-dim"
          } ${isUrgent ? "urgency-breathe" : ""}`}
        >
          {countdown}
        </span>
      </div>

      {isThisWeek ? (
        <div className="mt-3 flex items-center gap-2">
          {teammates.map((t) => {
            const isConfirmed = confirmed.some((c) => c.id === t.id);
            return (
              <div
                key={t.id}
                className={`rounded-full ring-2 ${
                  isConfirmed ? "ring-primary/60" : "ring-transparent grayscale opacity-50"
                }`}
              >
                <Avatar name={t.name} src={t.avatarUrl} size={22} />
              </div>
            );
          })}
          <span className="ml-1 font-mono text-caption font-semibold uppercase tracking-wide text-text-muted">
            {confirmed.length}/{teammates.length} confirmed
          </span>
        </div>
      ) : (
        <p className="mt-3 font-mono text-caption uppercase tracking-wide text-text-dim">
          Availability not collected yet
        </p>
      )}
    </div>
  );
}

export function MatchesCard({
  matches,
  teammates,
  weekDates,
  today,
}: {
  matches: Match[];
  teammates: Teammate[];
  weekDates: Date[];
  today: Date;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
          Premier matches
        </p>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-dim">
          View all
        </span>
      </div>
      <GridReveal>
        <div>
          {matches.map((match, index) => (
            <MatchItem
              key={match.id}
              match={match}
              teammates={teammates}
              weekDates={weekDates}
              today={today}
              index={index}
              isNext={index === 0}
            />
          ))}
        </div>
      </GridReveal>
    </div>
  );
}
