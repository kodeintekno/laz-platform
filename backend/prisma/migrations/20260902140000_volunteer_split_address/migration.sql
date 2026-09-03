-- AlterTable volunteers: rename address → addressDomicile, add addressKtp
ALTER TABLE "volunteers" RENAME COLUMN "address" TO "addressDomicile";
ALTER TABLE "volunteers" ADD COLUMN "addressKtp" TEXT;
