import Link from "next/link";
import { weekRangeLabel } from "@/lib/dates";

export function PageHeader({
  weekDates,
  weekOffset,
}: {
  weekDates: Date[];
  weekOffset: number;
}) {
  const isCurrentWeek = weekOffset === 0;

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
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface px-1 py-1 text-text-dim">
          <Link
            href={`/?week=${weekOffset - 1}`}
            aria-label="Previous week"
            className="rounded px-2 py-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
          >
            ‹
          </Link>
          {isCurrentWeek ? (
            <span className="px-2 font-mono text-caption font-semibold uppercase tracking-wider text-text-muted">
              This week
            </span>
          ) : (
            <Link
              href="/"
              className="rounded px-2 py-1.5 font-mono text-caption font-semibold uppercase tracking-wider text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
            >
              This week
            </Link>
          )}
          <Link
            href={`/?week=${weekOffset + 1}`}
            aria-label="Next week"
            className="rounded px-2 py-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
          >
            ›
          </Link>
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
