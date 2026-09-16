import Link from "next/link";
import type { ReactNode } from "react";
import { dateRangeLabel } from "@/lib/dates";
import { SetAvailabilityButton } from "@/components/SetAvailabilityButton";

/** A week-nav arrow: a link when navigable, a disabled marker at a boundary. */
function NavArrow({
  disabled,
  href,
  label,
  children,
}: {
  disabled: boolean;
  href: string;
  label: string;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className="cursor-not-allowed rounded px-2 py-1.5 text-text-dim opacity-40"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="btn-press rounded px-2 py-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
    >
      {children}
    </Link>
  );
}

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
  const isAtEarliest = weekOffset <= 0;
  const isAtLatest = weekOffset >= weekCount;
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
          <NavArrow
            disabled={isAtEarliest}
            href={`/?week=${weekOffset - weekCount}`}
            label={`Previous ${weekCount} weeks`}
          >
            ‹
          </NavArrow>
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
          <NavArrow
            disabled={isAtLatest}
            href={`/?week=${weekOffset + weekCount}`}
            label={`Next ${weekCount} weeks`}
          >
            ›
          </NavArrow>
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
