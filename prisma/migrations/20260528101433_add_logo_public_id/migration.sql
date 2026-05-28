/*
  Warnings:

  - You are about to drop the column `image` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lazId,name]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lazId` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lazId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProgramCategory" AS ENUM ('ZAKAT', 'INFAK', 'SEDEKAH', 'WAKAF');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_roleId_fkey";

-- DropIndex
DROP INDEX "roles_name_key";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "lazId" TEXT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "lazId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "image",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "lazId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "lazs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lazs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "currentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "distributedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "category" "ProgramCategory" NOT NULL,
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "imageUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "lazId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "message" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "programId" TEXT NOT NULL,
    "lazId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "gatewayRef" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "lazId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributions" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "receiptImageUrl" TEXT,
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "lazId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lazs_slug_key" ON "lazs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "programs_lazId_slug_key" ON "programs"("lazId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "payments_donationId_key" ON "payments"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gatewayRef_key" ON "payments"("gatewayRef");

-- CreateIndex
CREATE UNIQUE INDEX "roles_lazId_name_key" ON "roles"("lazId", "name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_lazId_fkey" FOREIGN KEY ("lazId") REFERENCES "lazs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_lazId_fkey" FOREIGN KEY ("lazId") REFERENCES "lazs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_lazId_fkey" FOREIGN KEY ("lazId") REFERENCES "lazs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_lazId_fkey" FOREIGN KEY ("lazId") REFERENCES "lazs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_lazId_fkey" FOREIGN KEY ("lazId") REFERENCES "lazs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_lazId_fkey" FOREIGN KEY ("lazId") REFERENCES "lazs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_lazId_fkey" FOREIGN KEY ("lazId") REFERENCES "lazs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
