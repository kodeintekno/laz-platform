-- Nilai historis dari donasi lama dapat lebih besar dari batas global yang
-- berlaku sekarang. Pertahankan snapshot historis dengan menaikkan batas
-- snapshot program ke total aktualnya, tanpa mengubah persentase transaksi.
UPDATE "programs"
SET "amilMaxTotalPercentage" = "amilPlatformPercentage" + "amilInstitutionPercentage"
WHERE "amilMaxTotalPercentage" < "amilPlatformPercentage" + "amilInstitutionPercentage";

ALTER TABLE "programs"
ADD CONSTRAINT "programs_amil_platform_percentage_range"
  CHECK ("amilPlatformPercentage" >= 0 AND "amilPlatformPercentage" <= 100),
ADD CONSTRAINT "programs_amil_institution_percentage_range"
  CHECK ("amilInstitutionPercentage" >= 0 AND "amilInstitutionPercentage" <= 100),
ADD CONSTRAINT "programs_amil_max_total_percentage_range"
  CHECK ("amilMaxTotalPercentage" >= 0 AND "amilMaxTotalPercentage" <= 100),
ADD CONSTRAINT "programs_amil_total_within_snapshot_limit"
  CHECK ("amilPlatformPercentage" + "amilInstitutionPercentage" <= "amilMaxTotalPercentage");
