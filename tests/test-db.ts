import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:test@localhost:55432/gonext_test";

const adapter = new PrismaPg({ connectionString: TEST_DATABASE_URL });

export const testDb = new PrismaClient({ adapter });

/** Wipes all domain rows between tests, cheapest-first so FK order doesn't matter. */
export async function resetTestDb() {
  await testDb.availability.deleteMany();
  await testDb.match.deleteMany();
  await testDb.teammate.deleteMany();
  await testDb.team.deleteMany();
  await testDb.session.deleteMany();
  await testDb.account.deleteMany();
  await testDb.user.deleteMany();
}
