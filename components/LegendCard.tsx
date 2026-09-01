const LEGEND_ITEMS = [
  { label: "Available", swatch: "bg-primary" },
  { label: "Tentative", swatch: "bg-warning" },
  { label: "Unavailable", swatch: "bg-danger" },
  { label: "Not set", swatch: "bg-border" },
] as const;

export function LegendCard() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
        Legend
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-sm ${item.swatch}`} />
            <span className="text-body text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
