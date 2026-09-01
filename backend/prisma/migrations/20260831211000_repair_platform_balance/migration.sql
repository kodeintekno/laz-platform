-- Repair drift introduced by 20260825075849, which dropped this table after
-- it had been created by 20260820075509. Safe on both fresh and existing DBs.
CREATE TABLE IF NOT EXISTS "platform_balances" (
  "id" TEXT NOT NULL DEFAULT 'platform',
  "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "reservedBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
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
