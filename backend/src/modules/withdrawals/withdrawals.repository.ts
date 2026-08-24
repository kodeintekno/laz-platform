import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AutoJournalService } from "../journal/auto-journal.service";
import { AppError } from "../../common/errors/app.error";

@Injectable()
export class WithdrawalsRepository {
  private readonly logger = new Logger(WithdrawalsRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly autoJournalService: AutoJournalService
  ) { }

  async findById(id: string) {
    return this.prisma.withdrawal.findUnique({
      where: { id },
      include: { payout: true }
    });
  }

  async createWithdrawal(
    lembagaId: string,
    amount: number,
    requestedById: string,
    bankCode: string,
    accountNumber: string,
    accountHolder: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Atomic Balance Check & Update (Reservation)
      // This prevents race conditions by locking the row and checking the balance in one atomic step.
      const updateResult = await tx.institutionBalance.updateMany({
        where: {
          lembagaId,
          balance: { gte: amount }
        },
        data: {
          balance: { decrement: amount },
          reservedBalance: { increment: amount },
        },
      });

      if (updateResult.count === 0) {
        throw new AppError("INSUFFICIENT_BALANCE", "Available balance is insufficient for this withdrawal.", 400);
      }

      // 3. Create PENDING Withdrawal
      const withdrawal = await tx.withdrawal.create({
        data: {
          lembagaId,
          amount,
          status: "PENDING",
          bankCode,
          accountNumber,
          accountHolder,
          requestedById,
        },
      });

      // 4. Create Ledger Entry for Reservation (Kas Dalam Perjalanan)
      await this.autoJournalService.createWithdrawalReservationJournal(
        tx,
        withdrawal.id,
        amount,
        lembagaId,
        requestedById
      );

      // 5. Create Audit Log
      await tx.auditLog.create({
        data: {
          action: "WITHDRAWAL_REQUEST",
          entity: "Withdrawal",
          entityId: withdrawal.id,
          userId: requestedById,
          lembagaId,
          newData: { amount, bankCode, accountNumber, status: "PENDING" },
        },
      });

      return withdrawal;
    });
  }

  async approveWithdrawal(withdrawalId: string, approvedById: string) {
    return this.prisma.$transaction(async (tx) => {
      // Optimistic concurrency check
      const updateResult = await tx.withdrawal.updateMany({
        where: {
          id: withdrawalId,
          status: "PENDING",
        },
        data: {
          status: "APPROVED",
          approvedById,
          updatedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new AppError("INVALID_STATE", "Withdrawal is not pending or does not exist.", 400);
      }

      const withdrawal = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });

      await tx.auditLog.create({
        data: {
          action: "WITHDRAWAL_APPROVE",
          entity: "Withdrawal",
          entityId: withdrawalId,
          userId: approvedById,
          lembagaId: withdrawal!.lembagaId,
          newData: { status: "APPROVED" },
        },
      });

      return withdrawal;
    });
  }

  async rejectWithdrawal(withdrawalId: string, rejectedById: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      // Optimistic concurrency check
      const updateResult = await tx.withdrawal.updateMany({
        where: {
          id: withdrawalId,
          status: "PENDING",
        },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new AppError("INVALID_STATE", "Withdrawal is not pending or does not exist.", 400);
      }

      const withdrawal = await tx.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });

      if (!withdrawal.lembagaId) {
        throw new AppError("INVALID_STATE", "Withdrawal has no institution associated.", 400);
      }

      // Return reserved balance back to available balance
      await tx.institutionBalance.update({
        where: { lembagaId: withdrawal.lembagaId },
        data: {
          balance: { increment: withdrawal.amount },
          reservedBalance: { decrement: withdrawal.amount },
        },
      });

      // Create Ledger Entry for Reversal
      await this.autoJournalService.createWithdrawalRejectionJournal(
        tx,
        withdrawal.id,
        Number(withdrawal.amount),
        withdrawal.lembagaId,
        rejectedById,
        reason
      );

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          action: "WITHDRAWAL_REJECT",
          entity: "Withdrawal",
          entityId: withdrawalId,
          userId: rejectedById,
          lembagaId: withdrawal.lembagaId,
          newData: { status: "REJECTED", reason },
        },
      });

      return withdrawal;
    });
  }

  async createPayoutRecord(
    withdrawal: {
      id: string;
      amount: any;
      bankCode: string;
      accountNumber: string;
      accountHolder: string;
    },
    idempotencyKey: string,
    referenceId: string
  ) {
    let payout = await this.prisma.payout.findUnique({
      where: { withdrawalId: withdrawal.id },
    });

    if (!payout) {
      payout = await this.prisma.payout.create({
        data: {
          withdrawalId: withdrawal.id,
          referenceId,
          idempotencyKey,
          amount: withdrawal.amount,
          channelCode: withdrawal.bankCode,
          accountNumber: withdrawal.accountNumber,
          accountHolder: withdrawal.accountHolder,
          status: "REQUESTED",
        },
      });
    }

    return payout;
  }

  async updatePayoutStatus(
    withdrawalId: string,
    xenditPayoutId: string | null,
    payoutStatus: any,
    withdrawalStatus?: any
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.update({
        where: { withdrawalId },
        data: {
          status: payoutStatus,
          ...(xenditPayoutId ? { xenditPayoutId } : {}),
        },
      });

      if (withdrawalStatus) {
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: withdrawalStatus },
        });
      }

      return payout;
    });
  }

  async updatePayoutStatusAndFinalize(
    payoutId: string,
    withdrawalId: string,
    lembagaId: string,
    amount: number,
    newPayoutStatus: any,
    newWithdrawalStatus: any,
    metadata?: any
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Check current status to prevent race conditions
      const currentPayout = await tx.payout.findUnique({ where: { id: payoutId } });
      if (!currentPayout) return { success: false, reason: "NOT_FOUND" };
      if (currentPayout.status === "SUCCEEDED" || currentPayout.status === "FAILED") {
        return { success: false, reason: "ALREADY_PROCESSED" };
      }

      // 2. Update statuses
      await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: newPayoutStatus,
          metadata: metadata || undefined,
        },
      });

      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: newWithdrawalStatus },
      });

      // 3. Finalize Ledger & Balance
      if (newWithdrawalStatus === "COMPLETED") {
        // Remove reserved balance (it permanently leaves the system)
        await tx.institutionBalance.update({
          where: { lembagaId: lembagaId },
          data: { reservedBalance: { decrement: amount } },
        });

        // Journal: Kas Dalam Perjalanan to Bank Lembaga
        await this.autoJournalService.createWithdrawalCompletionJournal(
          tx,
          withdrawalId,
          amount,
          lembagaId,
          null // system
        );
      } else if (newWithdrawalStatus === "FAILED" || newWithdrawalStatus === "REJECTED") {
        // Restore reserved balance back to available balance
        await tx.institutionBalance.update({
          where: { lembagaId: lembagaId },
          data: {
            reservedBalance: { decrement: amount },
            balance: { increment: amount }
          },
        });

        // Journal: Reverse Kas Dalam Perjalanan back to Kas
        await this.autoJournalService.createWithdrawalRejectionJournal(
          tx,
          withdrawalId,
          amount,
          lembagaId,
          null, // SYSTEM
          "Xendit Payout Failed"
        );
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Withdrawal",
          entityId: withdrawalId,
          userId: null,
          lembagaId,
          newData: { newPayoutStatus, newWithdrawalStatus },
        },
      });

      return { success: true };
    });
  }
}
