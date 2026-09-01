CREATE TYPE "DistributionFundSource" AS ENUM ('MUSTAHIQ', 'AMIL');

ALTER TABLE "distributions"
  ADD COLUMN "fundSource" "DistributionFundSource" NOT NULL DEFAULT 'MUSTAHIQ';

ALTER TABLE "programs"
  ADD COLUMN "mustahiqDistributedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "amilDistributedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Seluruh penyaluran lama berasal dari saldo program/mustahiq karena sebelum
-- migrasi belum tersedia pilihan sumber dana amil.
UPDATE "programs"
SET "mustahiqDistributedAmount" = "distributedAmount";

ALTER TABLE "programs"
  ADD CONSTRAINT "programs_distribution_components_check"
    CHECK ("distributedAmount" = "mustahiqDistributedAmount" + "amilDistributedAmount"),
  ADD CONSTRAINT "programs_distribution_components_nonnegative_check"
    CHECK ("mustahiqDistributedAmount" >= 0 AND "amilDistributedAmount" >= 0);
