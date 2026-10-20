import { PrismaPg } from "@prisma/adapter-pg";

/** Plain node-postgres over TCP, so any Postgres host works (Supabase in prod, Docker in tests). */
export function createDbAdapter(connectionString: string) {
  return new PrismaPg({ connectionString });
}
