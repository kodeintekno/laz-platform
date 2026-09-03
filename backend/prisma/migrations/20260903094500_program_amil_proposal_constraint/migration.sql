-- Selama program masih diajukan, total porsi harus dihitung memakai porsi
-- platform yang diminta Lembaga. Jika tidak ada pengajuan perubahan, gunakan
-- snapshot porsi platform default seperti sebelumnya.
ALTER TABLE "programs"
DROP CONSTRAINT "programs_amil_total_within_snapshot_limit";

ALTER TABLE "programs"
ADD CONSTRAINT "programs_requested_amil_platform_percentage_range"
  CHECK (
    "requestedAmilPlatformPercentage" IS NULL
    OR (
      "requestedAmilPlatformPercentage" >= 0
      AND "requestedAmilPlatformPercentage" <= 100
    )
  ),
ADD CONSTRAINT "programs_amil_total_within_snapshot_limit"
  CHECK (
    COALESCE("requestedAmilPlatformPercentage", "amilPlatformPercentage")
      + "amilInstitutionPercentage"
      <= "amilMaxTotalPercentage"
  );
