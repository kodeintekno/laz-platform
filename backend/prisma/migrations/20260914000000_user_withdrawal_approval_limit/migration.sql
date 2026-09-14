ALTER TABLE "users" ADD COLUMN "withdrawalApprovalLimit" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD CONSTRAINT "users_withdrawalApprovalLimit_nonnegative" CHECK ("withdrawalApprovalLimit" >= 0);
