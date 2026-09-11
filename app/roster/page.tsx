import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AccessGate } from "@/components/AccessGate";
import { Avatar } from "@/components/Avatar";
import { InviteLinkCard } from "@/components/InviteLinkCard";
import { ActionForm } from "@/components/ActionForm";
import {
  claimCoachRole,
  deactivateTeammate,
  promoteTeammate,
  reactivateTeammate,
} from "@/app/roster/actions";

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
  const hasActiveCoach = active.some((t) => t.isCoach);
  const currentTeammate = active.find((t) => t.id === session?.teammateId);

  if (!session?.teammateId) {
    return <AccessGate isSignedIn={Boolean(session?.user)} />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
          Roster
        </p>
        <h1 className="mt-1 text-title font-bold text-text-primary">{team.name}</h1>

        {!hasActiveCoach && currentTeammate && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-brand-dim bg-brand-dim/20 p-4">
            <p className="text-body text-text-primary">
              This team has no active Coach, so nobody can manage the roster. Any teammate can
              claim the role to fix this.
            </p>
            <ActionForm
              action={claimCoachRole}
              successMessage="You're the Coach now."
              className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-wide text-brand-bright transition-colors duration-[var(--d-micro)] hover:text-brand disabled:opacity-60"
            >
              Become Coach
            </ActionForm>
          </div>
        )}

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
                  <div className="flex items-center gap-4">
                    <ActionForm
                      action={promoteTeammate.bind(null, t.id)}
                      successMessage={`${t.user.name ?? "Teammate"} is now a Coach.`}
                      className="font-mono text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors duration-[var(--d-micro)] hover:text-primary-bright disabled:opacity-60"
                    >
                      Make Coach
                    </ActionForm>
                    <ActionForm
                      action={deactivateTeammate.bind(null, t.id)}
                      successMessage={`${t.user.name ?? "Teammate"} was removed.`}
                      className="font-mono text-[11px] font-semibold uppercase tracking-wide text-danger transition-colors duration-[var(--d-micro)] hover:text-danger/80 disabled:opacity-60"
                    >
                      Remove
                    </ActionForm>
                  </div>
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
                  <ActionForm
                    action={reactivateTeammate.bind(null, t.id)}
                    successMessage={`${t.user.name ?? "Teammate"} is active again.`}
                    className="font-mono text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors duration-[var(--d-micro)] hover:text-primary-bright disabled:opacity-60"
                  >
                    Reactivate
                  </ActionForm>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
