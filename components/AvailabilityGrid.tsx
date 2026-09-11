import type { DayAvailability, Match, Teammate } from "@/lib/types";
import { chunkIntoWeeks, dayOfWeekLabel, isSameDate, shortTimeLabel, weekRangeLabel } from "@/lib/dates";
import { EditableCell } from "@/components/EditableCell";
import { Avatar } from "@/components/Avatar";
import { GridReveal } from "@/components/GridReveal";
import { DayColumnHeader } from "@/components/DayColumnHeader";
import { isColumnFullyAvailable } from "@/lib/schedule-column-state";

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
}: {
  weekDates: Date[];
  dayOffset: number;
  teammates: Teammate[];
  matches: Match[];
  myTeammateId?: string | null;
  isFirst: boolean;
}) {
  const matchByDay = weekDates.map((date) => matches.find((m) => isSameDate(m.date, date)));

  return (
    <div className={isFirst ? "" : "border-t-4 border-bg"}>
      <div className="grid grid-cols-[188px_repeat(7,1fr)] border-b border-border">
        <div className="flex items-center px-4 py-4">
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
              revealDelayMs={i * 45}
            />
          );
        })}
      </div>

      {teammates.map((teammate) => (
        <div
          key={teammate.id}
          className="grid grid-cols-[188px_repeat(7,1fr)] border-b border-border last:border-b-0"
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <Avatar name={teammate.name} src={teammate.avatarUrl} size={32} />
            <span className="text-body font-medium text-text-primary">{teammate.name}</span>
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
    </div>
  );
}

export function AvailabilityGrid({
  weekDates,
  teammates,
  matches,
  myTeammateId,
}: {
  weekDates: Date[];
  teammates: Teammate[];
  matches: Match[];
  myTeammateId?: string | null;
}) {
  const weeks = chunkIntoWeeks(weekDates);

  return (
    <GridReveal>
      <div className="flex-1 overflow-hidden rounded-lg border border-border bg-surface">
        {weeks.map((week, weekIndex) => (
          <WeekSection
            key={week[0].toISOString()}
            weekDates={week}
            dayOffset={weekIndex * 7}
            teammates={teammates}
            matches={matches}
            myTeammateId={myTeammateId}
            isFirst={weekIndex === 0}
          />
        ))}
      </div>
    </GridReveal>
  );
}
