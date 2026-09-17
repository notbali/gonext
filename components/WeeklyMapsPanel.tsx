import Image from "next/image";
import { dateRangeLabel, matchDateLine } from "@/lib/dates";
import { mapImageSrc } from "@/lib/valorant-maps";
import type { Match } from "@/lib/types";

/**
 * Replaces the old agent-cascade showcase: each upcoming week is a box
 * showing its date range. Hovering a week morphs the calendar open above
 * that box — a grid-rows panel expands from 0 to reveal the week's map
 * artwork, pushing every week below it down, then collapses on mouse-out.
 * The season's Playoffs match, if one is scheduled, gets its own entry
 * above the weeks with the same reveal treatment, showing a PLAYOFFS
 * callout instead of artwork.
 */
export function WeeklyMapsPanel({
  weeks,
  playoffsMatch,
}: {
  weeks: { weekDates: Date[]; map: string | null }[];
  playoffsMatch: Match | null;
}) {
  const revealClass =
    "grid grid-rows-[0fr] overflow-hidden transition-[grid-template-rows] duration-[var(--d-state)] ease-[var(--e-out)] group-hover:grid-rows-[1fr]";

  return (
    <div
      data-testid="weekly-maps-panel"
      className="flex w-full shrink-0 flex-col gap-2 rounded-lg border border-border bg-surface p-4"
    >
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
        Weekly maps
      </p>

      {playoffsMatch && (
        <div data-testid="weekly-maps-playoffs" className="group flex flex-col">
          <div data-testid="weekly-maps-playoffs-reveal" className={revealClass}>
            <div className="overflow-hidden">
              <div className="playoffs-glow mb-2 flex h-28 items-center justify-center overflow-hidden rounded-md border border-warning/40 bg-warning-dim">
                <span className="font-mono text-body-lg font-bold uppercase tracking-widest text-warning">
                  PLAYOFFS
                </span>
              </div>
            </div>
          </div>
          <div
            data-testid="weekly-maps-playoffs-box"
            className="flex h-20 items-center justify-between rounded-md border border-warning/40 bg-warning-dim px-3 py-2"
          >
            <span className="font-mono text-caption text-warning">
              {matchDateLine(playoffsMatch, "PLAYOFFS").split(" · ")[0]}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {weeks.map(({ weekDates, map }) => {
          const src = map ? mapImageSrc(map) : null;
          return (
            <div key={weekDates[0].toISOString()} data-testid="weekly-maps-week" className="group flex flex-col">
              <div data-testid="weekly-maps-reveal" className={revealClass}>
                <div className="overflow-hidden">
                  <div className="relative mb-2 h-28 w-full overflow-hidden rounded-md bg-surface-raised">
                    {src ? (
                      <Image src={src} alt={map!} fill sizes="300px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-mono text-caption font-semibold uppercase tracking-wide text-text-dim">
                          MAP TBD
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                data-testid="weekly-maps-box"
                className="flex h-20 items-center justify-between rounded-md border border-border bg-surface-raised px-3 py-2 transition-colors duration-[var(--d-ui)] group-hover:border-primary/40"
              >
                <span className="font-mono text-caption text-text-dim">{dateRangeLabel(weekDates)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
