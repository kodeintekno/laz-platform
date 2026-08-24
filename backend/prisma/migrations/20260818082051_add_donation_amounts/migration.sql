-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "institutionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "platformFee" DECIMAL(12,2) NOT NULL DEFAULT 0;
