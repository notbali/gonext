import { db as defaultDb } from "@/lib/db";
import type { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Admins are configured, not stored: `ADMIN_DISCORD_IDS` is a comma/whitespace
 * separated list of Discord user ids. Anyone signed in with one of those Discord
 * accounts is an Admin, whether or not they're on the team.
 */
export function parseAdminDiscordIds(raw: string | undefined): Set<string> {
  return new Set((raw ?? "").split(/[\s,]+/).filter(Boolean));
}

export async function isAdminUser(
  userId: string,
  adminDiscordIds: Set<string>,
  db: PrismaClient = defaultDb,
): Promise<boolean> {
  if (adminDiscordIds.size === 0) return false;
  const account = await db.account.findFirst({
    where: { userId, provider: "discord", providerAccountId: { in: [...adminDiscordIds] } },
    select: { id: true },
  });
  return account !== null;
}

type UserWithAccounts = {
  id: string;
  name: string | null;
  image: string | null;
  accounts: { providerAccountId: string }[];
};

const discordAccounts = {
  where: { provider: "discord" },
  select: { providerAccountId: true },
  take: 1,
} as const;

function discordIdOf(user: UserWithAccounts) {
  return user.accounts[0]?.providerAccountId ?? null;
}

export type AdminOverview = {
  team: { id: string; name: string; division: string; inviteToken: string } | null;
  teammates: {
    id: string;
    userId: string;
    name: string;
    image: string | null;
    discordId: string | null;
    isCoach: boolean;
    active: boolean;
  }[];
  unassignedUsers: { id: string; name: string; image: string | null; discordId: string | null }[];
};

/** Everyone who has ever signed in: the team's teammates (any state) plus users not on it. */
export async function getAdminOverview(db: PrismaClient = defaultDb): Promise<AdminOverview> {
  const [team, unassigned] = await Promise.all([
    db.team.findFirst({
      include: {
        teammates: {
          orderBy: { order: "asc" },
          include: { user: { include: { accounts: discordAccounts } } },
        },
      },
    }),
    db.user.findMany({
      where: { teammate: null },
      orderBy: { name: "asc" },
      include: { accounts: discordAccounts },
    }),
  ]);

  return {
    team: team && { id: team.id, name: team.name, division: team.division, inviteToken: team.inviteToken },
    teammates: (team?.teammates ?? []).map((t) => ({
      id: t.id,
      userId: t.userId,
      name: t.user.name ?? "?",
      image: t.user.image,
      discordId: discordIdOf(t.user),
      isCoach: t.isCoach,
      active: t.active,
    })),
    unassignedUsers: unassigned.map((u) => ({
      id: u.id,
      name: u.name ?? "?",
      image: u.image,
      discordId: discordIdOf(u),
    })),
  };
}

export type AddUserResult =
  | { status: "user-not-found" }
  | { status: "team-not-found" }
  | { status: "already-on-team"; teammateId: string }
  | { status: "added"; teammateId: string };

/**
 * Admin shortcut past the Invite Link for someone who has already signed in with
 * Discord. Locks the team row like `joinTeamByInviteToken` so concurrent adds get
 * distinct roster orders. Never grants Coach — the admin does that explicitly.
 */
export async function addUserToTeam(
  userId: string,
  teamId: string,
  db: PrismaClient = defaultDb,
): Promise<AddUserResult> {
  const [user, team] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true } }),
    db.team.findUnique({ where: { id: teamId }, select: { id: true } }),
  ]);
  if (!user) return { status: "user-not-found" };
  if (!team) return { status: "team-not-found" };

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "Team" WHERE id = ${teamId} FOR UPDATE`;

    const existing = await tx.teammate.findUnique({ where: { userId } });
    if (existing) return { status: "already-on-team", teammateId: existing.id };

    const teammateCount = await tx.teammate.count({ where: { teamId } });
    const teammate = await tx.teammate.create({
      data: { teamId, userId, order: teammateCount },
    });
    return { status: "added", teammateId: teammate.id };
  });
}

export type UpdateTeammateResult = { status: "not-found" } | { status: "updated" };

async function updateTeammate(
  teammateId: string,
  data: { active?: boolean; isCoach?: boolean },
  db: PrismaClient,
): Promise<UpdateTeammateResult> {
  const { count } = await db.teammate.updateMany({ where: { id: teammateId }, data });
  return count === 0 ? { status: "not-found" } : { status: "updated" };
}

/** Unlike the Coach's roster tools, an Admin can deactivate anyone — Coaches included. */
export function setTeammateActive(teammateId: string, active: boolean, db: PrismaClient = defaultDb) {
  return updateTeammate(teammateId, { active }, db);
}

export function setTeammateCoach(teammateId: string, isCoach: boolean, db: PrismaClient = defaultDb) {
  return updateTeammate(teammateId, { isCoach }, db);
}
