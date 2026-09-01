"use client";

import { useState, useTransition } from "react";
import type { AvailabilityStatus } from "@/lib/types";
import { updateAvailability } from "@/app/actions";

const STATUS_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: "not-set", label: "Not set" },
  { value: "available", label: "Available" },
  { value: "tentative", label: "Tentative" },
  { value: "unavailable", label: "Unavailable" },
];

const CELL_STYLES: Record<AvailabilityStatus, string> = {
  available: "border-primary/30 bg-primary-dim",
  tentative: "border-warning/30 bg-warning-dim",
  unavailable: "border-danger/30 bg-danger-dim",
  "not-set": "border-border/60 bg-transparent",
};

export function EditableCell({
  teammateId,
  dateISO,
  status,
  timeRange,
}: {
  teammateId: string;
  dateISO: string;
  status: AvailabilityStatus;
  timeRange?: string;
}) {
  const [localStatus, setLocalStatus] = useState(status);
  const [localRange, setLocalRange] = useState(timeRange ?? "");
  const [isPending, startTransition] = useTransition();

  function save(nextStatus: AvailabilityStatus, nextRange: string) {
    startTransition(async () => {
      await updateAvailability(
        teammateId,
        dateISO,
        nextStatus,
        nextStatus === "available" ? nextRange || null : null,
      );
    });
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border p-1.5 ${CELL_STYLES[localStatus]}`}
    >
      <select
        value={localStatus}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as AvailabilityStatus;
          setLocalStatus(next);
          save(next, localRange);
        }}
        className="w-full rounded border border-border bg-surface-raised px-1 py-1 text-center font-mono text-[10px] font-semibold uppercase tracking-wide text-text-primary disabled:opacity-60"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {localStatus === "available" && (
        <input
          value={localRange}
          disabled={isPending}
          placeholder="All day"
          onChange={(e) => setLocalRange(e.target.value)}
          onBlur={() => save(localStatus, localRange)}
          className="w-full rounded border border-border bg-surface-raised px-1 py-0.5 text-center font-mono text-[10px] text-text-primary placeholder:text-text-dim disabled:opacity-60"
        />
      )}
    </div>
  );
}
