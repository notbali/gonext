import Link from "next/link";
import { dateRangeLabel } from "@/lib/dates";
import { SetAvailabilityButton } from "@/components/SetAvailabilityButton";

export function PageHeader({
  weekDates,
  weekOffset,
  weekCount,
  myTeammateId,
}: {
  weekDates: Date[];
  weekOffset: number;
  weekCount: number;
  myTeammateId: string;
}) {
  const isCurrentRange = weekOffset === 0;
  const rangeLabel = dateRangeLabel(weekDates);

  return (
    <div className="flex items-end justify-between border-b border-border bg-bg px-8 py-6">
      <div>
        <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
          Team Availability
        </p>
        <h1 className="mt-1 text-display font-bold tracking-tight text-text-primary">
          {rangeLabel}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface px-1 py-1 text-text-dim">
          <Link
            href={`/?week=${weekOffset - weekCount}`}
            aria-label={`Previous ${weekCount} weeks`}
            className="rounded px-2 py-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
          >
            ‹
          </Link>
          {isCurrentRange ? (
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
            href={`/?week=${weekOffset + weekCount}`}
            aria-label={`Next ${weekCount} weeks`}
            className="rounded px-2 py-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
          >
            ›
          </Link>
        </div>
        <SetAvailabilityButton
          teammateId={myTeammateId}
          dateISOs={weekDates.map((d) => d.toISOString())}
          rangeLabel={rangeLabel}
        />
      </div>
    </div>
  );
}
