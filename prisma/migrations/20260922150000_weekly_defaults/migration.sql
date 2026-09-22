-- CreateTable
CREATE TABLE "WeeklyDefault" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "timeRange" TEXT,
    "teammateId" TEXT NOT NULL,

    CONSTRAINT "WeeklyDefault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyDefault_teammateId_dayOfWeek_key" ON "WeeklyDefault"("teammateId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "WeeklyDefault" ADD CONSTRAINT "WeeklyDefault_teammateId_fkey" FOREIGN KEY ("teammateId") REFERENCES "Teammate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
