import { Avatar } from "@/components/Avatar";
import { NavTabs } from "@/components/NavTabs";
import { signInWithDiscord, signOutAction } from "@/app/actions";

export function TopNav({
  teamDivision,
  isSignedIn,
  userName,
  userImage,
}: {
  teamDivision: string;
  isSignedIn: boolean;
  userName?: string | null;
  userImage?: string | null;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border bg-surface px-4 py-2 sm:px-8 md:h-16 md:flex-nowrap md:py-0">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-brand/40 bg-brand-dim">
          <div className="h-2.5 w-2.5 rotate-45 bg-brand" />
        </div>
        <span className="font-mono text-body-lg font-bold tracking-wide text-text-primary">
          GO//NEXT
        </span>
        <span className="hidden font-mono text-caption font-medium uppercase tracking-widest text-text-dim lg:inline">
          Premier Scheduler
        </span>
        <span className="rounded-full border border-warning/40 bg-warning-dim px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-warning">
          Beta
        </span>
      </div>

      <NavTabs />

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="font-mono text-caption font-medium tracking-wide text-text-muted">
            {teamDivision}
          </span>
        </div>

        {isSignedIn ? (
          <div className="flex items-center gap-3">
            <Avatar name={userName ?? "You"} src={userImage} size={32} />
            <form action={signOutAction}>
              <button
                type="submit"
                className="tap-target font-mono text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-text-primary"
              >
                Log out
              </button>
            </form>
          </div>
        ) : (
          <form action={signInWithDiscord.bind(null, undefined)}>
            <button
              type="submit"
              aria-label="Log in with Discord"
              className="tap-target rounded-md bg-brand px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-white"
            >
              <span>
                Log in<span className="hidden sm:inline"> with Discord</span>
              </span>
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
