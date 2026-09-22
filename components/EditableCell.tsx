"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AVAILABILITY_STATUS_OPTIONS, type AvailabilityStatus } from "@/lib/types";
import { updateAvailability } from "@/app/actions";
import { normalizeTimeRange } from "@/lib/time-range";
import { useToast } from "@/components/ToastProvider";

const CELL_STYLES: Record<AvailabilityStatus, string> = {
  available: "border-primary/30 bg-primary-dim",
  tentative: "border-warning/30 bg-warning-dim",
  unavailable: "border-danger/30 bg-danger-dim",
  "not-set": "border-border/60 bg-transparent",
};

// Same wording as the read-only cells other teammates see, and short enough to fit
// a narrow phone column at the 16px size touch devices force on form controls.
const CELL_OPTION_LABELS: Partial<Record<AvailabilityStatus, string>> = {
  tentative: "Maybe",
  unavailable: "Out",
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
  // The range as last saved, so a blur with no real edit doesn't re-save.
  const [savedRange, setSavedRange] = useState(timeRange ?? "");
  const [isPending, startTransition] = useTransition();
  const [lockState, setLockState] = useState<LockState>("idle");
  const { addToast } = useToast();
  const router = useRouter();

  // Picks up changes made elsewhere (e.g. a bulk edit) once the server data
  // revalidates and this cell re-renders with new props. Skipped while a save
  // is in flight so it doesn't clobber this cell's own optimistic update.
  // Adjusting state during render (rather than in an effect) avoids an extra
  // commit — see https://react.dev/learn/you-might-not-need-an-effect.
  const [prevStatus, setPrevStatus] = useState(status);
  const [prevTimeRange, setPrevTimeRange] = useState(timeRange);
  if (status !== prevStatus || timeRange !== prevTimeRange) {
    setPrevStatus(status);
    setPrevTimeRange(timeRange);
    setSavedRange(timeRange ?? "");
    if (!isPending) {
      setLocalStatus(status);
      setLocalRange(timeRange ?? "");
    }
  }

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
      } catch (err) {
        setLocalStatus(prevStatus);
        setLocalRange(prevRange);
        setLockState("conflict");
        addToast({
          message: err instanceof Error ? err.message : "Couldn't save that change.",
          variant: "error",
        });
        return;
      }
      // The write already succeeded, so a failure here must not be reported
      // as a save failure — best-effort only.
      try {
        router.refresh();
      } catch {
        // ignore
      }
      setSavedRange(nextRange);
      setLockState("committed");
    });
  }

  // Validated here as well as on the server, since Next.js hides a server
  // action's error message in production builds.
  function commitRange() {
    let normalized: string;
    try {
      normalized = normalizeTimeRange(localRange) ?? "";
    } catch (err) {
      setLocalRange(savedRange);
      setLockState("conflict");
      addToast({ message: (err as Error).message, variant: "error" });
      return;
    }
    setLocalRange(normalized);
    if (normalized !== savedRange) save(localStatus, normalized);
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
            {CELL_OPTION_LABELS[o.value] ?? o.label}
          </option>
        ))}
      </select>
      {localStatus === "available" && (
        <input
          value={localRange}
          disabled={isPending}
          placeholder="All day"
          onChange={(e) => setLocalRange(e.target.value)}
          onBlur={commitRange}
          className="w-full rounded border border-border bg-surface-raised px-1 py-0.5 text-center font-mono text-[10px] text-text-primary placeholder:text-text-dim disabled:opacity-60"
        />
      )}
    </div>
  );
}
