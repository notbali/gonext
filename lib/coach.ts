import { db as defaultDb } from "@/lib/db";
import type { PrismaClient } from "@/lib/generated/prisma/client";

export type PromoteResult =
  | { status: "not-found" }
  | { status: "already-coach" }
  | { status: "promoted" };

/** Grants an existing teammate the Coach role. Idempotent if they're already a coach. */
export async function promoteToCoach(
  teammateId: string,
  db: PrismaClient = defaultDb,
): Promise<PromoteResult> {
  const teammate = await db.teammate.findUnique({ where: { id: teammateId } });
  if (!teammate) return { status: "not-found" };
  if (teammate.isCoach) return { status: "already-coach" };

  await db.teammate.update({ where: { id: teammateId }, data: { isCoach: true } });
  return { status: "promoted" };
}

export type ClaimCoachResult =
  | { status: "not-found" }
  | { status: "coach-exists" }
  | { status: "claimed" };

/**
 * Recovery path for a team with zero active Coaches: lets any active teammate
 * self-promote instead of the roster being permanently unmanageable. Locks the
 * team row so concurrent claimers can't all read "no coach" and both succeed.
 */
export async function claimVacantCoachRole(
  teammateId: string,
  db: PrismaClient = defaultDb,
): Promise<ClaimCoachResult> {
  const teammate = await db.teammate.findUnique({ where: { id: teammateId } });
  if (!teammate || !teammate.active) return { status: "not-found" };

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "Team" WHERE id = ${teammate.teamId} FOR UPDATE`;

    const activeCoachCount = await tx.teammate.count({
      where: { teamId: teammate.teamId, isCoach: true, active: true },
    });
    if (activeCoachCount > 0) return { status: "coach-exists" };

    await tx.teammate.update({ where: { id: teammateId }, data: { isCoach: true } });
    return { status: "claimed" };
  });
}
