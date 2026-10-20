import { afterAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { createDbAdapter } from "./db-adapter";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:test@localhost:55432/gonext_test";

describe("createDbAdapter", () => {
  const client = new PrismaClient({ adapter: createDbAdapter(TEST_DATABASE_URL) });

  afterAll(async () => {
    await client.$disconnect();
  });

  it("uses the plain node-postgres adapter, not a provider-specific driver", () => {
    expect(createDbAdapter(TEST_DATABASE_URL)).toBeInstanceOf(PrismaPg);
  });

  it("talks to an ordinary Postgres over TCP", async () => {
    // Neon's serverless driver speaks WebSockets and can't reach a regular Postgres like
    // Supabase's or the Docker test DB; node-postgres can.
    const [row] = await client.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    expect(row.ok).toBe(1);
  });
});
