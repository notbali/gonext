"use client";

import { useTransition } from "react";
import { useToast } from "@/components/ToastProvider";
import { weekRangeLabel } from "@/lib/dates";
import { VALORANT_MAPS } from "@/lib/valorant-maps";
import type { ValorantMap } from "@/lib/generated/prisma/client";

export function WeekMapEditor({
  weeks,
  action,
}: {
  weeks: { weekDates: Date[]; map: string | null }[];
  /** The setWeekMap server action, passed through as-is — only a real Server
   * Action (not an inline closure) can cross the Server-to-Client boundary. */
  action: (weekStartISO: string, map: ValorantMap) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function handleChange(weekStartISO: string, map: ValorantMap) {
    startTransition(async () => {
      try {
        await action(weekStartISO, map);
        addToast({ message: "Week map updated.", variant: "success" });
      } catch (err) {
        addToast({
          message: err instanceof Error ? err.message : "Something went wrong.",
          variant: "error",
        });
      }
    });
  }

  return (
    <div className="mt-8">
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
        Weekly maps
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {weeks.map(({ weekDates, map }) => {
          const weekStartISO = weekDates[0].toISOString();
          const label = weekRangeLabel(weekDates);
          return (
            <div
              key={weekStartISO}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
            >
              <span className="text-body font-medium text-text-primary">{label}</span>
              <select
                aria-label={`Map for ${label}`}
                defaultValue={map ?? ""}
                disabled={isPending}
                onChange={(e) => handleChange(weekStartISO, e.target.value as ValorantMap)}
                className="rounded border border-border bg-surface-raised px-2 py-1.5 text-body text-text-primary disabled:opacity-60"
              >
                <option value="" disabled>
                  Select a map
                </option>
                {VALORANT_MAPS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
