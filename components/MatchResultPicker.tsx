"use client";

import { useTransition } from "react";
import { setMatchResult } from "@/app/matches/actions";
import { useToast } from "@/components/ToastProvider";
import type { MatchResultValue } from "@/lib/match-record";

const BADGE_STYLES: Record<MatchResultValue, string> = {
  WIN: "bg-primary-dim text-primary",
  LOSS: "bg-danger-dim text-danger",
};

const OPTIONS: { value: MatchResultValue; label: string }[] = [
  { value: "WIN", label: "W" },
  { value: "LOSS", label: "L" },
];

/** A played match's result: a badge for everyone, W/L toggles for a Coach. */
export function MatchResultPicker({
  matchId,
  result,
  canEdit,
}: {
  matchId: string;
  result: MatchResultValue | null;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  if (!canEdit) {
    if (!result) return null;
    return (
      <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${BADGE_STYLES[result]}`}>
        {result}
      </span>
    );
  }

  function choose(value: MatchResultValue) {
    startTransition(async () => {
      try {
        await setMatchResult(matchId, value === result ? null : value);
      } catch (err) {
        addToast({ message: err instanceof Error ? err.message : "Something went wrong.", variant: "error" });
      }
    });
  }

  return (
    <div className="flex shrink-0 gap-1" role="group" aria-label="Match result">
      {OPTIONS.map((o) => {
        const pressed = result === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={pressed}
            disabled={isPending}
            onClick={() => choose(o.value)}
            className={`tap-target btn-press rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider disabled:opacity-60 ${
              pressed ? `border-transparent ${BADGE_STYLES[o.value]}` : "border-border text-text-dim hover:text-text-primary"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
