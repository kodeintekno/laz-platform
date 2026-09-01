-- Separate the Platform ledger from each Lembaga ledger and migrate the COA
-- to the online-payment-gateway model. Historical accounts are retained and
-- merely deactivated when they are no longer part of the active template.

CREATE TYPE "AccountingBookOwnerType" AS ENUM ('PLATFORM', 'LEMBAGA');

CREATE TABLE "accounting_books" (
  "id" TEXT NOT NULL,
  "ownerType" "AccountingBookOwnerType" NOT NULL,
  "lembagaId" TEXT,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "accounting_books_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounting_books_lembagaId_key" ON "accounting_books"("lembagaId");
CREATE INDEX "accounting_books_ownerType_idx" ON "accounting_books"("ownerType");
ALTER TABLE "accounting_books" ADD CONSTRAINT "accounting_books_lembagaId_fkey"
  FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "accounting_books" ("id", "ownerType", "lembagaId", "name")
VALUES ('book-platform', 'PLATFORM', NULL, 'Buku Platform');

INSERT INTO "accounting_books" ("id", "ownerType", "lembagaId", "name")
SELECT 'book-' || "id", 'LEMBAGA', "id", 'Buku Lembaga ' || "name"
FROM "lembagas";

ALTER TABLE "chart_of_accounts"
  ADD COLUMN "accountingBookId" TEXT,
  ADD COLUMN "key" TEXT;

UPDATE "chart_of_accounts" AS account
SET
  "accountingBookId" = book."id",
  "key" = CASE account."code"
    WHEN '1000' THEN 'ASSETS'
    WHEN '1100' THEN 'CASH_AND_BANK'
    WHEN '1103' THEN 'BANK'
    WHEN '1110' THEN 'RECEIVABLES'
    WHEN '1111' THEN 'PAYMENT_GATEWAY_RECEIVABLE'
    WHEN '1200' THEN 'FIXED_ASSETS'
    WHEN '1201' THEN 'FIXED_ASSET_EQUIPMENT'
    WHEN '1291' THEN 'ACCUMULATED_DEPRECIATION'
    WHEN '2000' THEN 'LIABILITIES'
    WHEN '2101' THEN 'OPERATING_PAYABLE'
    WHEN '2103' THEN 'TAX_PAYABLE'
    WHEN '2104' THEN 'OTHER_PAYABLE'
    WHEN '3000' THEN 'FUND_BALANCES'
    WHEN '3101' THEN 'ZAKAT_FUND'
    WHEN '3102' THEN 'INFAK_SEDEKAH_FUND'
    WHEN '3104' THEN 'WAKAF_FUND'
    WHEN '3105' THEN 'AMIL_FUND'
    WHEN '3106' THEN 'NON_HALAL_FUND'
    WHEN '3107' THEN 'CSR_FUND'
    WHEN '3108' THEN 'DSKL_FUND'
    WHEN '4000' THEN 'REVENUE'
    WHEN '4101' THEN 'ZAKAT_REVENUE'
    WHEN '4102' THEN 'INFAK_SEDEKAH_REVENUE'
    WHEN '4104' THEN 'WAKAF_REVENUE'
    WHEN '4105' THEN 'AMIL_REVENUE'
    WHEN '4107' THEN 'OTHER_REVENUE'
    WHEN '4108' THEN 'CSR_REVENUE'
    WHEN '4109' THEN 'DSKL_REVENUE'
    WHEN '5000' THEN 'DISTRIBUTIONS'
    WHEN '5101' THEN 'ZAKAT_DISTRIBUTION'
    WHEN '5102' THEN 'INFAK_SEDEKAH_DISTRIBUTION'
    WHEN '5104' THEN 'WAKAF_DISTRIBUTION'
    WHEN '5105' THEN 'CSR_DISTRIBUTION'
    WHEN '5106' THEN 'DSKL_DISTRIBUTION'
    WHEN '6000' THEN 'OPERATING_EXPENSES'
    WHEN '6101' THEN 'SALARY_EXPENSE'
    WHEN '6102' THEN 'UTILITIES_EXPENSE'
    WHEN '6105' THEN 'OFFICE_ADMIN_EXPENSE'
    WHEN '6106' THEN 'TRANSPORT_EXPENSE'
    WHEN '6107' THEN 'BANK_GATEWAY_EXPENSE'
    WHEN '6109' THEN 'MAINTENANCE_EXPENSE'
    WHEN '6110' THEN 'DEPRECIATION_EXPENSE'
    WHEN '6113' THEN 'OTHER_OPERATING_EXPENSE'
    WHEN '6114' THEN 'PLATFORM_AMIL_EXPENSE'
    ELSE 'LEGACY_' || account."code"
  END
FROM "accounting_books" AS book
WHERE book."lembagaId" = account."lembagaId";

UPDATE "chart_of_accounts" AS account
SET
  "name" = template."name",
  "parentCode" = template."parentCode",
  "level" = template."level",
  "isHeader" = template."isHeader",
  "isActive" = TRUE,
  "updatedAt" = CURRENT_TIMESTAMP
FROM (VALUES
  ('1000','Aset',NULL,1,TRUE), ('1100','Kas dan Bank','1000',2,TRUE),
  ('1103','Bank','1100',3,FALSE), ('1110','Piutang','1000',2,TRUE),
  ('1111','Piutang Payment Gateway','1110',3,FALSE),
  ('1200','Aset Tetap','1000',2,TRUE), ('1201','Peralatan dan Aset Tetap','1200',3,FALSE),
  ('1291','Akumulasi Penyusutan Aset Tetap','1200',3,FALSE),
  ('2000','Kewajiban',NULL,1,TRUE), ('2101','Utang Operasional','2000',2,FALSE),
  ('2103','Utang Pajak','2000',2,FALSE), ('2104','Utang Lain-lain','2000',2,FALSE),
  ('3000','Saldo Dana',NULL,1,TRUE), ('3101','Dana Zakat','3000',2,FALSE),
  ('3102','Dana Infak/Sedekah','3000',2,FALSE), ('3104','Dana Wakaf','3000',2,FALSE),
  ('3105','Dana Amil','3000',2,FALSE), ('3106','Dana Nonhalal','3000',2,FALSE),
  ('3107','Dana CSR','3000',2,FALSE), ('3108','Dana DSKL','3000',2,FALSE),
  ('4000','Penerimaan Dana',NULL,1,TRUE), ('4101','Penerimaan Zakat','4000',2,FALSE),
  ('4102','Penerimaan Infak/Sedekah','4000',2,FALSE), ('4104','Penerimaan Wakaf','4000',2,FALSE),
  ('4105','Penerimaan Dana Amil','4000',2,FALSE), ('4107','Penerimaan Lainnya','4000',2,FALSE),
  ('4108','Penerimaan CSR','4000',2,FALSE), ('4109','Penerimaan DSKL','4000',2,FALSE),
  ('5000','Penyaluran Dana',NULL,1,TRUE), ('5101','Penyaluran Zakat','5000',2,FALSE),
  ('5102','Penyaluran Infak/Sedekah','5000',2,FALSE), ('5104','Penyaluran Wakaf','5000',2,FALSE),
  ('5105','Penyaluran CSR','5000',2,FALSE), ('5106','Penyaluran DSKL','5000',2,FALSE),
  ('6000','Beban Operasional',NULL,1,TRUE), ('6101','Beban Gaji dan Honor','6000',2,FALSE),
  ('6102','Beban Utilitas dan Komunikasi','6000',2,FALSE),
  ('6105','Beban Administrasi Kantor','6000',2,FALSE),
  ('6106','Beban Transportasi','6000',2,FALSE),
  ('6107','Beban Bank dan Payment Gateway','6000',2,FALSE),
  ('6109','Beban Pemeliharaan','6000',2,FALSE),
  ('6110','Beban Penyusutan Aset Tetap','6000',2,FALSE),
  ('6113','Beban Operasional Lainnya','6000',2,FALSE),
  ('6114','Beban Amil Platform','6000',2,FALSE)
) AS template("code","name","parentCode","level","isHeader")
WHERE account."code" = template."code";

UPDATE "chart_of_accounts"
SET "isActive" = FALSE, "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" NOT IN (
  '1000','1100','1103','1110','1111','1200','1201','1291',
  '2000','2101','2103','2104','3000','3101','3102','3104','3105','3106','3107','3108',
  '4000','4101','4102','4104','4105','4107','4108','4109',
  '5000','5101','5102','5104','5105','5106','6000','6101','6102','6105','6106','6107','6109','6110','6113','6114'
);

ALTER TABLE "chart_of_accounts" ALTER COLUMN "accountingBookId" SET NOT NULL;
ALTER TABLE "chart_of_accounts" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "chart_of_accounts" ALTER COLUMN "lembagaId" DROP NOT NULL;
DROP INDEX "chart_of_accounts_lembagaId_code_key";
CREATE UNIQUE INDEX "chart_of_accounts_accountingBookId_code_key" ON "chart_of_accounts"("accountingBookId", "code");
CREATE UNIQUE INDEX "chart_of_accounts_accountingBookId_key_key" ON "chart_of_accounts"("accountingBookId", "key");
CREATE INDEX "chart_of_accounts_accountingBookId_idx" ON "chart_of_accounts"("accountingBookId");
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_accountingBookId_fkey"
  FOREIGN KEY ("accountingBookId") REFERENCES "accounting_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "journals"
  ADD COLUMN "accountingBookId" TEXT,
  ADD COLUMN "sourceEvent" TEXT NOT NULL DEFAULT 'PRIMARY';

UPDATE "journals" AS journal
SET "accountingBookId" = book."id"
FROM "accounting_books" AS book
WHERE book."lembagaId" = journal."lembagaId";

ALTER TABLE "journals" ALTER COLUMN "accountingBookId" SET NOT NULL;
ALTER TABLE "journals" ALTER COLUMN "lembagaId" DROP NOT NULL;
DROP INDEX "journals_lembagaId_journalNo_key";
DROP INDEX "journals_sourceType_sourceId_key";
CREATE UNIQUE INDEX "journals_accountingBookId_journalNo_key" ON "journals"("accountingBookId", "journalNo");
CREATE UNIQUE INDEX "journals_accountingBookId_sourceType_sourceId_sourceEvent_key"
  ON "journals"("accountingBookId", "sourceType", "sourceId", "sourceEvent");
CREATE INDEX "journals_accountingBookId_idx" ON "journals"("accountingBookId");
ALTER TABLE "journals" ADD CONSTRAINT "journals_accountingBookId_fkey"
  FOREIGN KEY ("accountingBookId") REFERENCES "accounting_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "programs" ADD COLUMN "programFundAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
UPDATE "programs" AS program
SET "programFundAmount" = COALESCE(donation_totals."amount", 0)
FROM (
  SELECT "programId", SUM("netAmount") AS "amount"
  FROM "donations"
  WHERE "status" = 'PAID'
  GROUP BY "programId"
) AS donation_totals
WHERE donation_totals."programId" = program."id";

CREATE TABLE IF NOT EXISTS "platform_balances" (
  "id" TEXT NOT NULL DEFAULT 'platform',
  "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "bankCode" TEXT,
  "accountNumber" TEXT,
  "accountHolder" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_balances_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "platform_balances"
  ADD COLUMN IF NOT EXISTS "reservedBalance" DECIMAL(15,2) NOT NULL DEFAULT 0;

INSERT INTO "platform_balances" ("id", "balance", "reservedBalance", "updatedAt")
SELECT 'platform', COALESCE(SUM("amilPlatformAmount"), 0), 0, CURRENT_TIMESTAMP
FROM "donations"
WHERE "status" = 'PAID'
ON CONFLICT ("id") DO UPDATE
SET "balance" = EXCLUDED."balance", "updatedAt" = CURRENT_TIMESTAMP;
