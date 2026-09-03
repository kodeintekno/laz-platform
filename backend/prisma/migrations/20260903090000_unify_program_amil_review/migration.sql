-- Usulan perubahan amil platform kini menjadi bagian dari pengajuan program.
ALTER TABLE "programs"
ADD COLUMN "requestedAmilPlatformPercentage" DECIMAL(5,2),
ADD COLUMN "amilPlatformChangeReason" TEXT;

CREATE TYPE "ProgramReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

CREATE TABLE "program_review_history" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" "ProgramReviewStatus" NOT NULL DEFAULT 'PENDING',
    "defaultPlatformPercentage" DECIMAL(5,2) NOT NULL,
    "requestedPlatformPercentage" DECIMAL(5,2),
    "institutionPercentage" DECIMAL(5,2) NOT NULL,
    "maxTotalPercentage" DECIMAL(5,2) NOT NULL,
    "platformChangeReason" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "program_review_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "program_review_history_programId_submittedAt_idx"
ON "program_review_history"("programId", "submittedAt");

CREATE INDEX "program_review_history_status_submittedAt_idx"
ON "program_review_history"("status", "submittedAt");

ALTER TABLE "program_review_history"
ADD CONSTRAINT "program_review_history_programId_fkey"
FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sediakan satu entri awal agar keputusan program yang sudah ada tetap terlihat
-- pada halaman riwayat Lembaga setelah migrasi.
INSERT INTO "program_review_history" (
    "id",
    "programId",
    "status",
    "defaultPlatformPercentage",
    "requestedPlatformPercentage",
    "institutionPercentage",
    "maxTotalPercentage",
    "rejectionReason",
    "submittedAt",
    "reviewedAt"
)
SELECT
    CONCAT('legacy_', MD5(p."id" || p."createdAt"::text)),
    p."id",
    CASE
        WHEN p."status" = 'PENDING_REVIEW' THEN 'PENDING'::"ProgramReviewStatus"
        WHEN p."status" = 'REJECTED' THEN 'REJECTED'::"ProgramReviewStatus"
        ELSE 'APPROVED'::"ProgramReviewStatus"
    END,
    p."amilPlatformPercentage",
    NULL,
    p."amilInstitutionPercentage",
    p."amilMaxTotalPercentage",
    p."rejectionReason",
    p."createdAt",
    CASE WHEN p."status" = 'PENDING_REVIEW' THEN NULL ELSE COALESCE(p."approvedAt", p."updatedAt") END
FROM "programs" p
WHERE p."status" IN ('PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'COMPLETED');
