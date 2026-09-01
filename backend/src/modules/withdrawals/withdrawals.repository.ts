import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AutoJournalService } from "../journal/auto-journal.service";
import { AppError } from "../../common/errors/app.error";
import { Prisma } from "@prisma/client";

@Injectable()
export class WithdrawalsRepository {
  private readonly logger = new Logger(WithdrawalsRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly autoJournalService: AutoJournalService
  ) { }

  /**
   * Penarikan memakai satu saldo gabungan, tetapi reservasinya tetap dicatat
   * pada sub-saldo. Dana mustahiq dipakai lebih dulu, lalu dana amil.
   */
  private async reserveInstitutionBalance(
    tx: Prisma.TransactionClient,
    lembagaId: string,
    amount: number,
  ) {
    const rows = await tx.$queryRaw<Array<{
      balance: Prisma.Decimal;
      mustahiqBalance: Prisma.Decimal;
      amilBalance: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT "balance", "mustahiqBalance", "amilBalance"
      FROM "institution_balances"
      WHERE "lembagaId" = ${lembagaId}
      FOR UPDATE
    `);
    const current = rows[0];
    if (!current || Number(current.balance) < amount) {
      throw new AppError("INSUFFICIENT_BALANCE", "Available balance is insufficient for this withdrawal.", 400);
    }

    const mustahiqAmount = Math.min(Number(current.mustahiqBalance), amount);
    const amilAmount = amount - mustahiqAmount;
    if (amilAmount > Number(current.amilBalance)) {
      throw new AppError("BALANCE_INCONSISTENT", "Institution balance components are inconsistent.", 409);
    }

    await tx.institutionBalance.update({
      where: { lembagaId },
      data: {
        balance: { decrement: amount },
        mustahiqBalance: { decrement: mustahiqAmount },
        amilBalance: { decrement: amilAmount },
        reservedBalance: { increment: amount },
        reservedMustahiqBalance: { increment: mustahiqAmount },
        reservedAmilBalance: { increment: amilAmount },
      },
    });
  }

  private async releaseInstitutionReservation(
    tx: Prisma.TransactionClient,
    lembagaId: string,
    amount: number,
  ) {
    const rows = await tx.$queryRaw<Array<{
      reservedBalance: Prisma.Decimal;
      reservedMustahiqBalance: Prisma.Decimal;
      reservedAmilBalance: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT "reservedBalance", "reservedMustahiqBalance", "reservedAmilBalance"
      FROM "institution_balances"
      WHERE "lembagaId" = ${lembagaId}
      FOR UPDATE
    `);
    const current = rows[0];
    if (!current || Number(current.reservedBalance) < amount) {
      throw new AppError("BALANCE_INCONSISTENT", "Reserved institution balance is inconsistent.", 409);
    }

    const mustahiqAmount = Math.min(Number(current.reservedMustahiqBalance), amount);
    const amilAmount = amount - mustahiqAmount;
    if (amilAmount > Number(current.reservedAmilBalance)) {
      throw new AppError("BALANCE_INCONSISTENT", "Reserved institution balance components are inconsistent.", 409);
    }

    await tx.institutionBalance.update({
      where: { lembagaId },
      data: {
        balance: { increment: amount },
        mustahiqBalance: { increment: mustahiqAmount },
        amilBalance: { increment: amilAmount },
        reservedBalance: { decrement: amount },
        reservedMustahiqBalance: { decrement: mustahiqAmount },
        reservedAmilBalance: { decrement: amilAmount },
      },
    });
  }

  private async consumeInstitutionReservation(
    tx: Prisma.TransactionClient,
    lembagaId: string,
    amount: number,
  ) {
    const rows = await tx.$queryRaw<Array<{
      reservedBalance: Prisma.Decimal;
      reservedMustahiqBalance: Prisma.Decimal;
      reservedAmilBalance: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT "reservedBalance", "reservedMustahiqBalance", "reservedAmilBalance"
      FROM "institution_balances"
      WHERE "lembagaId" = ${lembagaId}
      FOR UPDATE
    `);
    const current = rows[0];
    if (!current || Number(current.reservedBalance) < amount) {
      throw new AppError("BALANCE_INCONSISTENT", "Reserved institution balance is inconsistent.", 409);
    }

    const mustahiqAmount = Math.min(Number(current.reservedMustahiqBalance), amount);
    const amilAmount = amount - mustahiqAmount;
    if (amilAmount > Number(current.reservedAmilBalance)) {
      throw new AppError("BALANCE_INCONSISTENT", "Reserved institution balance components are inconsistent.", 409);
    }

    await tx.institutionBalance.update({
      where: { lembagaId },
      data: {
        reservedBalance: { decrement: amount },
        reservedMustahiqBalance: { decrement: mustahiqAmount },
        reservedAmilBalance: { decrement: amilAmount },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.withdrawal.findUnique({
      where: { id },
      include: { payout: true, bankAccount: { select: { chartOfAccountId: true } } }
    });
  }

  async createWithdrawal(
    lembagaId: string,
    amount: number,
    requestedById: string,
    bankAccountId: string,
    bankCode: string,
    accountNumber: string,
    accountHolder: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Kunci baris saldo agar dua request paralel tidak dapat memakai dana yang sama.
      await this.reserveInstitutionBalance(tx, lembagaId, amount);

      // 3. Create PENDING Withdrawal
      const withdrawal = await tx.withdrawal.create({
        data: {
          lembagaId,
          bankAccountId,
          amount,
          status: "PENDING",
          bankCode,
          accountNumber,
          accountHolder,
          requestedById,
        },
      });

      // Pengajuan hanya mereservasi saldo operasional. Belum ada perpindahan
      // aset sehingga jurnal baru dibuat setelah payout sukses.
      await tx.auditLog.create({
        data: {
          action: "WITHDRAWAL_REQUEST",
          entity: "Withdrawal",
          entityId: withdrawal.id,
          userId: requestedById,
          lembagaId,
          newData: { amount, bankAccountId, bankCode, accountNumber, status: "PENDING" },
        },
      });

      return withdrawal;
    });
  }

  async createPlatformWithdrawal(
    amount: number,
    requestedById: string,
    bankCode: string,
    accountNumber: string,
    accountHolder: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.platformBalance.updateMany({
        where: { id: "platform", balance: { gte: amount } },
        data: { balance: { decrement: amount }, reservedBalance: { increment: amount } },
      });
      if (updated.count === 0) {
        throw new AppError("INSUFFICIENT_BALANCE", "Saldo Platform tidak mencukupi.", 400);
      }
      const withdrawal = await tx.withdrawal.create({
        data: {
          lembagaId: null,
          isPlatform: true,
          amount,
          status: "PENDING",
          bankCode,
          accountNumber,
          accountHolder,
          requestedById,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "WITHDRAWAL_REQUEST",
          entity: "Withdrawal",
          entityId: withdrawal.id,
          userId: requestedById,
          lembagaId: null,
          newData: { amount, bankCode, accountNumber, status: "PENDING", isPlatform: true },
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

      if (withdrawal.isPlatform) {
        await tx.platformBalance.update({
          where: { id: "platform" },
          data: { balance: { increment: withdrawal.amount }, reservedBalance: { decrement: withdrawal.amount } },
        });
      } else {
        if (!withdrawal.lembagaId) {
          throw new AppError("INVALID_STATE", "Withdrawal has no institution associated.", 400);
        }
        await this.releaseInstitutionReservation(tx, withdrawal.lembagaId, Number(withdrawal.amount));
      }

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          action: "WITHDRAWAL_REJECT",
          entity: "Withdrawal",
          entityId: withdrawalId,
          userId: rejectedById,
          lembagaId: withdrawal.lembagaId ?? null,
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
    lembagaId: string | null,
    isPlatform: boolean,
    bankChartOfAccountId: string | null,
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
        if (isPlatform) {
          await tx.platformBalance.update({ where: { id: "platform" }, data: { reservedBalance: { decrement: amount } } });
          await this.autoJournalService.createPlatformWithdrawalCompletionJournal(tx, withdrawalId, amount, null);
        } else {
          if (!lembagaId) throw new AppError("INVALID_STATE", "Withdrawal has no institution", 400);
          await this.consumeInstitutionReservation(tx, lembagaId, amount);
          await this.autoJournalService.createWithdrawalCompletionJournal(
            tx, withdrawalId, amount, lembagaId, null, bankChartOfAccountId,
          );
        }
      } else if (newWithdrawalStatus === "FAILED" || newWithdrawalStatus === "REJECTED") {
        if (isPlatform) {
          await tx.platformBalance.update({
            where: { id: "platform" },
            data: { reservedBalance: { decrement: amount }, balance: { increment: amount } },
          });
        } else {
          if (!lembagaId) throw new AppError("INVALID_STATE", "Withdrawal has no institution", 400);
          await this.releaseInstitutionReservation(tx, lembagaId, amount);
        }

        // Tidak ada jurnal pembalik: request/processing tidak pernah dijurnal.
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
