import Image from "next/image";
import type { DayAvailability, Match, Teammate, WeekMapInfo } from "@/lib/types";
import { chunkIntoWeeks, dayOfWeekLabel, isSameDate, shortTimeLabel, weekRangeLabel } from "@/lib/dates";
import { EditableCell } from "@/components/EditableCell";
import { Avatar } from "@/components/Avatar";
import { GridReveal } from "@/components/GridReveal";
import { DayColumnHeader } from "@/components/DayColumnHeader";
import { isColumnFullyAvailable, isDayMatchReady } from "@/lib/schedule-column-state";
import { mapForWeek } from "@/lib/week-schedule";
import { mapImageSrc } from "@/lib/valorant-maps";

const WEEK_MAP_REVEAL_CLASS =
  "grid grid-rows-[0fr] overflow-hidden transition-[grid-template-rows] duration-[var(--d-state)] ease-[var(--e-out)] group-hover:grid-rows-[1fr]";

// The grid's column widths live in app/globals.css (.availability-grid and its
// -row / -inner rules) as CSS variables shared by the header row, every teammate
// row, and the scroll wrapper's minimum width — so they stay in sync, the grid
// scrolls (instead of clipping) once its columns would be squeezed narrower, and
// media queries can resize them for phones. The label column is pinned (sticky)
// so teammate names stay visible while the day columns scroll.
const LABEL_CELL_CLASS = "sticky left-0 z-10 flex min-w-0 items-center bg-surface px-3 shadow-[1px_0_0_0_var(--color-border)] md:px-4";

const CELL_STYLES: Record<DayAvailability["status"], string> = {
  available: "border-primary/30 bg-primary-dim text-primary-bright",
  tentative: "border-warning/30 bg-warning-dim text-warning",
  unavailable: "border-danger/30 bg-danger-dim text-danger",
  "not-set": "border-border/60 bg-transparent text-text-dim",
};

function cellLabel(day: DayAvailability): string {
  switch (day.status) {
    case "available":
      return day.timeRange ?? "ALL DAY";
    case "tentative":
      return "MAYBE";
    case "unavailable":
      return "OUT";
    case "not-set":
      return "·";
  }
}

/** One Monday-Sunday section of the grid. `dayOffset` is this week's start index into each teammate's flat `week` array. */
function WeekSection({
  weekDates,
  dayOffset,
  teammates,
  matches,
  myTeammateId,
  isFirst,
  map,
}: {
  weekDates: Date[];
  dayOffset: number;
  teammates: Teammate[];
  matches: Match[];
  myTeammateId?: string | null;
  isFirst: boolean;
  map: string | null;
}) {
  const matchByDay = weekDates.map((date) => matches.find((m) => isSameDate(m.date, date)));
  const src = map ? mapImageSrc(map) : null;

  return (
    <div className={`group ${isFirst ? "" : "border-t-4 border-bg"}`}>
      <div className="availability-grid-row grid border-b border-border">
        <div data-testid="grid-label-cell" className={`${LABEL_CELL_CLASS} py-4`}>
          <span className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
            {isFirst ? "Teammate" : weekRangeLabel(weekDates)}
          </span>
        </div>
        {weekDates.map((date, i) => {
          const match = matchByDay[i];
          return (
            <DayColumnHeader
              key={date.toISOString()}
              dow={dayOfWeekLabel(date)}
              num={String(date.getDate())}
              matchLabel={match ? shortTimeLabel(match.date) : undefined}
              hasMatch={Boolean(match)}
              complete={isColumnFullyAvailable(teammates, dayOffset + i)}
              matchReady={isDayMatchReady(teammates, dayOffset + i)}
              revealDelayMs={i * 45}
            />
          );
        })}
      </div>

      {teammates.map((teammate) => (
        <div
          key={teammate.id}
          className="availability-grid-row grid border-b border-border last:border-b-0"
        >
          <div data-testid="grid-label-cell" className={`${LABEL_CELL_CLASS} gap-3 py-4`}>
            <Avatar name={teammate.name} src={teammate.avatarUrl} size={32} />
            <span className="min-w-0 truncate text-body font-medium text-text-primary">{teammate.name}</span>
          </div>

          {weekDates.map((date, i) => {
            const day = teammate.week[dayOffset + i];
            const isMatchDay = Boolean(matchByDay[i]);
            const isMine = teammate.id === myTeammateId;
            return (
              <div
                key={i}
                data-reveal
                style={{ transitionDelay: `${i * 45}ms` }}
                className={`flex items-center justify-center border-l border-border p-2.5`}
              >
                {isMine ? (
                  <div className={`h-full w-full ${isMatchDay ? "ring-2 ring-brand/50 rounded-md" : ""}`}>
                    <EditableCell
                      teammateId={teammate.id}
                      dateISO={date.toISOString()}
                      status={day.status}
                      timeRange={day.timeRange}
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center rounded-md border ${CELL_STYLES[day.status]} ${
                      isMatchDay ? "ring-2 ring-brand/50" : ""
                    }`}
                  >
                    <span className="font-mono text-caption font-semibold tracking-wide">
                      {cellLabel(day)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div data-testid="week-map-reveal" className={WEEK_MAP_REVEAL_CLASS}>
        <div className="overflow-hidden">
          <div className="relative h-40 w-full overflow-hidden border-t border-border bg-surface-raised">
            {src ? (
              <Image src={src} alt={map!} fill sizes="900px" className="object-cover" />
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
    </div>
  );
}

export function AvailabilityGrid({
  weekDates,
  teammates,
  matches,
  myTeammateId,
  weekMaps = [],
}: {
  weekDates: Date[];
  teammates: Teammate[];
  matches: Match[];
  myTeammateId?: string | null;
  weekMaps?: WeekMapInfo[];
}) {
  const weeks = chunkIntoWeeks(weekDates);

  return (
    <GridReveal>
      <div
        data-testid="availability-grid-scroll"
        className="availability-grid flex-1 overflow-x-auto rounded-lg border border-border bg-surface"
      >
        <div className="availability-grid-inner">
          {weeks.map((week, weekIndex) => (
            <WeekSection
              key={week[0].toISOString()}
              weekDates={week}
              dayOffset={weekIndex * 7}
              teammates={teammates}
              matches={matches}
              myTeammateId={myTeammateId}
              isFirst={weekIndex === 0}
              map={mapForWeek(weekMaps, week[0])}
            />
          ))}
        </div>
      </div>
    </GridReveal>
  );
}
