/*
  Warnings:

  - You are about to drop the column `group` on the `Match` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ValorantMap" AS ENUM ('ASCENT', 'BIND', 'BREEZE', 'FRACTURE', 'HAVEN', 'ICEBOX', 'LOTUS', 'PEARL', 'SPLIT', 'SUNSET', 'ABYSS', 'CORRODE');

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "group",
ADD COLUMN     "isPlayoffs" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WeekMap" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "map" "ValorantMap" NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "WeekMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeekMap_teamId_weekStart_key" ON "WeekMap"("teamId", "weekStart");

-- AddForeignKey
ALTER TABLE "WeekMap" ADD CONSTRAINT "WeekMap_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
