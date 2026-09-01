import { TEAM_DIVISION, CURRENT_USER_INITIALS } from "@/lib/mock-data";

const NAV_ITEMS = [
  { label: "SCHEDULE", active: true },
  { label: "MATCHES", active: false },
  { label: "ROSTER", active: false },
] as const;

export function TopNav() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-brand/40 bg-brand-dim">
          <div className="h-2.5 w-2.5 rotate-45 bg-brand" />
        </div>
        <span className="font-mono text-body-lg font-bold tracking-wide text-text-primary">
          GO//NEXT
        </span>
        <span className="font-mono text-caption font-medium uppercase tracking-widest text-text-dim">
          Premier Scheduler
        </span>
      </div>

      <nav className="flex items-center gap-6">
        {NAV_ITEMS.map((item) => (
          <span
            key={item.label}
            className={`font-mono text-caption font-semibold tracking-wider ${
              item.active ? "text-text-primary" : "text-text-dim"
            }`}
          >
            {item.label}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="font-mono text-caption font-medium tracking-wide text-text-muted">
            {TEAM_DIVISION}
          </span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-raised">
          <span className="font-mono text-caption font-bold text-text-primary">
            {CURRENT_USER_INITIALS}
          </span>
        </div>
      </div>
    </header>
  );
}
