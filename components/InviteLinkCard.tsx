"use client";

import { useEffect, useState, useTransition } from "react";
import { regenerateInvite } from "@/app/roster/actions";

export function InviteLinkCard({ teamId, token }: { teamId: string; token: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // window.location isn't available during SSR, so this can't be computed at render time
    // without a hydration mismatch — reading it once on mount is the correct escape hatch here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, [token]);

  const url = origin ? `${origin}/join/${token}` : "";

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
        Invite link
      </p>
      <p className="mt-1 text-body text-text-muted">
        Anyone with this link can join the team as themselves via Discord.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded border border-border bg-surface-raised px-2 py-1.5 font-mono text-caption text-text-primary"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-text-primary hover:border-brand/50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => regenerateInvite(teamId))}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-danger hover:border-danger/50 disabled:opacity-60"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
