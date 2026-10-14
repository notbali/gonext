"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AVAILABILITY_STATUS_OPTIONS, type AvailabilityStatus } from "@/lib/types";
import { updateAvailability, updateAvailabilityNote } from "@/app/actions";
import { normalizeTimeRange } from "@/lib/time-range";
import { shortDayLabel } from "@/lib/dates";
import { useToast } from "@/components/ToastProvider";
import { useSeason } from "@/components/SeasonProvider";
import { seasonalStatusLabel } from "@/lib/season";

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

/** Number keys set a day's status straight from its select, without opening it. */
const STATUS_SHORTCUTS: Record<string, AvailabilityStatus> = {
  "1": "available",
  "2": "tentative",
  "3": "unavailable",
  "0": "not-set",
};
const SHORTCUT_HINT = "Keys: 1 available · 2 maybe · 3 out · 0 not set · ← → next day";

/**
 * Moves focus to the previous/next editable day (`step` -1/1) in page order,
 * which runs across week sections too. Stays put at either end.
 */
function focusNeighbor(from: HTMLSelectElement, step: 1 | -1) {
  const cells = Array.from(document.querySelectorAll<HTMLSelectElement>("select[data-cell-select]"));
  cells[cells.indexOf(from) + step]?.focus();
}

/**
 * The cell's day, e.g. "WED SEP 23". Read from the ISO string's date part rather
 * than through `new Date`, which would shift it into the viewer's own timezone.
 */
function dayLabel(dateISO: string): string {
  const [y, m, d] = dateISO.slice(0, 10).split("-").map(Number);
  return shortDayLabel(new Date(y, m - 1, d));
}

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
  note,
}: {
  teammateId: string;
  dateISO: string;
  status: AvailabilityStatus;
  timeRange?: string;
  note?: string;
}) {
  const [localStatus, setLocalStatus] = useState(status);
  const [localRange, setLocalRange] = useState(timeRange ?? "");
  // The range as last saved, so a blur with no real edit doesn't re-save.
  const [savedRange, setSavedRange] = useState(timeRange ?? "");
  const [isPending, startTransition] = useTransition();
  const [lockState, setLockState] = useState<LockState>("idle");
  const { addToast } = useToast();
  const season = useSeason();
  const router = useRouter();
  const [localNote, setLocalNote] = useState(note ?? "");
  const [savedNote, setSavedNote] = useState(note ?? "");
  const [noteOpen, setNoteOpen] = useState(Boolean(note));
  const noteInputRef = useRef<HTMLInputElement>(null);

  // Picks up changes made elsewhere (e.g. a bulk edit) once the server data
  // revalidates and this cell re-renders with new props. Skipped while a save
  // is in flight so it doesn't clobber this cell's own optimistic update.
  // Adjusting state during render (rather than in an effect) avoids an extra
  // commit — see https://react.dev/learn/you-might-not-need-an-effect.
  const [prevStatus, setPrevStatus] = useState(status);
  const [prevTimeRange, setPrevTimeRange] = useState(timeRange);
  const [prevNote, setPrevNote] = useState(note);
  if (note !== prevNote) {
    setPrevNote(note);
    setSavedNote(note ?? "");
    if (!isPending) setLocalNote(note ?? "");
  }
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
    if (noteOpen && !savedNote) noteInputRef.current?.focus();
  }, [noteOpen, savedNote]);

  // While the pointer is over the cell, the number keys set it without focusing the
  // select first: a native select swallows keys while its menu is open, and Safari
  // doesn't focus one on click at all. Keys the select or a text field gets are theirs.
  const [hovered, setHovered] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);
  const setStatusRef = useRef(setStatus);
  useEffect(() => {
    setStatusRef.current = setStatus;
  });
  useEffect(() => {
    if (!hovered) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]")) return;
      const shortcut = STATUS_SHORTCUTS[e.key];
      if (!shortcut) return;
      e.preventDefault();
      setStatusRef.current(shortcut);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hovered]);

  useEffect(() => {
    if (lockState === "idle") return;
    const t = setTimeout(() => setLockState("idle"), LOCK_STATE_DURATION_MS[lockState]);
    return () => clearTimeout(t);
  }, [lockState]);

  function statusLabel(value: AvailabilityStatus): string {
    const option = AVAILABILITY_STATUS_OPTIONS.find((o) => o.value === value)!;
    return seasonalStatusLabel(value, season) ?? CELL_OPTION_LABELS[value] ?? option.label;
  }

  /** Saves a change; once it lands, a toast offers to put the previous value back (unless this *is* that undo). */
  function save(nextStatus: AvailabilityStatus, nextRange: string, { undoable = true } = {}) {
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
      if (undoable) {
        const shown = nextStatus === "available" && nextRange ? nextRange : statusLabel(nextStatus);
        addToast({
          message: `${dayLabel(dateISO)} set to ${shown}`,
          // One undo at a time: a newer edit's toast replaces this one.
          key: "availability-undo",
          action: {
            label: "Undo",
            onClick: () => {
              setLocalStatus(prevStatus);
              setLocalRange(prevRange);
              save(prevStatus, prevRange, { undoable: false });
            },
          },
        });
      }
    });
  }

  function setStatus(next: AvailabilityStatus) {
    if (next === localStatus) return;
    setLocalStatus(next);
    save(next, localRange);
  }

  function commitNote() {
    const next = localNote.trim();
    if (next === savedNote) return;
    startTransition(async () => {
      try {
        await updateAvailabilityNote(teammateId, dateISO, next);
      } catch (err) {
        setLocalNote(savedNote);
        setLockState("conflict");
        addToast({ message: err instanceof Error ? err.message : "Couldn't save that note.", variant: "error" });
        return;
      }
      try {
        router.refresh();
      } catch {
        // ignore
      }
      setSavedNote(next);
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

  const isNotSet = localStatus === "not-set";

  return (
    <div
      data-testid="editable-cell"
      data-lock={lockState === "idle" ? undefined : lockState}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => {
        // A click on the cell's own background (not a control) focuses its select, so the arrows work next.
        if (e.target === e.currentTarget) {
          e.preventDefault();
          selectRef.current?.focus();
        }
      }}
      className={`slot flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border p-1.5 ${CELL_STYLES[localStatus]}`}
    >
      <div className="relative w-full">
        <select
          ref={selectRef}
          value={localStatus}
          // Not `disabled` while saving: that would drop focus and break typing a week through with the keyboard.
          aria-busy={isPending}
          data-cell-select
          title={SHORTCUT_HINT}
          onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
          onKeyDown={(e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const shortcut = STATUS_SHORTCUTS[e.key];
            if (shortcut) {
              e.preventDefault();
              setStatus(shortcut);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              focusNeighbor(e.currentTarget, e.key === "ArrowRight" ? 1 : -1);
            }
          }}
          // Not set reads as a blank box with just the arrow in the middle; the option keeps its name for screen readers.
          className={`w-full cursor-pointer appearance-none rounded border border-border bg-surface-raised py-1 pl-1 text-center font-mono text-[10px] font-semibold uppercase tracking-wide aria-busy:opacity-60 ${
            isNotSet ? "pr-1 text-transparent" : "pr-4 text-text-primary"
          }`}
        >
          {AVAILABILITY_STATUS_OPTIONS.map((o) => (
            // Options set their own colors: they'd otherwise inherit the blank select's transparent text.
            <option key={o.value} value={o.value} className="bg-surface-raised text-text-primary">
              {statusLabel(o.value)}
            </option>
          ))}
        </select>
        <svg
          data-testid="cell-chevron"
          aria-hidden="true"
          viewBox="0 0 10 6"
          className={`pointer-events-none absolute top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-text-dim ${
            isNotSet ? "left-1/2 -translate-x-1/2" : "right-1.5"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </div>
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
      {noteOpen ? (
        <input
          ref={noteInputRef}
          value={localNote}
          maxLength={60}
          disabled={isPending}
          placeholder="Note"
          aria-label="Note"
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={commitNote}
          className="w-full rounded border border-border bg-surface-raised px-1 py-0.5 text-center text-[10px] italic text-text-primary placeholder:text-text-dim disabled:opacity-60"
        />
      ) : (
        <button
          type="button"
          onClick={() => setNoteOpen(true)}
          className="font-mono text-[10px] text-text-dim hover:text-text-muted"
        >
          + Add note
        </button>
      )}
    </div>
  );
}
