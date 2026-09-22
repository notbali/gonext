import type { TimeSuggestion } from "@/lib/best-times";

/** The Coach's best bets for scheduling a match, from the team's availability. */
export function BestTimesCard({ suggestions }: { suggestions: TimeSuggestion[] }) {
  return (
    <div className="mt-6 rounded-lg border border-border bg-surface p-4">
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">Best times</p>
      {suggestions.length === 0 ? (
        <p className="mt-2 text-body text-text-muted">Not enough availability set yet to suggest a time.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {suggestions.map((s) => (
            <li
              key={s.dayIndex}
              data-ready={s.ready ? "" : undefined}
              className="flex items-center justify-between gap-3 font-mono text-caption uppercase tracking-wide"
            >
              <span className="text-text-primary">{s.label}</span>
              <span className={s.ready ? "font-semibold text-primary" : "text-warning"}>{s.count} available</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
