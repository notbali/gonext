import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { signInWithDiscord } from "@/app/actions";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const team = await db.team.findUnique({ where: { inviteToken: token } });

  if (!team) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-mono text-caption font-semibold uppercase tracking-widest text-danger">
          Invalid invite
        </p>
        <p className="text-body text-text-muted">
          This link doesn&apos;t match any team. Ask your coach for a fresh one.
        </p>
      </div>
    );
  }

  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div>
          <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
            You&apos;re invited
          </p>
          <h1 className="mt-1 text-title font-bold text-text-primary">Join {team.name}</h1>
          <p className="mt-2 text-body text-text-muted">
            Sign in with Discord to join the roster as yourself.
          </p>
        </div>
        <form action={signInWithDiscord.bind(null, `/join/${token}`)}>
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white"
          >
            Log in with Discord
          </button>
        </form>
      </div>
    );
  }

  const existing = await db.teammate.findUnique({ where: { userId: session.user.id } });
  if (existing) {
    redirect("/");
  }

  const teammateCount = await db.teammate.count({ where: { teamId: team.id } });

  await db.teammate.create({
    data: {
      teamId: team.id,
      userId: session.user.id,
      order: teammateCount,
      isCoach: teammateCount === 0, // the first person to join a team becomes its coach
    },
  });

  redirect("/");
}
