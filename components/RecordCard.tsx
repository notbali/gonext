import type { SeasonRecord } from "@/lib/match-record";

function count(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * The season's win–loss record, overall and per map. In the halloween season
 * `october` adds that month's results as treats (wins) and tricks (losses).
 */
export function RecordCard({ record, october }: { record: SeasonRecord; october?: { wins: number; losses: number } }) {
  if (record.byMap.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">Record</p>
        <p data-testid="record-overall" className="font-mono text-body-lg font-bold text-text-primary">
          {record.wins}–{record.losses}
        </p>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        {record.byMap.map((r) => (
          <li key={r.map} className="flex justify-between font-mono text-caption uppercase tracking-wide">
            <span className="text-text-muted">{r.map}</span>
            <span className="text-text-primary">
              {r.wins}–{r.losses}
            </span>
          </li>
        ))}
      </ul>
      {october && october.wins + october.losses > 0 && (
        <p
          data-testid="record-october"
          className="mt-3 border-t border-border pt-3 font-mono text-caption uppercase tracking-wide text-brand-bright"
        >
          🎃 October · {count(october.wins, "treat")} · {count(october.losses, "trick")}
        </p>
      )}
    </div>
  );
}
