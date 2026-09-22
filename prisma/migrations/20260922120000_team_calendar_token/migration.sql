-- AlterTable: backfill existing teams with a random token before requiring one.
ALTER TABLE "Team" ADD COLUMN "calendarToken" TEXT;
UPDATE "Team" SET "calendarToken" = replace(gen_random_uuid()::text, '-', '') WHERE "calendarToken" IS NULL;
ALTER TABLE "Team" ALTER COLUMN "calendarToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Team_calendarToken_key" ON "Team"("calendarToken");
