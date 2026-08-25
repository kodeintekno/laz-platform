-- AlterTable
ALTER TABLE "withdrawals" ADD COLUMN     "isPlatform" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "lembagaId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "platform_balances" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bankCode" TEXT,
    "accountNumber" TEXT,
    "accountHolder" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_balances_pkey" PRIMARY KEY ("id")
);
