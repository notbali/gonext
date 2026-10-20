import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { createDbAdapter } from "./db-adapter";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = createDbAdapter(`${process.env.DATABASE_URL}`);

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
