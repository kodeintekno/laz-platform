-- Penarikan baru wajib memakai saldo gateway yang terisolasi per program.
CREATE TABLE "program_balances" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "lembagaId" TEXT NOT NULL,
  "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "mustahiqBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "amilBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "reservedBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "reservedMustahiqBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "reservedAmilBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "program_balances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "program_balances_available_components_check"
    CHECK ("balance" = "mustahiqBalance" + "amilBalance"),
  CONSTRAINT "program_balances_reserved_components_check"
    CHECK ("reservedBalance" = "reservedMustahiqBalance" + "reservedAmilBalance"),
  CONSTRAINT "program_balances_nonnegative_check"
    CHECK (
      "balance" >= 0
      AND "mustahiqBalance" >= 0
      AND "amilBalance" >= 0
      AND "reservedBalance" >= 0
      AND "reservedMustahiqBalance" >= 0
      AND "reservedAmilBalance" >= 0
    )
);

CREATE UNIQUE INDEX "program_balances_programId_key" ON "program_balances"("programId");
CREATE UNIQUE INDEX "program_balances_programId_lembagaId_key" ON "program_balances"("programId", "lembagaId");
CREATE INDEX "program_balances_lembagaId_idx" ON "program_balances"("lembagaId");
CREATE UNIQUE INDEX "programs_id_lembagaId_key" ON "programs"("id", "lembagaId");
ALTER TABLE "program_balances"
  ADD CONSTRAINT "program_balances_programId_fkey"
  FOREIGN KEY ("programId", "lembagaId") REFERENCES "programs"("id", "lembagaId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_balances"
  ADD CONSTRAINT "program_balances_lembagaId_fkey"
  FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill hanya saldo TERSEDIA yang masih ada pada InstitutionBalance.
-- Reservasi withdrawal lama tetap ditangani sebagai reservasi legacy; jika
-- kelak dilepas, service akan mengkreditkannya ke satu program secara eksplisit.
WITH program_gross AS (
  SELECT
    program."id" AS "programId",
    program."lembagaId",
    program."createdAt",
    COALESCE(SUM(donation."netAmount") FILTER (WHERE donation."status" = 'PAID'), 0) AS mustahiq_gross,
    COALESCE(SUM(donation."amilInstitutionAmount") FILTER (WHERE donation."status" = 'PAID'), 0) AS amil_gross
  FROM "programs" program
  LEFT JOIN "donations" donation ON donation."programId" = program."id"
  GROUP BY program."id", program."lembagaId", program."createdAt"
), running AS (
  SELECT
    gross.*,
    ROW_NUMBER() OVER (PARTITION BY gross."lembagaId" ORDER BY gross."createdAt", gross."programId") AS sequence,
    COALESCE(SUM(gross.mustahiq_gross) OVER (
      PARTITION BY gross."lembagaId" ORDER BY gross."createdAt", gross."programId"
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ), 0) AS prior_mustahiq,
    COALESCE(SUM(gross.amil_gross) OVER (
      PARTITION BY gross."lembagaId" ORDER BY gross."createdAt", gross."programId"
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ), 0) AS prior_amil,
    COALESCE(SUM(gross.mustahiq_gross) OVER (PARTITION BY gross."lembagaId"), 0) AS total_mustahiq_gross,
    COALESCE(SUM(gross.amil_gross) OVER (PARTITION BY gross."lembagaId"), 0) AS total_amil_gross
  FROM program_gross gross
), allocated AS (
  SELECT
    running."programId",
    running."lembagaId",
    GREATEST(
      LEAST(running.mustahiq_gross, balance."mustahiqBalance" - running.prior_mustahiq),
      0
    ) + CASE
      WHEN running.sequence = 1 AND balance."mustahiqBalance" > running.total_mustahiq_gross
        THEN balance."mustahiqBalance" - running.total_mustahiq_gross
      ELSE 0
    END AS mustahiq_balance,
    GREATEST(
      LEAST(running.amil_gross, balance."amilBalance" - running.prior_amil),
      0
    ) + CASE
      WHEN running.sequence = 1 AND balance."amilBalance" > running.total_amil_gross
        THEN balance."amilBalance" - running.total_amil_gross
      ELSE 0
    END AS amil_balance
  FROM running
  INNER JOIN "institution_balances" balance ON balance."lembagaId" = running."lembagaId"
)
INSERT INTO "program_balances" (
  "id", "programId", "lembagaId", "balance", "mustahiqBalance", "amilBalance", "updatedAt"
)
SELECT
  'pb_' || md5(allocated."programId"),
  allocated."programId",
  allocated."lembagaId",
  allocated.mustahiq_balance + allocated.amil_balance,
  allocated.mustahiq_balance,
  allocated.amil_balance,
  CURRENT_TIMESTAMP
FROM allocated
WHERE allocated.mustahiq_balance + allocated.amil_balance > 0;

ALTER TABLE "withdrawals"
  ADD COLUMN "programId" TEXT,
  ADD COLUMN "mustahiqAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "amilAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

CREATE INDEX "withdrawals_programId_idx" ON "withdrawals"("programId");
ALTER TABLE "withdrawals"
  ADD CONSTRAINT "withdrawals_programId_fkey"
  FOREIGN KEY ("programId", "lembagaId") REFERENCES "programs"("id", "lembagaId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawals"
  ADD CONSTRAINT "withdrawals_amount_components_check"
  CHECK (
    "mustahiqAmount" >= 0
    AND "amilAmount" >= 0
    AND (
      "isPlatform" = TRUE
      OR "programId" IS NULL
      OR "amount" = "mustahiqAmount" + "amilAmount"
    )
  );

-- Satu Lembaga hanya boleh mempunyai satu rekening. Rekening aktif/default
-- diprioritaskan; snapshot rekening pada withdrawal lama tetap tersimpan.
WITH ranked AS (
  SELECT
    bank."id",
    bank."chartOfAccountId",
    ROW_NUMBER() OVER (
      PARTITION BY bank."lembagaId"
      ORDER BY bank."isActive" DESC, bank."isDefault" DESC, bank."createdAt", bank."id"
    ) AS position
  FROM "lembaga_bank_accounts" bank
), deactivated_coa AS (
  UPDATE "chart_of_accounts" coa
  SET "isActive" = FALSE
  FROM ranked
  WHERE ranked.position > 1 AND coa."id" = ranked."chartOfAccountId"
  RETURNING coa."id"
)
DELETE FROM "lembaga_bank_accounts" bank
USING ranked
WHERE ranked.position > 1 AND bank."id" = ranked."id";

UPDATE "lembaga_bank_accounts"
SET "isActive" = TRUE, "isDefault" = TRUE;

UPDATE "lembagas" lembaga
SET
  "bankCode" = bank."bankCode",
  "accountNumber" = bank."accountNumber",
  "accountHolder" = bank."accountHolder"
FROM "lembaga_bank_accounts" bank
WHERE bank."lembagaId" = lembaga."id";

DROP INDEX "lembaga_bank_accounts_lembagaId_accountNumber_key";
CREATE UNIQUE INDEX "lembaga_bank_accounts_lembagaId_key"
  ON "lembaga_bank_accounts"("lembagaId");
