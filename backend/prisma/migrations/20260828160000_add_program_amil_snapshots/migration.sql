-- Snapshot porsi amil per program. Kolom dibuat nullable selama backfill agar
-- program lama dapat memperoleh nilai historis terbaik yang tersedia.
ALTER TABLE "programs"
ADD COLUMN "amilPlatformPercentage" DECIMAL(5,2),
ADD COLUMN "amilInstitutionPercentage" DECIMAL(5,2),
ADD COLUMN "amilMaxTotalPercentage" DECIMAL(5,2),
ADD COLUMN "amilLockedAt" TIMESTAMP(3);

-- Prioritas backfill:
-- 1. persentase dari donasi PAID terbaru program (snapshot transaksi nyata),
-- 2. override lembaga + kategori saat ini,
-- 3. default global kategori,
-- 4. fallback aman untuk data legacy yang sangat lama.
UPDATE "programs" AS p
SET
  "amilPlatformPercentage" = COALESCE(
    (SELECT d."platformPercentage" FROM "donations" d WHERE d."programId" = p."id" AND d."status" = 'PAID' AND (d."platformPercentage" + d."institutionPercentage") > 0 ORDER BY d."updatedAt" DESC LIMIT 1),
    (SELECT s."platformPercentage" FROM "amil_institution_settings" s WHERE s."lembagaId" = p."lembagaId" AND s."category" = p."category"),
    (SELECT g."defaultPlatformPercentage" FROM "amil_global_settings" g WHERE g."category" = p."category"),
    5.00
  ),
  "amilInstitutionPercentage" = COALESCE(
    (SELECT d."institutionPercentage" FROM "donations" d WHERE d."programId" = p."id" AND d."status" = 'PAID' AND (d."platformPercentage" + d."institutionPercentage") > 0 ORDER BY d."updatedAt" DESC LIMIT 1),
    (SELECT s."institutionPercentage" FROM "amil_institution_settings" s WHERE s."lembagaId" = p."lembagaId" AND s."category" = p."category"),
    (SELECT g."maxTotalPercentage" - g."defaultPlatformPercentage" FROM "amil_global_settings" g WHERE g."category" = p."category"),
    7.50
  ),
  "amilMaxTotalPercentage" = COALESCE(
    (SELECT g."maxTotalPercentage" FROM "amil_global_settings" g WHERE g."category" = p."category"),
    COALESCE(
      (SELECT d."platformPercentage" FROM "donations" d WHERE d."programId" = p."id" AND d."status" = 'PAID' AND (d."platformPercentage" + d."institutionPercentage") > 0 ORDER BY d."updatedAt" DESC LIMIT 1),
      (SELECT s."platformPercentage" FROM "amil_institution_settings" s WHERE s."lembagaId" = p."lembagaId" AND s."category" = p."category"),
      5.00
    ) + COALESCE(
      (SELECT d."institutionPercentage" FROM "donations" d WHERE d."programId" = p."id" AND d."status" = 'PAID' AND (d."platformPercentage" + d."institutionPercentage") > 0 ORDER BY d."updatedAt" DESC LIMIT 1),
      (SELECT s."institutionPercentage" FROM "amil_institution_settings" s WHERE s."lembagaId" = p."lembagaId" AND s."category" = p."category"),
      7.50
    ),
    12.50
  ),
  "amilLockedAt" = CASE
    WHEN p."status" IN ('PUBLISHED', 'COMPLETED', 'CANCELLED')
      THEN COALESCE(p."approvedAt", p."updatedAt", p."createdAt")
    ELSE NULL
  END;

-- Menangani kategori yang belum memiliki global setting (defensive fallback).
UPDATE "programs"
SET
  "amilPlatformPercentage" = COALESCE("amilPlatformPercentage", 5.00),
  "amilInstitutionPercentage" = COALESCE("amilInstitutionPercentage", 7.50),
  "amilMaxTotalPercentage" = COALESCE("amilMaxTotalPercentage", 12.50)
WHERE "amilPlatformPercentage" IS NULL
   OR "amilInstitutionPercentage" IS NULL
   OR "amilMaxTotalPercentage" IS NULL;

ALTER TABLE "programs"
ALTER COLUMN "amilPlatformPercentage" SET NOT NULL,
ALTER COLUMN "amilInstitutionPercentage" SET NOT NULL,
ALTER COLUMN "amilMaxTotalPercentage" SET NOT NULL;
