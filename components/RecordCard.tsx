import type { SeasonRecord } from "@/lib/match-record";

/** The season's win–loss record, overall and per map. */
export function RecordCard({ record }: { record: SeasonRecord }) {
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
    </div>
  );
}
