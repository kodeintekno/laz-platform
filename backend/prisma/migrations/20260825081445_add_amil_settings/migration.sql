-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "amilInstitutionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amilPlatformAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "institutionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "platformPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "amil_global_settings" (
    "id" TEXT NOT NULL,
    "category" "ProgramCategory" NOT NULL,
    "maxTotalPercentage" DECIMAL(5,2) NOT NULL,
    "defaultPlatformPercentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amil_global_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amil_institution_settings" (
    "id" TEXT NOT NULL,
    "lembagaId" TEXT NOT NULL,
    "category" "ProgramCategory" NOT NULL,
    "institutionPercentage" DECIMAL(5,2) NOT NULL,
    "platformPercentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amil_institution_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "amil_global_settings_category_key" ON "amil_global_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "amil_institution_settings_lembagaId_category_key" ON "amil_institution_settings"("lembagaId", "category");

-- AddForeignKey
ALTER TABLE "amil_institution_settings" ADD CONSTRAINT "amil_institution_settings_lembagaId_fkey" FOREIGN KEY ("lembagaId") REFERENCES "lembagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
