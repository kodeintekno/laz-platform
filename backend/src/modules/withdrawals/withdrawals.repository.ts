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

  /** Kunci saldo program dan agregat lembaga dalam urutan yang selalu sama. */
  private async reserveProgramBalance(
    tx: Prisma.TransactionClient,
    lembagaId: string,
    programId: string,
    amount: number,
  ) {
    const programRows = await tx.$queryRaw<Array<{
      balance: Prisma.Decimal;
      mustahiqBalance: Prisma.Decimal;
      amilBalance: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT "balance", "mustahiqBalance", "amilBalance"
      FROM "program_balances"
      WHERE "programId" = ${programId} AND "lembagaId" = ${lembagaId}
      FOR UPDATE
    `);
    const current = programRows[0];
    if (!current || Number(current.balance) < amount) {
      throw new AppError(
        "INSUFFICIENT_PROGRAM_BALANCE",
        "Saldo program tidak mencukupi untuk penarikan ini.",
        400,
      );
    }

    const mustahiqAmount = Math.min(Number(current.mustahiqBalance), amount);
    const amilAmount = amount - mustahiqAmount;
    if (amilAmount > Number(current.amilBalance)) {
      throw new AppError("BALANCE_INCONSISTENT", "Komponen saldo program tidak konsisten.", 409);
    }

    const institutionRows = await tx.$queryRaw<Array<{
      balance: Prisma.Decimal;
      mustahiqBalance: Prisma.Decimal;
      amilBalance: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT "balance", "mustahiqBalance", "amilBalance"
      FROM "institution_balances"
      WHERE "lembagaId" = ${lembagaId}
      FOR UPDATE
    `);
    const institution = institutionRows[0];
    if (
      !institution
      || Number(institution.balance) < amount
      || Number(institution.mustahiqBalance) < mustahiqAmount
      || Number(institution.amilBalance) < amilAmount
    ) {
      throw new AppError("BALANCE_INCONSISTENT", "Agregat saldo Lembaga tidak konsisten.", 409);
    }

    await tx.programBalance.update({
      where: { programId },
      data: {
        balance: { decrement: amount },
        mustahiqBalance: { decrement: mustahiqAmount },
        amilBalance: { decrement: amilAmount },
        reservedBalance: { increment: amount },
        reservedMustahiqBalance: { increment: mustahiqAmount },
        reservedAmilBalance: { increment: amilAmount },
      },
    });
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

    return { mustahiqAmount, amilAmount };
  }

  private async releaseProgramReservation(
    tx: Prisma.TransactionClient,
    lembagaId: string,
    programId: string,
    amount: number,
    mustahiqAmount: number,
    amilAmount: number,
  ) {
    if (Math.abs(mustahiqAmount + amilAmount - amount) >= 0.01) {
      throw new AppError("BALANCE_INCONSISTENT", "Snapshot komponen withdrawal tidak konsisten.", 409);
    }

    const programRows = await tx.$queryRaw<Array<{
      reservedBalance: Prisma.Decimal;
      reservedMustahiqBalance: Prisma.Decimal;
      reservedAmilBalance: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT "reservedBalance", "reservedMustahiqBalance", "reservedAmilBalance"
      FROM "program_balances"
      WHERE "programId" = ${programId} AND "lembagaId" = ${lembagaId}
      FOR UPDATE
    `);
    const program = programRows[0];
    if (
      !program
      || Number(program.reservedBalance) < amount
      || Number(program.reservedMustahiqBalance) < mustahiqAmount
      || Number(program.reservedAmilBalance) < amilAmount
    ) {
      throw new AppError("BALANCE_INCONSISTENT", "Reservasi saldo program tidak konsisten.", 409);
    }

    const institutionRows = await tx.$queryRaw<Array<{
      reservedBalance: Prisma.Decimal;
      reservedMustahiqBalance: Prisma.Decimal;
      reservedAmilBalance: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT "reservedBalance", "reservedMustahiqBalance", "reservedAmilBalance"
      FROM "institution_balances"
      WHERE "lembagaId" = ${lembagaId}
      FOR UPDATE
    `);
    const institution = institutionRows[0];
    if (
      !institution
      || Number(institution.reservedBalance) < amount
      || Number(institution.reservedMustahiqBalance) < mustahiqAmount
      || Number(institution.reservedAmilBalance) < amilAmount
    ) {
      throw new AppError("BALANCE_INCONSISTENT", "Reservasi agregat Lembaga tidak konsisten.", 409);
    }

    await tx.programBalance.update({
      where: { programId },
      data: {
        balance: { increment: amount },
        mustahiqBalance: { increment: mustahiqAmount },
        amilBalance: { increment: amilAmount },
        reservedBalance: { decrement: amount },
        reservedMustahiqBalance: { decrement: mustahiqAmount },
        reservedAmilBalance: { decrement: amilAmount },
      },
    });
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

  private async consumeProgramReservation(
    tx: Prisma.TransactionClient,
    lembagaId: string,
    programId: string,
    amount: number,
    mustahiqAmount: number,
    amilAmount: number,
  ) {
    if (Math.abs(mustahiqAmount + amilAmount - amount) >= 0.01) {
      throw new AppError("BALANCE_INCONSISTENT", "Snapshot komponen withdrawal tidak konsisten.", 409);
    }

    const programRows = await tx.$queryRaw<Array<{
      reservedBalance: Prisma.Decimal;
      reservedMustahiqBalance: Prisma.Decimal;
      reservedAmilBalance: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT "reservedBalance", "reservedMustahiqBalance", "reservedAmilBalance"
      FROM "program_balances"
      WHERE "programId" = ${programId} AND "lembagaId" = ${lembagaId}
      FOR UPDATE
    `);
    const program = programRows[0];
    if (
      !program
      || Number(program.reservedBalance) < amount
      || Number(program.reservedMustahiqBalance) < mustahiqAmount
      || Number(program.reservedAmilBalance) < amilAmount
    ) {
      throw new AppError("BALANCE_INCONSISTENT", "Reservasi saldo program tidak konsisten.", 409);
    }

    const institutionRows = await tx.$queryRaw<Array<{
      reservedBalance: Prisma.Decimal;
      reservedMustahiqBalance: Prisma.Decimal;
      reservedAmilBalance: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT "reservedBalance", "reservedMustahiqBalance", "reservedAmilBalance"
      FROM "institution_balances"
      WHERE "lembagaId" = ${lembagaId}
      FOR UPDATE
    `);
    const institution = institutionRows[0];
    if (
      !institution
      || Number(institution.reservedBalance) < amount
      || Number(institution.reservedMustahiqBalance) < mustahiqAmount
      || Number(institution.reservedAmilBalance) < amilAmount
    ) {
      throw new AppError("BALANCE_INCONSISTENT", "Reservasi agregat Lembaga tidak konsisten.", 409);
    }

    await tx.programBalance.update({
      where: { programId },
      data: {
        reservedBalance: { decrement: amount },
        reservedMustahiqBalance: { decrement: mustahiqAmount },
        reservedAmilBalance: { decrement: amilAmount },
      },
    });
    await tx.institutionBalance.update({
      where: { lembagaId },
      data: {
        reservedBalance: { decrement: amount },
        reservedMustahiqBalance: { decrement: mustahiqAmount },
        reservedAmilBalance: { decrement: amilAmount },
      },
    });
  }

  /** Compatibility path for withdrawals created before program isolation. */
  private async releaseLegacyInstitutionReservation(
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

    const target = await tx.program.findFirst({
      where: { lembagaId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (target) {
      await tx.programBalance.upsert({
        where: { programId: target.id },
        update: {
          balance: { increment: amount },
          mustahiqBalance: { increment: mustahiqAmount },
          amilBalance: { increment: amilAmount },
        },
        create: {
          programId: target.id,
          lembagaId,
          balance: amount,
          mustahiqBalance: mustahiqAmount,
          amilBalance: amilAmount,
        },
      });
    }
  }

  private async consumeLegacyInstitutionReservation(
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
    programId: string,
    amount: number,
    requestedById: string,
    bankAccountId: string,
    bankCode: string,
    accountNumber: string,
    accountHolder: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Kunci saldo program dan agregat agar request paralel tidak dapat
      // memakai rupiah yang sama atau mengambil dana program lain.
      const allocation = await this.reserveProgramBalance(tx, lembagaId, programId, amount);

      // 3. Create PENDING Withdrawal
      const withdrawal = await tx.withdrawal.create({
        data: {
          lembagaId,
          programId,
          bankAccountId,
          amount,
          mustahiqAmount: allocation.mustahiqAmount,
          amilAmount: allocation.amilAmount,
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
          newData: {
            amount,
            programId,
            mustahiqAmount: allocation.mustahiqAmount,
            amilAmount: allocation.amilAmount,
            bankAccountId,
            bankCode,
            accountNumber,
            status: "PENDING",
          },
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
        if (withdrawal.programId) {
          await this.releaseProgramReservation(
            tx,
            withdrawal.lembagaId,
            withdrawal.programId,
            Number(withdrawal.amount),
            Number(withdrawal.mustahiqAmount),
            Number(withdrawal.amilAmount),
          );
        } else {
          await this.releaseLegacyInstitutionReservation(tx, withdrawal.lembagaId, Number(withdrawal.amount));
        }
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
    // Upsert menutup race antara approval/retry paralel. Unique withdrawalId
    // memastikan hanya ada satu payout dan satu idempotency key per withdrawal.
    return this.prisma.payout.upsert({
      where: { withdrawalId: withdrawal.id },
      update: {},
      create: {
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

  async updatePayoutStatus(
    withdrawalId: string,
    xenditPayoutId: string | null,
    payoutStatus: any,
    withdrawalStatus?: any
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Jangan pernah menimpa status terminal yang mungkin sudah ditulis oleh
      // webhook ketika respons HTTP create-payout datang terlambat.
      const updated = await tx.payout.updateMany({
        where: {
          withdrawalId,
          status: { notIn: ["SUCCEEDED", "CANCELLED", "REVERSED"] },
          withdrawal: { status: { in: ["APPROVED", "PROCESSING"] } },
        },
        data: {
          status: payoutStatus,
          ...(xenditPayoutId ? { xenditPayoutId } : {}),
        },
      });

      if (updated.count > 0 && withdrawalStatus) {
        await tx.withdrawal.updateMany({
          where: { id: withdrawalId, status: { in: ["APPROVED", "PROCESSING"] } },
          data: { status: withdrawalStatus },
        });
      }

      return tx.payout.findUniqueOrThrow({ where: { withdrawalId } });
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
      // 1. Klaim terminal event secara atomik. Read-then-write saja tidak aman
      // terhadap dua webhook sukses/gagal yang tiba bersamaan.
      const currentPayout = await tx.payout.findUnique({ where: { id: payoutId } });
      if (!currentPayout || currentPayout.withdrawalId !== withdrawalId) {
        return { success: false, reason: "NOT_FOUND" };
      }
      const claimed = await tx.payout.updateMany({
        where: {
          id: payoutId,
          withdrawalId,
          status: { notIn: ["SUCCEEDED", "FAILED", "CANCELLED", "REVERSED"] },
        },
        data: {
          status: newPayoutStatus,
          metadata: metadata || undefined,
        },
      });
      if (claimed.count === 0) return { success: false, reason: "ALREADY_PROCESSED" };

      // 2. Update withdrawal status setelah event payout berhasil diklaim.
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
          const source = await tx.withdrawal.findUniqueOrThrow({
            where: { id: withdrawalId },
            select: {
              programId: true,
              mustahiqAmount: true,
              amilAmount: true,
              bankCode: true,
              accountNumber: true,
              requestedById: true,
              approvedById: true,
              program: { select: { title: true } },
            },
          });
          if (source.programId) {
            await this.consumeProgramReservation(
              tx,
              lembagaId,
              source.programId,
              amount,
              Number(source.mustahiqAmount),
              Number(source.amilAmount),
            );
          } else {
            await this.consumeLegacyInstitutionReservation(tx, lembagaId, amount);
          }
          await this.autoJournalService.createWithdrawalCompletionJournal(
            tx,
            withdrawalId,
            amount,
            lembagaId,
            source.approvedById ?? source.requestedById,
            bankChartOfAccountId,
            source.programId,
            {
              bankCode: source.bankCode,
              accountNumber: source.accountNumber,
              programTitle: source.program?.title,
            },
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
          const source = await tx.withdrawal.findUniqueOrThrow({
            where: { id: withdrawalId },
            select: { programId: true, mustahiqAmount: true, amilAmount: true },
          });
          if (source.programId) {
            await this.releaseProgramReservation(
              tx,
              lembagaId,
              source.programId,
              amount,
              Number(source.mustahiqAmount),
              Number(source.amilAmount),
            );
          } else {
            await this.releaseLegacyInstitutionReservation(tx, lembagaId, amount);
          }
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
