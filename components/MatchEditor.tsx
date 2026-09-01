"use client";

import { useState, useTransition } from "react";
import { updateMatch, deleteMatch } from "@/app/matches/actions";

function toDateInputValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeInputValue(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
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

  if (!editing) {
    return (
      <div className="flex shrink-0 gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-mono text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-text-primary"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => deleteMatch(matchId))}
          className="font-mono text-[11px] font-semibold uppercase tracking-wide text-danger hover:text-danger/80 disabled:opacity-60"
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
          await updateMatch(matchId, formData);
          setEditing(false);
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
        defaultValue={toDateInputValue(date)}
        required
        className="rounded border border-border bg-surface-raised px-2 py-1 text-body text-text-primary"
      />
      <input
        type="time"
        name="time"
        defaultValue={toTimeInputValue(date)}
        required
        className="rounded border border-border bg-surface-raised px-2 py-1 text-body text-text-primary"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-brand px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white disabled:opacity-60"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="font-mono text-[11px] font-semibold uppercase tracking-wide text-text-dim"
      >
        Cancel
      </button>
    </form>
  );
}
