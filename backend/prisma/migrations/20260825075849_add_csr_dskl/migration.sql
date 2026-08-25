/*
  Warnings:

  - You are about to drop the column `isPlatform` on the `withdrawals` table. All the data in the column will be lost.
  - You are about to drop the `platform_balances` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `lembagaId` on table `withdrawals` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProgramCategory" ADD VALUE 'CSR';
ALTER TYPE "ProgramCategory" ADD VALUE 'DSKL';

-- AlterTable
ALTER TABLE "withdrawals" DROP COLUMN "isPlatform",
ALTER COLUMN "lembagaId" SET NOT NULL;

-- DropTable
DROP TABLE "platform_balances";
