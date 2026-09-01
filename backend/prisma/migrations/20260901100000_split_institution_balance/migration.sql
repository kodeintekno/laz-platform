-- Saldo penarikan tetap disimpan sebagai nilai gabungan pada balance dan
-- reservedBalance. Kolom berikut memisahkan hak dana mustahiq dan amil lembaga.
ALTER TABLE "institution_balances"
  ADD COLUMN "mustahiqBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "amilBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "reservedMustahiqBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "reservedAmilBalance" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Rekonstruksi saldo historis dari split donasi. Penarikan historis dialokasikan
-- ke dana mustahiq terlebih dahulu; baris legacy tanpa data donasi dianggap
-- seluruhnya sebagai dana mustahiq.
WITH donation_totals AS (
  SELECT
    "lembagaId",
    COALESCE(SUM("netAmount"), 0) AS mustahiq_gross,
    COALESCE(SUM("amilInstitutionAmount"), 0) AS amil_gross
  FROM "donations"
  WHERE "status" = 'PAID'
  GROUP BY "lembagaId"
), remaining AS (
  SELECT
    balance.id,
    balance."balance" + balance."reservedBalance" AS total_remaining,
    balance."reservedBalance" AS total_reserved,
    CASE
      WHEN COALESCE(donations.mustahiq_gross + donations.amil_gross, 0) = 0
        THEN balance."balance" + balance."reservedBalance"
      ELSE LEAST(
        balance."balance" + balance."reservedBalance",
        GREATEST(
          COALESCE(donations.mustahiq_gross, 0)
            - GREATEST(
              COALESCE(donations.mustahiq_gross + donations.amil_gross, 0)
                - (balance."balance" + balance."reservedBalance"),
              0
            ),
          0
        )
      )
    END AS mustahiq_remaining
  FROM "institution_balances" balance
  LEFT JOIN donation_totals donations ON donations."lembagaId" = balance."lembagaId"
), allocated AS (
  SELECT
    id,
    mustahiq_remaining,
    total_remaining - mustahiq_remaining AS amil_remaining,
    LEAST(total_reserved, mustahiq_remaining) AS mustahiq_reserved,
    total_reserved - LEAST(total_reserved, mustahiq_remaining) AS amil_reserved
  FROM remaining
)
UPDATE "institution_balances" balance
SET
  "mustahiqBalance" = allocated.mustahiq_remaining - allocated.mustahiq_reserved,
  "amilBalance" = allocated.amil_remaining - allocated.amil_reserved,
  "reservedMustahiqBalance" = allocated.mustahiq_reserved,
  "reservedAmilBalance" = allocated.amil_reserved
FROM allocated
WHERE balance.id = allocated.id;

ALTER TABLE "institution_balances"
  ADD CONSTRAINT "institution_balances_available_components_check"
    CHECK ("balance" = "mustahiqBalance" + "amilBalance"),
  ADD CONSTRAINT "institution_balances_reserved_components_check"
    CHECK ("reservedBalance" = "reservedMustahiqBalance" + "reservedAmilBalance"),
  ADD CONSTRAINT "institution_balances_components_nonnegative_check"
    CHECK (
      "mustahiqBalance" >= 0
      AND "amilBalance" >= 0
      AND "reservedMustahiqBalance" >= 0
      AND "reservedAmilBalance" >= 0
    );
