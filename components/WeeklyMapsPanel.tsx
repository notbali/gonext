import { dateRangeLabel, matchDateLine } from "@/lib/dates";
import type { Match } from "@/lib/types";

/**
 * Replaces the old agent-cascade showcase: each upcoming week is a flex box
 * showing its date range, revealing the map Riot assigned that week on hover.
 * The season's Playoffs match, if one is scheduled, gets its own distinct,
 * always-visible entry above the weeks.
 */
export function WeeklyMapsPanel({
  weeks,
  playoffsMatch,
}: {
  weeks: { weekDates: Date[]; map: string | null }[];
  playoffsMatch: Match | null;
}) {
  return (
    <div
      data-testid="weekly-maps-panel"
      className="flex w-full shrink-0 flex-col gap-2 rounded-lg border border-border bg-surface p-4"
    >
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
        Weekly maps
      </p>

      {playoffsMatch && (
        <div
          data-testid="weekly-maps-playoffs"
          className="playoffs-glow flex items-center justify-between rounded-md border border-warning/40 bg-warning-dim px-3 py-2"
        >
          <span className="font-mono text-caption font-bold uppercase tracking-wide text-warning">
            PLAYOFFS
          </span>
          <span className="font-mono text-[11px] text-warning">
            {matchDateLine(playoffsMatch, "PLAYOFFS").split(" · ")[0]}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {weeks.map(({ weekDates, map }) => (
          <div
            key={weekDates[0].toISOString()}
            data-testid="weekly-maps-week"
            className="group flex items-center justify-between overflow-hidden rounded-md border border-border bg-surface-raised px-3 py-2"
          >
            <span className="font-mono text-caption text-text-dim">{dateRangeLabel(weekDates)}</span>
            <span className="font-mono text-caption font-semibold uppercase tracking-wide text-brand-bright opacity-0 transition-opacity duration-[var(--d-ui)] group-hover:opacity-100">
              {map ?? "MAP TBD"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
