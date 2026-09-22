/** Lets a teammate subscribe their own calendar app to the team's match feed. */
export function CalendarSubscribeCard({ feedUrl }: { feedUrl: string }) {
  const webcalUrl = feedUrl.replace(/^https?:\/\//, "webcal://");

  return (
    <div className="mt-6 rounded-lg border border-border bg-surface p-4">
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
        Calendar
      </p>
      <p className="mt-1 text-body text-text-muted">
        Every match in your own calendar, kept up to date as the Coach changes them.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={feedUrl}
          aria-label="Calendar feed URL"
          className="w-full min-w-0 truncate rounded border border-border bg-surface-raised px-2 py-1.5 font-mono text-caption text-text-primary sm:w-auto sm:flex-1"
        />
        <a
          href={webcalUrl}
          className="tap-target shrink-0 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-text-primary hover:border-brand/50"
        >
          Subscribe
        </a>
      </div>
    </div>
  );
}
