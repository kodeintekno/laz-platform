-- CreateEnum
CREATE TYPE "VolunteerActivityStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'VOLUNTEER_REPORT_SUBMIT';
ALTER TYPE "AuditAction" ADD VALUE 'VOLUNTEER_REPORT_VERIFY';

-- AlterEnum
ALTER TYPE "VolunteerApplicationStatus" ADD VALUE 'REPORT_SUBMITTED';
ALTER TYPE "VolunteerApplicationStatus" ADD VALUE 'COMPLETED';

-- CreateTable
CREATE TABLE "volunteer_activities" (
    "id" TEXT NOT NULL,
    "lembagaId" TEXT NOT NULL,
    "programId" TEXT,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "activityDate" TIMESTAMP(3),
    "quota" INTEGER,
    "status" "VolunteerActivityStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_activities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "volunteer_activities" ADD CONSTRAINT "volunteer_activities_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_activities" ADD CONSTRAINT "volunteer_activities_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_activities" ADD CONSTRAINT "volunteer_activities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: create one legacy VolunteerActivity per distinct program referenced
-- by pre-existing volunteer_applications rows (so old data is not lost).
INSERT INTO "volunteer_activities" ("id", "lembagaId", "programId", "createdById", "title", "description", "status", "createdAt", "updatedAt")
SELECT
  'legacy-activity-' || p.id,
  p."lembagaId",
  p.id,
  p."createdById",
  'Kegiatan Relawan - ' || p.title,
  'Kegiatan relawan hasil migrasi otomatis dari program "' || p.title || '" (dibuat sebelum fitur Kegiatan Relawan tersedia).',
  'OPEN',
  now(),
  now()
FROM (SELECT DISTINCT "programId" FROM "volunteer_applications") AS distinct_apps
JOIN "programs" p ON p.id = distinct_apps."programId";

-- AlterTable: new report/verification columns + activityId (nullable first)
ALTER TABLE "volunteer_applications"
  ADD COLUMN "activityId" TEXT,
  ADD COLUMN "reportFilePublicId" TEXT,
  ADD COLUMN "reportFileUrl" TEXT,
  ADD COLUMN "reportNote" TEXT,
  ADD COLUMN "reportSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "reportText" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedById" TEXT;

-- Backfill activityId for existing rows from the legacy activity we just created
UPDATE "volunteer_applications" va
SET "activityId" = 'legacy-activity-' || va."programId";

-- Now safe to enforce NOT NULL
ALTER TABLE "volunteer_applications" ALTER COLUMN "activityId" SET NOT NULL;

-- DropForeignKey (old programId link)
ALTER TABLE "volunteer_applications" DROP CONSTRAINT "volunteer_applications_programId_fkey";

-- DropIndex (old unique constraint)
DROP INDEX "volunteer_applications_volunteerId_programId_key";

-- DropColumn (old programId)
ALTER TABLE "volunteer_applications" DROP COLUMN "programId";

-- CreateIndex (new unique constraint)
CREATE UNIQUE INDEX "volunteer_applications_volunteerId_activityId_key" ON "volunteer_applications"("volunteerId", "activityId");

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "volunteer_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: drop the now-obsolete Program.acceptsVolunteers flag
ALTER TABLE "programs" DROP COLUMN "acceptsVolunteers";
