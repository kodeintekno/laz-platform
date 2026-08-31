-- Merge the former INFAK and SEDEKAH program categories into one canonical
-- INFAK_SODAKOH category. Existing program snapshots and transaction amounts
-- are preserved; when duplicate settings exist, the former INFAK setting is
-- retained as the canonical configuration.

DELETE FROM "amil_global_settings" AS sedekah
WHERE sedekah."category" = 'SEDEKAH'
  AND EXISTS (
    SELECT 1
    FROM "amil_global_settings" AS infak
    WHERE infak."category" = 'INFAK'
  );

UPDATE "amil_global_settings"
SET "category" = 'INFAK'
WHERE "category" = 'SEDEKAH';

DELETE FROM "amil_institution_settings" AS sedekah
WHERE sedekah."category" = 'SEDEKAH'
  AND EXISTS (
    SELECT 1
    FROM "amil_institution_settings" AS infak
    WHERE infak."lembagaId" = sedekah."lembagaId"
      AND infak."category" = 'INFAK'
  );

UPDATE "amil_institution_settings"
SET "category" = 'INFAK'
WHERE "category" = 'SEDEKAH';

-- The database enforces one PENDING request per institution/category. Two
-- legacy requests (one INFAK and one SEDEKAH) would collide after the merge.
-- Keep the request for the canonical INFAK configuration and close only the
-- duplicate; if no INFAK request exists, the newest SEDEKAH request survives.
WITH ranked_pending_requests AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "lembagaId"
      ORDER BY
        CASE WHEN "category" = 'INFAK' THEN 0 ELSE 1 END,
        "createdAt" DESC,
        "id" DESC
    ) AS request_rank
  FROM "amil_platform_change_requests"
  WHERE "status" = 'PENDING'
    AND "category" IN ('INFAK', 'SEDEKAH')
)
UPDATE "amil_platform_change_requests" AS request
SET
  "status" = 'REJECTED',
  "reviewNote" = 'Ditutup otomatis karena kategori Infak dan Sedekah digabung menjadi Infak/Sodakoh.',
  "reviewedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
FROM ranked_pending_requests AS ranked
WHERE request."id" = ranked."id"
  AND ranked.request_rank > 1;

-- Rebuild the PostgreSQL enum so the two legacy values disappear completely.
ALTER TYPE "ProgramCategory" RENAME TO "ProgramCategory_old";

CREATE TYPE "ProgramCategory" AS ENUM (
  'ZAKAT',
  'INFAK_SODAKOH',
  'WAKAF',
  'CSR',
  'DSKL'
);

ALTER TABLE "programs"
  ALTER COLUMN "category" TYPE "ProgramCategory"
  USING (
    CASE
      WHEN "category"::text IN ('INFAK', 'SEDEKAH') THEN 'INFAK_SODAKOH'
      ELSE "category"::text
    END
  )::"ProgramCategory";

ALTER TABLE "amil_global_settings"
  ALTER COLUMN "category" TYPE "ProgramCategory"
  USING (
    CASE
      WHEN "category"::text IN ('INFAK', 'SEDEKAH') THEN 'INFAK_SODAKOH'
      ELSE "category"::text
    END
  )::"ProgramCategory";

ALTER TABLE "amil_institution_settings"
  ALTER COLUMN "category" TYPE "ProgramCategory"
  USING (
    CASE
      WHEN "category"::text IN ('INFAK', 'SEDEKAH') THEN 'INFAK_SODAKOH'
      ELSE "category"::text
    END
  )::"ProgramCategory";

ALTER TABLE "amil_platform_change_requests"
  ALTER COLUMN "category" TYPE "ProgramCategory"
  USING (
    CASE
      WHEN "category"::text IN ('INFAK', 'SEDEKAH') THEN 'INFAK_SODAKOH'
      ELSE "category"::text
    END
  )::"ProgramCategory";

DROP TYPE "ProgramCategory_old";

-- Consolidate each Sedekah COA into its Infak counterpart. If a tenant only
-- has the legacy Sedekah account, keep its ID and turn it into the canonical
-- account so historical journal relations remain valid.
UPDATE "chart_of_accounts" AS legacy
SET
  "code" = mapping."canonicalCode",
  "name" = mapping."canonicalName",
  "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('3103', '3102', 'Dana Infak/Sodakoh'),
    ('4103', '4102', 'Penerimaan Infak/Sodakoh'),
    ('5103', '5102', 'Penyaluran Infak/Sodakoh')
) AS mapping("legacyCode", "canonicalCode", "canonicalName")
WHERE legacy."code" = mapping."legacyCode"
  AND NOT EXISTS (
    SELECT 1
    FROM "chart_of_accounts" AS canonical
    WHERE canonical."lembagaId" = legacy."lembagaId"
      AND canonical."code" = mapping."canonicalCode"
  );

UPDATE "journal_details" AS detail
SET "accountId" = canonical."id"
FROM "chart_of_accounts" AS legacy
JOIN (
  VALUES ('3103', '3102'), ('4103', '4102'), ('5103', '5102')
) AS mapping("legacyCode", "canonicalCode")
  ON legacy."code" = mapping."legacyCode"
JOIN "chart_of_accounts" AS canonical
  ON canonical."lembagaId" = legacy."lembagaId"
 AND canonical."code" = mapping."canonicalCode"
WHERE detail."accountId" = legacy."id";

UPDATE "chart_of_accounts"
SET "parentCode" = CASE "parentCode"
  WHEN '3103' THEN '3102'
  WHEN '4103' THEN '4102'
  WHEN '5103' THEN '5102'
  ELSE "parentCode"
END
WHERE "parentCode" IN ('3103', '4103', '5103');

DELETE FROM "chart_of_accounts"
WHERE "code" IN ('3103', '4103', '5103');

UPDATE "chart_of_accounts"
SET
  "name" = CASE "code"
    WHEN '3102' THEN 'Dana Infak/Sodakoh'
    WHEN '4102' THEN 'Penerimaan Infak/Sodakoh'
    WHEN '5102' THEN 'Penyaluran Infak/Sodakoh'
    ELSE "name"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" IN ('3102', '4102', '5102');
