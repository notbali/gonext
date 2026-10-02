import { seasonalStatusLabel, type Season } from "@/lib/season";
import type { AvailabilityStatus } from "@/lib/types";

const LEGEND_ITEMS: { status: AvailabilityStatus; label: string; swatch: string }[] = [
  { status: "available", label: "Available", swatch: "bg-primary" },
  { status: "tentative", label: "Tentative", swatch: "bg-warning" },
  { status: "unavailable", label: "Unavailable", swatch: "bg-danger" },
  { status: "not-set", label: "Not set", swatch: "bg-border" },
];

export function LegendCard({ season = null }: { season?: Season }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
        Legend
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {LEGEND_ITEMS.map((item) => {
          const seasonal = seasonalStatusLabel(item.status, season);
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-sm ${item.swatch}`} />
              <span className="text-body text-text-muted">
                <span>{item.label}</span>
                {seasonal && <span className="text-text-dim"> · {seasonal}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
