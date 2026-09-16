"use client";

import { useState, useTransition } from "react";
import { updateMatch, deleteMatch } from "@/app/matches/actions";
import { useToast } from "@/components/ToastProvider";
import { getEasternParts, type EasternParts } from "@/lib/dates";

/** Seeds the `<input type="date">` default from Eastern time parts (see lib/dates.ts). */
function toDateInputValue(p: EasternParts): string {
  const mm = String(p.month + 1).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  return `${p.year}-${mm}-${dd}`;
}

/** Seeds the `<input type="time">` default from Eastern time parts (see lib/dates.ts). */
function toTimeInputValue(p: EasternParts): string {
  const hh = String(p.hours).padStart(2, "0");
  const mi = String(p.minutes).padStart(2, "0");
  return `${hh}:${mi}`;
}

export function MatchEditor({
  matchId,
  group,
  date,
}: {
  matchId: string;
  group: string;
  date: Date;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const easternDate = getEasternParts(date);

  function reportError(err: unknown) {
    addToast({
      message: err instanceof Error ? err.message : "Something went wrong.",
      variant: "error",
    });
  }

  if (!editing) {
    return (
      <div className="flex shrink-0 gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn-press font-mono text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-text-primary"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                await deleteMatch(matchId);
                addToast({ message: "Match deleted.", variant: "success" });
              } catch (err) {
                reportError(err);
              }
            })
          }
          className="btn-press font-mono text-[11px] font-semibold uppercase tracking-wide text-danger hover:text-danger/80 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          try {
            await updateMatch(matchId, formData);
            addToast({ message: "Match updated.", variant: "success" });
            setEditing(false);
          } catch (err) {
            reportError(err);
          }
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        name="group"
        defaultValue={group}
        required
        className="w-24 rounded border border-border bg-surface-raised px-2 py-1 text-body text-text-primary"
      />
      <input
        type="date"
        name="date"
        defaultValue={toDateInputValue(easternDate)}
        required
        className="rounded border border-border bg-surface-raised px-2 py-1 text-body text-text-primary"
      />
      <input
        type="time"
        name="time"
        defaultValue={toTimeInputValue(easternDate)}
        required
        className="rounded border border-border bg-surface-raised px-2 py-1 text-body text-text-primary"
      />
      <button
        type="submit"
        disabled={isPending}
        className="btn-press btn-glow rounded bg-brand px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white disabled:opacity-60"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="btn-press font-mono text-[11px] font-semibold uppercase tracking-wide text-text-dim"
      >
        Cancel
      </button>
    </form>
  );
}
