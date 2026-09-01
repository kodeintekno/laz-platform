-- Enforce one active default payout account per Lembaga and keep pending
-- Lembaga books free of orphaned active detail accounts.
CREATE UNIQUE INDEX "lembaga_bank_accounts_one_active_default_per_lembaga"
  ON "lembaga_bank_accounts"("lembagaId")
  WHERE "isDefault" = TRUE AND "isActive" = TRUE;

UPDATE "chart_of_accounts" child
SET "isActive" = FALSE, "updatedAt" = CURRENT_TIMESTAMP
WHERE child."code" = '110399'
  AND NOT EXISTS (
    SELECT 1 FROM "chart_of_accounts" parent
    WHERE parent."accountingBookId" = child."accountingBookId"
      AND parent."code" = '1103' AND parent."isActive" = TRUE
  );
