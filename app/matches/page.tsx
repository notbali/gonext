import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AccessGate } from "@/components/AccessGate";
import { MatchEditor } from "@/components/MatchEditor";
import { CreateMatchForm } from "@/components/CreateMatchForm";
import { matchDateLine } from "@/lib/dates";
import { createMatch } from "@/app/matches/actions";

type MatchRow = { id: string; date: Date; group: string };

function MatchList({
  title,
  matches,
  isCoach,
}: {
  title: string;
  matches: MatchRow[];
  isCoach: boolean;
}) {
  return (
    <div className="mt-6">
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim">
        {title}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {matches.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <p className="text-body-lg font-semibold text-text-primary">{matchDateLine(m)}</p>
            {isCoach && <MatchEditor matchId={m.id} group={m.group} date={m.date} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function MatchesPage() {
  const session = await auth();

  const team = await db.team.findFirst({
    include: { matches: { orderBy: { date: "asc" } } },
  });

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center text-body text-text-muted">
        No team has been seeded yet.
      </div>
    );
  }

  const isCoach = session?.isCoach ?? false;
  const now = new Date();
  const upcoming = team.matches.filter((m) => m.date >= now);
  const past = team.matches.filter((m) => m.date < now).reverse();

  if (!session?.teammateId) {
    return <AccessGate isSignedIn={Boolean(session?.user)} />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
          Matches
        </p>
        <h1 className="mt-1 text-title font-bold text-text-primary">{team.name}</h1>

        {upcoming.length > 0 ? (
          <MatchList title="Upcoming" matches={upcoming} isCoach={isCoach} />
        ) : (
          <p className="mt-6 text-body text-text-muted">No upcoming matches scheduled.</p>
        )}
        {past.length > 0 && <MatchList title="Past" matches={past} isCoach={isCoach} />}

        {isCoach && (
          <CreateMatchForm
            action={createMatch}
            defaultGroup={team.division.split("·").pop()?.trim() ?? ""}
          />
        )}
      </div>
    </div>
  );
}
