import { db as defaultDb } from "@/lib/db";
import type { PrismaClient } from "@/lib/generated/prisma/client";

/** Each teammate's linked Discord user id (for an @mention), or null if they have none. */
export async function loadDiscordIds(
  teammateIds: string[],
  db: PrismaClient = defaultDb,
): Promise<Map<string, string | null>> {
  const links = await db.teammate.findMany({
    where: { id: { in: teammateIds } },
    select: {
      id: true,
      user: { select: { accounts: { where: { provider: "discord" }, select: { providerAccountId: true } } } },
    },
  });
  return new Map(links.map((l) => [l.id, l.user.accounts[0]?.providerAccountId ?? null]));
}
