import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { signInWithDiscord, signOutAction } from "@/app/actions";

const NAV_ITEMS = [
  { key: "schedule", label: "SCHEDULE", href: "/" },
  { key: "matches", label: "MATCHES", href: "/matches" },
  { key: "roster", label: "ROSTER", href: "/roster" },
] as const;

export function TopNav({
  active,
  teamDivision,
  isSignedIn,
  userName,
  userImage,
}: {
  active: "schedule" | "matches" | "roster";
  teamDivision: string;
  isSignedIn: boolean;
  userName?: string | null;
  userImage?: string | null;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-brand/40 bg-brand-dim">
          <div className="h-2.5 w-2.5 rotate-45 bg-brand" />
        </div>
        <span className="font-mono text-body-lg font-bold tracking-wide text-text-primary">
          GO//NEXT
        </span>
        <span className="font-mono text-caption font-medium uppercase tracking-widest text-text-dim">
          Premier Scheduler
        </span>
        <span className="rounded-full border border-warning/40 bg-warning-dim px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-warning">
          Beta
        </span>
      </div>

      <nav className="flex items-center gap-6">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`font-mono text-caption font-semibold tracking-wider ${
              item.key === active ? "text-text-primary" : "text-text-dim hover:text-text-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
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
                className="font-mono text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-text-primary"
              >
                Log out
              </button>
            </form>
          </div>
        ) : (
          <form action={signInWithDiscord.bind(null, undefined)}>
            <button
              type="submit"
              className="rounded-md bg-brand px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-white"
            >
              Log in with Discord
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
