-- AlterTable
ALTER TABLE "withdrawals" ADD COLUMN "isPlatform" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "withdrawals" ALTER COLUMN "lembagaId" DROP NOT NULL;
