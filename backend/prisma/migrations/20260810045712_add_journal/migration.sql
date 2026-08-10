-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "JournalSourceType" AS ENUM ('MANUAL', 'DONATION', 'DISTRIBUTION', 'REFUND', 'EXPENSE', 'ASSET_PURCHASE');

-- CreateTable
CREATE TABLE "journals" (
    "id" TEXT NOT NULL,
    "lembagaId" TEXT NOT NULL,
    "journalNo" TEXT NOT NULL,
    "journalDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "sourceType" "JournalSourceType" NOT NULL DEFAULT 'MANUAL',
    "sourceId" TEXT,
    "programId" TEXT,
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "postedById" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_details" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journals_lembagaId_idx" ON "journals"("lembagaId");

-- CreateIndex
CREATE INDEX "journals_lembagaId_status_idx" ON "journals"("lembagaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "journals_lembagaId_journalNo_key" ON "journals"("lembagaId", "journalNo");

-- CreateIndex
CREATE INDEX "journal_details_journalId_idx" ON "journal_details"("journalId");

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_details" ADD CONSTRAINT "journal_details_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_details" ADD CONSTRAINT "journal_details_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
