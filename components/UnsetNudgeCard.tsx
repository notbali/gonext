"use client";

import { Avatar } from "@/components/Avatar";
import { useToast } from "@/components/ToastProvider";
import { nudgeMessage } from "@/lib/nudge";

/**
 * For a Coach: who still has days not set this week, and a one-click Discord
 * message @-ing all of them, to paste into the team channel.
 */
export function UnsetNudgeCard({
  teammates,
}: {
  teammates: { id: string; name: string; avatarUrl: string | null; discordId: string | null }[];
}) {
  const { addToast } = useToast();
  if (teammates.length === 0) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(nudgeMessage(teammates, window.location.origin));
      addToast({ message: "Copied — paste it in Discord.", variant: "success" });
    } catch {
      addToast({ message: "Couldn't copy to the clipboard.", variant: "error" });
    }
  }

  return (
    <div data-testid="unset-nudge" className="mt-6 rounded-lg border border-warning/30 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-caption font-semibold uppercase tracking-widest text-warning">
            Still unset this week
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            {teammates.map((t) => (
              <span key={t.id} className="flex items-center gap-2 text-body text-text-primary">
                <Avatar name={t.name} src={t.avatarUrl} size={22} />
                {t.name}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={copy}
          className="btn-press tap-target shrink-0 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-text-primary hover:border-warning/50"
        >
          Copy Discord ping
        </button>
      </div>
    </div>
  );
}
