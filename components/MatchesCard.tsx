import Link from "next/link";
import type { Match, Teammate } from "@/lib/types";
import { countdownLabel, matchDateLine } from "@/lib/dates";
import { LiveCountdown } from "@/components/LiveCountdown";
import { LocalMatchTime } from "@/components/LocalMatchTime";
import { getConfirmedTeammates } from "@/lib/matches";
import { Avatar } from "@/components/Avatar";
import { GridReveal } from "@/components/GridReveal";
import { MATCH_READY_THRESHOLD } from "@/lib/schedule-column-state";
import { isHalloweenNight, type Season } from "@/lib/season";

const ENTRANCE_STAGGER_MS = 70;

function MatchItem({
  match,
  teammates,
  weekDates,
  today,
  index,
  isNext,
  season,
}: {
  match: Match;
  teammates: Teammate[];
  weekDates: Date[];
  today: Date;
  index: number;
  isNext: boolean;
  season: Season;
}) {
  const isThisWeek = match.availabilityCollected;
  const confirmed = isThisWeek ? getConfirmedTeammates(match, teammates, weekDates) : [];
  const label = match.isPlayoffs ? "PLAYOFFS" : (match.map ?? "MAP TBD");
  const playersShort = MATCH_READY_THRESHOLD - confirmed.length;

  return (
    <div
      data-testid="match-card"
      data-reveal
      data-playoffs={match.isPlayoffs ? "" : undefined}
      style={{ transitionDelay: `${index * ENTRANCE_STAGGER_MS}ms` }}
      className={`relative border-t border-border py-4 pl-3 first:border-t-0 ${isNext ? "accent-wipe" : ""} ${
        match.isPlayoffs ? "playoffs-glow" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-body-lg font-semibold ${match.isPlayoffs ? "text-warning" : "text-text-primary"}`}
        >
          {matchDateLine(match, label)}
        </p>
        {isThisWeek ? (
          <LiveCountdown date={match.date} now={today} />
        ) : (
          <span
            data-testid="match-countdown"
            className="shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-text-dim"
          >
            {countdownLabel(match.date, today, weekDates)}
          </span>
        )}
      </div>
      <LocalMatchTime date={match.date} className="mt-1" />
      {season === "halloween" && isHalloweenNight(match.date) && <HalloweenBadge />}

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
          {playersShort > 0 && (
            <span
              data-testid="match-short"
              className="ml-auto shrink-0 font-mono text-caption font-semibold uppercase tracking-wide text-warning"
            >
              Need {playersShort} more
            </span>
          )}
        </div>
      ) : (
        <p className="mt-3 font-mono text-caption uppercase tracking-wide text-text-dim">
          Availability not collected yet
        </p>
      )}
    </div>
  );
}

export function HalloweenBadge() {
  return (
    <span
      data-testid="halloween-badge"
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-dim px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-brand-bright"
    >
      🎃 Halloween night
    </span>
  );
}

export function MatchesCard({
  matches,
  teammates,
  weekDates,
  today,
  season = null,
}: {
  matches: Match[];
  teammates: Teammate[];
  weekDates: Date[];
  today: Date;
  season?: Season;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
          Premier matches
        </p>
        <Link
          href="/matches"
          className="tap-target font-mono text-[11px] font-semibold uppercase tracking-wider text-text-dim transition-colors duration-[var(--d-micro)] hover:text-text-muted"
        >
          View all
        </Link>
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
              season={season}
            />
          ))}
        </div>
      </GridReveal>
    </div>
  );
}
