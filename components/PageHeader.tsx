import { weekRangeLabel } from "@/lib/dates";

export function PageHeader({ weekDates }: { weekDates: Date[] }) {
  return (
    <div className="flex items-end justify-between border-b border-border bg-bg px-8 py-6">
      <div>
        <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
          Team Availability
        </p>
        <h1 className="mt-1 text-display font-bold tracking-tight text-text-primary">
          {weekRangeLabel(weekDates)}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div
          aria-disabled
          className="flex items-center gap-3 rounded-md border border-border bg-surface px-2 py-2 text-text-dim"
        >
          <span className="px-1">‹</span>
          <span className="font-mono text-caption font-semibold uppercase tracking-wider text-text-muted">
            This week
          </span>
          <span className="px-1">›</span>
        </div>
        <button
          type="button"
          disabled
          className="rounded-md bg-brand px-4 py-2.5 font-mono text-caption font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-90"
        >
          + Set availability
        </button>
      </div>
    </div>
  );
}
