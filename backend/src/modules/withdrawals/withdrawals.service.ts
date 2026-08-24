import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WithdrawalsRepository } from "./withdrawals.repository";
import { AppError } from "../../common/errors/app.error";
import { XenditService } from "../../lib/xendit/xendit.service";
import * as crypto from "crypto";

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly withdrawalsRepository: WithdrawalsRepository,
    private readonly xenditService: XenditService
  ) { }

  async createWithdrawal(lembagaId: string, userId: string, amount: number) {
    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new AppError("INVALID_AMOUNT", "Withdrawal amount must be a positive integer.", 400);
    }

    const lembaga = await this.prisma.lembaga.findUnique({
      where: { id: lembagaId },
      select: { bankCode: true, accountNumber: true, accountHolder: true, status: true },
    });

    if (!lembaga) {
      throw new AppError("NOT_FOUND", "Institution not found.", 404);
    }

    if (lembaga.status !== "APPROVED") {
      throw new AppError("FORBIDDEN", "Institution is not eligible to withdraw funds.", 403);
    }

    if (!lembaga.bankCode || !lembaga.accountNumber || !lembaga.accountHolder) {
      throw new AppError("BANK_NOT_CONFIGURED", "Bank account is not completely configured.", 400);
    }

    return this.withdrawalsRepository.createWithdrawal(
      lembagaId,
      amount,
      userId,
      lembaga.bankCode,
      lembaga.accountNumber,
      lembaga.accountHolder
    );
  }

  async approveWithdrawal(withdrawalId: string, superAdminId: string) {
    const withdrawal = await this.withdrawalsRepository.approveWithdrawal(withdrawalId, superAdminId);

    // Kick off the payout process. We don't await this so the UI responds quickly.
    // If it fails synchronously, the retry endpoint can be used.
    this.processApprovedWithdrawal(withdrawal).catch((err) => {
      this.logger.error({ withdrawalId, err }, "Failed to process payout during approval");
    });

    return withdrawal;
  }

  async processApprovedWithdrawal(withdrawal: any) {
    if (withdrawal.status !== "APPROVED") {
      throw new AppError("INVALID_STATE", "Withdrawal is not approved", 400);
    }

    const idempotencyKey = crypto.randomUUID();
    const referenceId = `payout-${withdrawal.id}`;

    // 1. Create or get existing Payout record
    const payoutRecord = await this.withdrawalsRepository.createPayoutRecord(
      withdrawal,
      idempotencyKey,
      referenceId
    );

    if (payoutRecord.status !== "REQUESTED" && payoutRecord.status !== "FAILED") {
      this.logger.warn({ withdrawalId: withdrawal.id }, "Payout already in progress or completed");
      return;
    }

    // 2. Call Xendit API
    const payoutResult = await this.xenditService.createPayout({
      idempotencyKey: payoutRecord.idempotencyKey,
      referenceId: payoutRecord.referenceId,
      amountIdr: Number(withdrawal.amount),
      channelCode: withdrawal.bankCode,
      accountNumber: withdrawal.accountNumber,
      accountHolderName: withdrawal.accountHolder,
    });

    // 3. Update Status
    // If accepted/processing by Xendit, we transition to PROCESSING locally
    const newPayoutStatus = payoutResult.status === "ACCEPTED" || payoutResult.status === "REQUESTED" ? "PROCESSING" : payoutResult.status;
    const newWithdrawalStatus = newPayoutStatus === "PROCESSING" ? "PROCESSING" : undefined;

    await this.withdrawalsRepository.updatePayoutStatus(
      withdrawal.id,
      payoutResult.payoutId,
      newPayoutStatus,
      newWithdrawalStatus
    );
  }

  async retryPayout(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { payout: true }
    });

    if (!withdrawal) {
      throw new AppError("NOT_FOUND", "Withdrawal not found", 404);
    }

    if (withdrawal.status !== "APPROVED") {
      throw new AppError("INVALID_STATE", "Only APPROVED withdrawals can be retried", 400);
    }

    await this.processApprovedWithdrawal(withdrawal);

    return { success: true, message: "Payout retry initiated" };
  }

  async rejectWithdrawal(withdrawalId: string, superAdminId: string, reason: string) {
    if (!reason || reason.trim() === "") {
      throw new AppError("INVALID_INPUT", "Rejection reason is required.", 400);
    }
    return this.withdrawalsRepository.rejectWithdrawal(withdrawalId, superAdminId, reason);
  }

  async getLembagaWithdrawals(lembagaId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { lembagaId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.withdrawal.count({ where: { lembagaId } }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getAllWithdrawals(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [data, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          lembaga: { select: { name: true, slug: true } },
          requestedBy: { select: { name: true, email: true } },
          approvedBy: { select: { name: true, email: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getAllPayouts(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          withdrawal: {
            include: {
              lembaga: { select: { name: true, slug: true } }
            }
          }
        },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
