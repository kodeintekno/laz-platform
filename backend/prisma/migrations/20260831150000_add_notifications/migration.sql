CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ACTION_REQUIRED');

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "volunteerId" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notifications_exactly_one_recipient_check"
      CHECK (("userId" IS NOT NULL AND "volunteerId" IS NULL) OR ("userId" IS NULL AND "volunteerId" IS NOT NULL))
);

CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");
CREATE INDEX "notifications_volunteerId_readAt_createdAt_idx" ON "notifications"("volunteerId", "readAt", "createdAt");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_volunteerId_fkey"
  FOREIGN KEY ("volunteerId") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
