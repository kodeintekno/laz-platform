-- DropForeignKey
ALTER TABLE "donations" DROP CONSTRAINT "donations_userId_fkey";

-- AlterTable
ALTER TABLE "donations" DROP COLUMN "userId";

-- CreateIndex
CREATE INDEX "donations_donorPhone_idx" ON "donations"("donorPhone");

