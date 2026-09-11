"use client";

import { useRef, useState, useTransition } from "react";
import { AVAILABILITY_STATUS_OPTIONS, type AvailabilityStatus } from "@/lib/types";
import { setWeekAvailability } from "@/app/actions";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/ToastProvider";

export function SetAvailabilityButton({
  teammateId,
  dateISOs,
  rangeLabel,
}: {
  teammateId: string;
  dateISOs: string[];
  rangeLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<AvailabilityStatus>("available");
  const [timeRange, setTimeRange] = useState("");
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { addToast } = useToast();

  function apply() {
    startTransition(async () => {
      try {
        await setWeekAvailability(teammateId, dateISOs, status, timeRange || null);
        addToast({ message: `Availability set for ${rangeLabel}.`, variant: "success" });
        setIsOpen(false);
      } catch (err) {
        addToast({
          message: err instanceof Error ? err.message : "Something went wrong.",
          variant: "error",
        });
      }
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-press btn-glow rounded-md bg-brand px-4 py-2.5 font-mono text-caption font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
      >
        + Set availability
      </button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} returnFocusRef={triggerRef}>
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5">
          <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
            Set availability
          </p>
          <p className="mt-1 text-body text-text-muted">
            Applies to every day in <span className="font-medium text-text-primary">{rangeLabel}</span>.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <select
              value={status}
              disabled={isPending}
              onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
              className="w-full rounded border border-border bg-surface-raised px-2 py-2 text-body text-text-primary disabled:opacity-60"
            >
              {AVAILABILITY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {status === "available" && (
              <input
                value={timeRange}
                disabled={isPending}
                placeholder="All day"
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full rounded border border-border bg-surface-raised px-2 py-2 text-body text-text-primary placeholder:text-text-dim disabled:opacity-60"
              />
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
              className="btn-press rounded-md px-3 py-2 font-mono text-caption font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={apply}
              className="btn-press btn-glow rounded-md bg-brand px-4 py-2 font-mono text-caption font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Apply"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
