import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";
import { getWeekDates } from "../lib/dates";

const adapter = new PrismaNeon({ connectionString: `${process.env.DATABASE_URL}` });
const db = new PrismaClient({ adapter });

const TEAM_ID = "team-1";

async function main() {
  // Teammates are never seeded — they only ever come from someone joining via the
  // team's invite link, so the roster starts empty. The first person to join becomes coach.
  const team = await db.team.upsert({
    where: { id: TEAM_ID },
    update: {},
    create: { id: TEAM_ID, name: "GO//NEXT", division: "DIV 2 · GROUP C" },
  });

  const weekDates = getWeekDates(new Date());

  const thisWeekMatch = new Date(weekDates[3]); // Thursday of the displayed week
  thisWeekMatch.setHours(19, 0, 0, 0);

  const nextWeekMatch = new Date(weekDates[1]);
  nextWeekMatch.setDate(nextWeekMatch.getDate() + 7); // Tuesday of the following week
  nextWeekMatch.setHours(20, 0, 0, 0);

  await db.match.deleteMany({ where: { teamId: team.id } });
  await db.match.createMany({
    data: [
      { date: thisWeekMatch, group: "GROUP C", teamId: team.id },
      { date: nextWeekMatch, group: "GROUP C", teamId: team.id },
    ],
  });

  console.log(`Seeded team "${team.name}". Invite link token: ${team.inviteToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
