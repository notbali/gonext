import { auth } from "@/auth";
import { db } from "@/lib/db";
import { TopNav } from "@/components/TopNav";
import { AccessGate } from "@/components/AccessGate";
import { Avatar } from "@/components/Avatar";
import { InviteLinkCard } from "@/components/InviteLinkCard";
import { deactivateTeammate, reactivateTeammate } from "@/app/roster/actions";

export default async function RosterPage() {
  const session = await auth();

  const team = await db.team.findFirst({
    include: {
      teammates: { orderBy: { order: "asc" }, include: { user: true } },
    },
  });

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center text-body text-text-muted">
        No team has been seeded yet.
      </div>
    );
  }

  const isCoach = session?.isCoach ?? false;
  const active = team.teammates.filter((t) => t.active);
  const inactive = team.teammates.filter((t) => !t.active);

  const nav = (
    <TopNav
      active="roster"
      teamDivision={team.division}
      isSignedIn={Boolean(session?.user)}
      userName={session?.user?.name}
      userImage={session?.user?.image}
    />
  );

  if (!session?.teammateId) {
    return (
      <div className="min-h-screen bg-bg">
        {nav}
        <AccessGate isSignedIn={Boolean(session?.user)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {nav}

      <div className="mx-auto max-w-3xl px-8 py-8">
        <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
          Roster
        </p>
        <h1 className="mt-1 text-title font-bold text-text-primary">{team.name}</h1>

        {active.length === 0 ? (
          <p className="mt-6 text-body text-text-muted">
            Nobody has joined yet — share the invite link below.
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            {active.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={t.user.name ?? "?"} src={t.user.image} size={32} />
                  <p className="flex items-center gap-2 text-body-lg font-medium text-text-primary">
                    {t.user.name}
                    {t.isCoach && (
                      <span className="rounded-full bg-brand-dim px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-brand-bright">
                        Coach
                      </span>
                    )}
                  </p>
                </div>
                {isCoach && !t.isCoach && (
                  <form action={deactivateTeammate.bind(null, t.id)}>
                    <button
                      type="submit"
                      className="font-mono text-[11px] font-semibold uppercase tracking-wide text-danger hover:text-danger/80"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {isCoach && (
          <div className="mt-6">
            <InviteLinkCard teamId={team.id} token={team.inviteToken} />
          </div>
        )}

        {isCoach && inactive.length > 0 && (
          <div className="mt-8">
            <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
              Inactive
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {inactive.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface/50 p-4 opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={t.user.name ?? "?"} src={t.user.image} size={28} />
                    <p className="text-body text-text-muted">{t.user.name}</p>
                  </div>
                  <form action={reactivateTeammate.bind(null, t.id)}>
                    <button
                      type="submit"
                      className="font-mono text-[11px] font-semibold uppercase tracking-wide text-primary hover:text-primary-bright"
                    >
                      Reactivate
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
