import Image from "next/image";
import { dateRangeLabel, matchDateLine } from "@/lib/dates";
import { mapImageSrc } from "@/lib/valorant-maps";
import type { Match } from "@/lib/types";

/**
 * Replaces the old agent-cascade showcase: each upcoming week is a box
 * showing its date range, revealing that week's assigned map artwork on
 * hover. The season's Playoffs match, if one is scheduled, gets its own
 * entry above the weeks, revealing a PLAYOFFS callout on hover instead.
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
          className="playoffs-glow group relative flex h-20 items-center justify-between overflow-hidden rounded-md border border-warning/40 bg-warning-dim px-3 py-2"
        >
          <span className="font-mono text-caption text-warning">
            {matchDateLine(playoffsMatch, "PLAYOFFS").split(" · ")[0]}
          </span>
          <div
            data-testid="weekly-maps-playoffs-reveal"
            className="absolute inset-0 flex items-center justify-center bg-warning-dim opacity-0 transition-opacity duration-[var(--d-ui)] group-hover:opacity-100"
          >
            <span className="font-mono text-body-lg font-bold uppercase tracking-widest text-warning">
              PLAYOFFS
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {weeks.map(({ weekDates, map }) => {
          const src = map ? mapImageSrc(map) : null;
          return (
            <div
              key={weekDates[0].toISOString()}
              data-testid="weekly-maps-week"
              className="group relative flex h-20 items-center justify-between overflow-hidden rounded-md border border-border bg-surface-raised px-3 py-2"
            >
              <span className="font-mono text-caption text-text-dim">{dateRangeLabel(weekDates)}</span>
              <div
                data-testid="weekly-maps-reveal"
                className="absolute inset-0 flex items-center justify-center bg-surface-raised opacity-0 transition-opacity duration-[var(--d-ui)] group-hover:opacity-100"
              >
                {src ? (
                  <Image src={src} alt={map!} fill sizes="300px" className="object-cover" />
                ) : (
                  <span className="font-mono text-caption font-semibold uppercase tracking-wide text-text-dim">
                    MAP TBD
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
