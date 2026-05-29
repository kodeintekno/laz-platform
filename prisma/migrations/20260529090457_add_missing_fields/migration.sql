-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarPublicId" TEXT,
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "waNotifications" BOOLEAN NOT NULL DEFAULT true;
