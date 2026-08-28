-- CreateEnum
CREATE TYPE "AmilPlatformChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "amil_platform_change_requests" (
    "id" TEXT NOT NULL,
    "lembagaId" TEXT NOT NULL,
    "programId" TEXT,
    "category" "ProgramCategory" NOT NULL,
    "currentPlatformPercentage" DECIMAL(5,2) NOT NULL,
    "requestedPlatformPercentage" DECIMAL(5,2) NOT NULL,
    "institutionPercentage" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AmilPlatformChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amil_platform_change_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "amil_platform_change_requests_status_createdAt_idx" ON "amil_platform_change_requests"("status", "createdAt");
CREATE INDEX "amil_platform_change_requests_lembagaId_category_status_idx" ON "amil_platform_change_requests"("lembagaId", "category", "status");
CREATE UNIQUE INDEX "amil_platform_change_requests_one_pending_per_category_idx"
ON "amil_platform_change_requests"("lembagaId", "category")
WHERE "status" = 'PENDING';

ALTER TABLE "amil_platform_change_requests" ADD CONSTRAINT "amil_platform_change_requests_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "amil_platform_change_requests" ADD CONSTRAINT "amil_platform_change_requests_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "amil_platform_change_requests" ADD CONSTRAINT "amil_platform_change_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
