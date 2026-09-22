-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('WIN', 'LOSS');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "result" "MatchResult";
