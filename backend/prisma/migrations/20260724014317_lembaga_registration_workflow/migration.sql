-- CreateEnum
CREATE TYPE "LembagaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LembagaDocumentType" AS ENUM ('AKTA_YAYASAN', 'SK_KEMENKUMHAM', 'NPWP', 'OTHER');

-- AlterTable
ALTER TABLE "lembagas" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "izinYayasanNumber" TEXT,
ADD COLUMN     "officePhotoPublicId" TEXT,
ADD COLUMN     "officePhotoUrl" TEXT,
ADD COLUMN     "picName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "picPhone" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "website" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "LembagaStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "lembagaId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "lembaga_documents" (
    "id" TEXT NOT NULL,
    "lembagaId" TEXT NOT NULL,
    "type" "LembagaDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePublicId" TEXT,
    "originalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lembaga_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lembagas" ADD CONSTRAINT "lembagas_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembaga_documents" ADD CONSTRAINT "lembaga_documents_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

