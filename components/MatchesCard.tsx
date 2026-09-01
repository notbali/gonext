import type { Match, Teammate } from "@/lib/types";
import { countdownLabel, matchDateLine } from "@/lib/dates";
import { getConfirmedTeammates } from "@/lib/mock-data";

function MatchItem({
  match,
  teammates,
  weekDates,
  today,
}: {
  match: Match;
  teammates: Teammate[];
  weekDates: Date[];
  today: Date;
}) {
  const countdown = countdownLabel(match.date, today, weekDates);
  const isThisWeek = match.availabilityCollected;
  const confirmed = isThisWeek ? getConfirmedTeammates(match, teammates, weekDates) : [];

  return (
    <div className="border-t border-border py-4 first:border-t-0">
      <div className="flex items-center justify-between">
        <p className="text-body-lg font-semibold text-text-primary">vs {match.opponent}</p>
        <span
          className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${
            isThisWeek ? "bg-brand-dim text-brand-bright" : "border border-border text-text-dim"
          }`}
        >
          {countdown}
        </span>
      </div>
      <p className="mt-1 font-mono text-caption text-text-muted">{matchDateLine(match)}</p>

      {isThisWeek ? (
        <div className="mt-3 flex items-center gap-2">
          {teammates.map((t) => {
            const isConfirmed = confirmed.some((c) => c.id === t.id);
            return (
              <div
                key={t.id}
                className={`flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px] font-bold ${
                  isConfirmed
                    ? "border-primary/40 bg-primary-dim text-primary-bright"
                    : "border-border text-text-dim"
                }`}
              >
                {t.initials}
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
      <div>
        {matches.map((match) => (
          <MatchItem
            key={match.id}
            match={match}
            teammates={teammates}
            weekDates={weekDates}
            today={today}
          />
        ))}
      </div>
    </div>
  );
}
