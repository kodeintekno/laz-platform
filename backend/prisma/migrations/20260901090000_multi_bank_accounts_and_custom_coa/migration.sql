-- Lembaga may extend the core COA and maintain multiple payout bank accounts.
-- Every bank account is linked to its own posting account under 1103.

DROP INDEX IF EXISTS "chart_of_accounts_accountingBookId_key_key";

UPDATE "chart_of_accounts"
SET "key" = 'BANK_ACCOUNTS', "name" = 'Rekening Bank', "isHeader" = TRUE,
    "isEditable" = FALSE, "isDeletable" = FALSE, "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = '1103';

INSERT INTO "chart_of_accounts" (
  "id", "accountingBookId", "lembagaId", "key", "code", "name",
  "accountType", "normalBalance", "isHeader", "parentCode", "level",
  "isSystem", "isEditable", "isDeletable", "isActive", "createdAt", "updatedAt"
)
SELECT
  'coa-bank-operational-' || book."id", book."id", book."lembagaId", 'BANK',
  '110399', 'Bank Operasional', 'ASSET', 'DEBIT', FALSE, '1103', 4,
  TRUE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "accounting_books" book
WHERE NOT EXISTS (
  SELECT 1 FROM "chart_of_accounts" account
  WHERE account."accountingBookId" = book."id" AND account."code" = '110399'
);

CREATE UNIQUE INDEX "chart_of_accounts_accountingBookId_key_key"
  ON "chart_of_accounts"("accountingBookId", "key");

CREATE TABLE "lembaga_bank_accounts" (
  "id" TEXT NOT NULL,
  "lembagaId" TEXT NOT NULL,
  "chartOfAccountId" TEXT NOT NULL,
  "bankCode" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "accountHolder" TEXT NOT NULL,
  "label" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lembaga_bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lembaga_bank_accounts_chartOfAccountId_key"
  ON "lembaga_bank_accounts"("chartOfAccountId");
CREATE UNIQUE INDEX "lembaga_bank_accounts_lembagaId_accountNumber_key"
  ON "lembaga_bank_accounts"("lembagaId", "accountNumber");
CREATE INDEX "lembaga_bank_accounts_lembagaId_isActive_idx"
  ON "lembaga_bank_accounts"("lembagaId", "isActive");

ALTER TABLE "lembaga_bank_accounts"
  ADD CONSTRAINT "lembaga_bank_accounts_lembagaId_fkey"
  FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lembaga_bank_accounts"
  ADD CONSTRAINT "lembaga_bank_accounts_chartOfAccountId_fkey"
  FOREIGN KEY ("chartOfAccountId") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve the former single bank account as the first/default account.
INSERT INTO "chart_of_accounts" (
  "id", "accountingBookId", "lembagaId", "key", "code", "name",
  "accountType", "normalBalance", "isHeader", "parentCode", "level",
  "isSystem", "isEditable", "isDeletable", "isActive", "createdAt", "updatedAt"
)
SELECT
  'coa-bank-legacy-' || lembaga."id", book."id", lembaga."id",
  'BANK_ACCOUNT_LEGACY_' || replace(lembaga."id", '-', ''), '110301',
  'Bank ' || replace(lembaga."bankCode", 'ID_', '') || ' - ' || right(lembaga."accountNumber", 4),
  'ASSET', 'DEBIT', FALSE, '1103', 4, FALSE, FALSE, FALSE, TRUE,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "lembagas" lembaga
JOIN "accounting_books" book ON book."lembagaId" = lembaga."id"
WHERE lembaga."bankCode" IS NOT NULL
  AND lembaga."accountNumber" IS NOT NULL
  AND lembaga."accountHolder" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "chart_of_accounts" account
    WHERE account."accountingBookId" = book."id" AND account."code" = '110301'
  );

INSERT INTO "lembaga_bank_accounts" (
  "id", "lembagaId", "chartOfAccountId", "bankCode", "accountNumber",
  "accountHolder", "isDefault", "isActive", "createdAt", "updatedAt"
)
SELECT
  'bank-legacy-' || lembaga."id", lembaga."id", account."id",
  lembaga."bankCode", lembaga."accountNumber", lembaga."accountHolder",
  TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "lembagas" lembaga
JOIN "accounting_books" book ON book."lembagaId" = lembaga."id"
JOIN "chart_of_accounts" account
  ON account."accountingBookId" = book."id" AND account."code" = '110301'
WHERE lembaga."bankCode" IS NOT NULL
  AND lembaga."accountNumber" IS NOT NULL
  AND lembaga."accountHolder" IS NOT NULL
ON CONFLICT ("lembagaId", "accountNumber") DO NOTHING;

ALTER TABLE "withdrawals" ADD COLUMN "bankAccountId" TEXT;
UPDATE "withdrawals" withdrawal
SET "bankAccountId" = bank."id"
FROM "lembaga_bank_accounts" bank
WHERE bank."lembagaId" = withdrawal."lembagaId" AND bank."isDefault" = TRUE;
CREATE INDEX "withdrawals_bankAccountId_idx" ON "withdrawals"("bankAccountId");
ALTER TABLE "withdrawals"
  ADD CONSTRAINT "withdrawals_bankAccountId_fkey"
  FOREIGN KEY ("bankAccountId") REFERENCES "lembaga_bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
