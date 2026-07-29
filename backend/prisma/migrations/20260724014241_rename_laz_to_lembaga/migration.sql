-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_lazId_fkey";

-- DropForeignKey
ALTER TABLE "distributions" DROP CONSTRAINT "distributions_lazId_fkey";

-- DropForeignKey
ALTER TABLE "donations" DROP CONSTRAINT "donations_lazId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_lazId_fkey";

-- DropForeignKey
ALTER TABLE "programs" DROP CONSTRAINT "programs_lazId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_lazId_fkey";

-- DropIndex
DROP INDEX "programs_lazId_slug_key";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "lazId",
ADD COLUMN     "lembagaId" TEXT;

-- AlterTable
ALTER TABLE "distributions" DROP COLUMN "lazId",
ADD COLUMN     "lembagaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "donations" DROP COLUMN "lazId",
ADD COLUMN     "donorEmail" TEXT,
ADD COLUMN     "donorPhone" TEXT,
ADD COLUMN     "lembagaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "lazId",
ADD COLUMN     "lembagaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "programs" DROP COLUMN "lazId",
ADD COLUMN     "lembagaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "lazId",
ADD COLUMN     "lembagaId" TEXT NOT NULL;

-- DropTable
DROP TABLE "lazs";

-- CreateTable
CREATE TABLE "lembagas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lembagas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lembagas_slug_key" ON "lembagas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "programs_lembagaId_slug_key" ON "programs"("lembagaId", "slug");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

