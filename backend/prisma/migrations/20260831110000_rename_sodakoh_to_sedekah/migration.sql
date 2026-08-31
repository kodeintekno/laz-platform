-- Standardize the combined category spelling without changing any category
-- relationships, percentages, program snapshots, or accounting balances.
ALTER TYPE "ProgramCategory"
  RENAME VALUE 'INFAK_SODAKOH' TO 'INFAK_SEDEKAH';

UPDATE "chart_of_accounts"
SET
  "name" = CASE "code"
    WHEN '3102' THEN 'Dana Infak/Sedekah'
    WHEN '4102' THEN 'Penerimaan Infak/Sedekah'
    WHEN '5102' THEN 'Penyaluran Infak/Sedekah'
    ELSE "name"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" IN ('3102', '4102', '5102');

-- Correct text created by the previous terminology in existing local or
-- production data. Financial values and foreign-key relationships are untouched.
UPDATE "programs"
SET
  "title" = REPLACE("title", 'Sodakoh', 'Sedekah'),
  "description" = REPLACE("description", 'Sodakoh', 'Sedekah'),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "title" LIKE '%Sodakoh%'
   OR "description" LIKE '%Sodakoh%';

UPDATE "lembagas"
SET
  "description" = REPLACE("description", 'Sodakoh', 'Sedekah'),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "description" LIKE '%Sodakoh%';

UPDATE "donations"
SET
  "message" = REPLACE("message", 'Sodakoh', 'Sedekah'),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "message" LIKE '%Sodakoh%';

UPDATE "amil_platform_change_requests"
SET
  "reason" = REPLACE("reason", 'Sodakoh', 'Sedekah'),
  "reviewNote" = REPLACE("reviewNote", 'Sodakoh', 'Sedekah'),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "reason" LIKE '%Sodakoh%'
   OR "reviewNote" LIKE '%Sodakoh%';

-- Update the known sample slug only when it cannot collide with an existing
-- slug for the same institution.
UPDATE "programs" AS program
SET
  "slug" = 'infak-sedekah-air-bersih',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE program."slug" = 'infak-sodakoh-air-bersih'
  AND NOT EXISTS (
    SELECT 1
    FROM "programs" AS existing
    WHERE existing."lembagaId" = program."lembagaId"
      AND existing."slug" = 'infak-sedekah-air-bersih'
  );
