import type { DayAvailability, Match, Teammate } from "@/lib/types";
import { dayOfWeekLabel, isSameDate } from "@/lib/dates";

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

export function AvailabilityGrid({
  weekDates,
  teammates,
  matches,
}: {
  weekDates: Date[];
  teammates: Teammate[];
  matches: Match[];
}) {
  const matchByDay = weekDates.map((date) => matches.find((m) => isSameDate(m.date, date)));

  return (
    <div className="flex-1 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="grid grid-cols-[188px_repeat(7,1fr)] border-b border-border">
        <div className="flex items-center px-4 py-4">
          <span className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
            Teammate
          </span>
        </div>
        {weekDates.map((date, i) => {
          const match = matchByDay[i];
          return (
            <div
              key={date.toISOString()}
              className={`flex flex-col items-center gap-1 border-l border-border py-3 ${
                match ? "bg-brand-dim/40" : ""
              }`}
            >
              <span className="font-mono text-caption font-medium uppercase tracking-widest text-text-dim">
                {dayOfWeekLabel(date)}
              </span>
              <span className="text-body-lg font-bold text-text-primary">{date.getDate()}</span>
              {match && (
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-bright">
                  Match 7p
                </span>
              )}
            </div>
          );
        })}
      </div>

      {teammates.map((teammate) => (
        <div
          key={teammate.id}
          className="grid grid-cols-[188px_repeat(7,1fr)] border-b border-border last:border-b-0"
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised">
              <span className="font-mono text-[10px] font-bold text-text-primary">
                {teammate.initials}
              </span>
            </div>
            <span className="text-body font-medium text-text-primary">{teammate.name}</span>
          </div>

          {teammate.week.map((day, i) => {
            const isMatchDay = Boolean(matchByDay[i]);
            return (
              <div
                key={i}
                className={`flex items-center justify-center border-l border-border p-2.5`}
              >
                <div
                  className={`flex h-full w-full items-center justify-center rounded-md border ${CELL_STYLES[day.status]} ${
                    isMatchDay ? "ring-2 ring-brand/50" : ""
                  }`}
                >
                  <span className="font-mono text-caption font-semibold tracking-wide">
                    {cellLabel(day)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
