import { db as defaultDb } from "@/lib/db";
import type { PrismaClient } from "@/lib/generated/prisma/client";

export type JoinTeamResult =
  | { status: "invalid-token" }
  | { status: "already-joined"; teammateId: string }
  | { status: "joined"; teammateId: string };

/**
 * Joins `userId` to the team behind `token`, assigning roster `order` and the
 * first-joiner `isCoach` flag. Concurrent joiners lock the team row (`FOR UPDATE`)
 * so they can't all read the same teammate count and collide on `order`/`isCoach`.
 */
export async function joinTeamByInviteToken(
  token: string,
  userId: string,
  db: PrismaClient = defaultDb,
): Promise<JoinTeamResult> {
  const team = await db.team.findUnique({ where: { inviteToken: token } });
  if (!team) return { status: "invalid-token" };

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "Team" WHERE id = ${team.id} FOR UPDATE`;

    const existing = await tx.teammate.findUnique({ where: { userId } });
    if (existing) return { status: "already-joined", teammateId: existing.id };

    const teammateCount = await tx.teammate.count({ where: { teamId: team.id } });
    const teammate = await tx.teammate.create({
      data: {
        teamId: team.id,
        userId,
        order: teammateCount,
        isCoach: teammateCount === 0, // the first person to join a team becomes its coach
      },
    });

    return { status: "joined", teammateId: teammate.id };
  });
}
