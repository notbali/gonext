"use client";

import { useEffect, useState, useTransition } from "react";
import { AVAILABILITY_STATUS_OPTIONS, type AvailabilityStatus } from "@/lib/types";
import { updateAvailability } from "@/app/actions";

const CELL_STYLES: Record<AvailabilityStatus, string> = {
  available: "border-primary/30 bg-primary-dim",
  tentative: "border-warning/30 bg-warning-dim",
  unavailable: "border-danger/30 bg-danger-dim",
  "not-set": "border-border/60 bg-transparent",
};

type LockState = "idle" | "committed" | "conflict";

// Mirrors the .slot[data-lock] animation durations in app/globals.css
// (gonext-lock: 220ms, gonext-conflict: 180ms).
const LOCK_STATE_DURATION_MS: Record<Exclude<LockState, "idle">, number> = {
  committed: 220,
  conflict: 180,
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
  const [lockState, setLockState] = useState<LockState>("idle");

  useEffect(() => {
    if (lockState === "idle") return;
    const t = setTimeout(() => setLockState("idle"), LOCK_STATE_DURATION_MS[lockState]);
    return () => clearTimeout(t);
  }, [lockState]);

  function save(nextStatus: AvailabilityStatus, nextRange: string) {
    const prevStatus = localStatus;
    const prevRange = localRange;
    startTransition(async () => {
      try {
        await updateAvailability(
          teammateId,
          dateISO,
          nextStatus,
          nextStatus === "available" ? nextRange || null : null,
        );
        setLockState("committed");
      } catch {
        setLocalStatus(prevStatus);
        setLocalRange(prevRange);
        setLockState("conflict");
      }
    });
  }

  return (
    <div
      data-lock={lockState === "idle" ? undefined : lockState}
      className={`slot flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border p-1.5 ${CELL_STYLES[localStatus]}`}
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
        {AVAILABILITY_STATUS_OPTIONS.map((o) => (
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
