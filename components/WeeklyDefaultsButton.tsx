"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AVAILABILITY_STATUS_OPTIONS, type AvailabilityStatus, type WeeklyDefaultEntry } from "@/lib/types";
import { setWeeklyDefaults } from "@/app/actions";
import { normalizeTimeRange } from "@/lib/time-range";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/ToastProvider";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface DraftDay {
  status: AvailabilityStatus;
  timeRange: string;
}

function draftFrom(defaults: WeeklyDefaultEntry[]): DraftDay[] {
  return DAY_LABELS.map((_, dayOfWeek) => {
    const saved = defaults.find((d) => d.dayOfWeek === dayOfWeek);
    return { status: saved?.status ?? "not-set", timeRange: saved?.timeRange ?? "" };
  });
}

/** Edits the caller's usual week, which fills any day they haven't set themselves. */
export function WeeklyDefaultsButton({
  teammateId,
  defaults,
}: {
  teammateId: string;
  defaults: WeeklyDefaultEntry[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<DraftDay[]>(() => draftFrom(defaults));
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { addToast } = useToast();
  const router = useRouter();

  function openDialog() {
    setDraft(draftFrom(defaults));
    setIsOpen(true);
  }

  function update(dayOfWeek: number, patch: Partial<DraftDay>) {
    setDraft((days) => days.map((d, i) => (i === dayOfWeek ? { ...d, ...patch } : d)));
  }

  function save() {
    // Validated here as well as on the server, since Next.js hides a server
    // action's error message in production builds.
    let entries: WeeklyDefaultEntry[];
    try {
      entries = draft.map((d, dayOfWeek) => ({
        dayOfWeek,
        status: d.status,
        timeRange: d.status === "available" ? normalizeTimeRange(d.timeRange) : null,
      }));
    } catch (err) {
      addToast({ message: (err as Error).message, variant: "error" });
      return;
    }

    startTransition(async () => {
      try {
        await setWeeklyDefaults(teammateId, entries);
      } catch (err) {
        addToast({ message: err instanceof Error ? err.message : "Something went wrong.", variant: "error" });
        return;
      }
      try {
        router.refresh();
      } catch {
        // ignore
      }
      addToast({ message: "Weekly defaults saved.", variant: "success" });
      setIsOpen(false);
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDialog}
        className="tap-target btn-press whitespace-nowrap rounded-md border border-border px-4 py-2.5 font-mono text-caption font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary"
      >
        Weekly defaults
      </button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} returnFocusRef={triggerRef}>
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5">
          <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">Weekly defaults</p>
          <p className="mt-1 text-body text-text-muted">
            Your usual week. It fills any day you haven&apos;t set yourself.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {draft.map((day, dayOfWeek) => (
              <div key={dayOfWeek} data-testid="default-row" className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2">
                <span className="font-mono text-caption font-semibold text-text-muted">{DAY_LABELS[dayOfWeek]}</span>
                <select
                  value={day.status}
                  disabled={isPending}
                  aria-label={`${DAY_LABELS[dayOfWeek]} status`}
                  onChange={(e) => update(dayOfWeek, { status: e.target.value as AvailabilityStatus })}
                  className="w-full rounded border border-border bg-surface-raised px-2 py-1.5 text-body text-text-primary disabled:opacity-60"
                >
                  {AVAILABILITY_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {day.status === "available" ? (
                  <input
                    value={day.timeRange}
                    disabled={isPending}
                    placeholder="All day"
                    aria-label={`${DAY_LABELS[dayOfWeek]} time range`}
                    onChange={(e) => update(dayOfWeek, { timeRange: e.target.value })}
                    className="w-full rounded border border-border bg-surface-raised px-2 py-1.5 text-body text-text-primary placeholder:text-text-dim disabled:opacity-60"
                  />
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
              className="tap-target btn-press rounded-md px-3 py-2 font-mono text-caption font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={save}
              className="tap-target btn-press btn-glow rounded-md bg-brand px-4 py-2 font-mono text-caption font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
