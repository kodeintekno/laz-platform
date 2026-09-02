import { Test, TestingModule } from "@nestjs/testing";
import { WithdrawalsRepository } from "../../src/modules/withdrawals/withdrawals.repository";
import { PrismaService } from "../../src/prisma/prisma.service";
import { AutoJournalService } from "../../src/modules/journal/auto-journal.service";
import { AppError } from "../../src/common/errors/app.error";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("WithdrawalsRepository", () => {
  let repository: WithdrawalsRepository;
  let prisma: any;
  let autoJournalService: any;

  beforeEach(async () => {
    prisma = {
      $transaction: vi.fn(async (cb) => cb(prisma)),
      $queryRaw: vi.fn(),
      institutionBalance: {
        update: vi.fn(),
      },
      programBalance: {
        update: vi.fn(),
        upsert: vi.fn(),
      },
      program: {
        findFirst: vi.fn(),
      },
      withdrawal: {
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      payout: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    autoJournalService = {
      createWithdrawalCompletionJournal: vi.fn(),
      createPlatformWithdrawalCompletionJournal: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalsRepository,
        { provide: PrismaService, useValue: prisma },
        { provide: AutoJournalService, useValue: autoJournalService },
      ],
    }).compile();

    repository = module.get<WithdrawalsRepository>(WithdrawalsRepository);
  });

  describe("createWithdrawal", () => {
    it("should throw error if the combined balance is insufficient", async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await expect(
        repository.createWithdrawal("lembaga-1", "program-1", 1000, "user-1", "bank-1", "BCA", "123", "John")
      ).rejects.toThrow(AppError);
    });

    it("should atomic reserve balance and create withdrawal", async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([{
        balance: 1500,
        mustahiqBalance: 800,
        amilBalance: 700,
        }])
        .mockResolvedValueOnce([{
          balance: 1500,
          mustahiqBalance: 800,
          amilBalance: 700,
        }]);
      prisma.withdrawal.create.mockResolvedValue({ id: "with-1" });

      await repository.createWithdrawal("lembaga-1", "program-1", 1000, "user-1", "bank-1", "BCA", "123", "John");

      expect(prisma.programBalance.update).toHaveBeenCalledWith({
        where: { programId: "program-1" },
        data: {
          balance: { decrement: 1000 },
          mustahiqBalance: { decrement: 800 },
          amilBalance: { decrement: 200 },
          reservedBalance: { increment: 1000 },
          reservedMustahiqBalance: { increment: 800 },
          reservedAmilBalance: { increment: 200 },
        },
      });
      expect(prisma.institutionBalance.update).toHaveBeenCalledWith({
        where: { lembagaId: "lembaga-1" },
        data: {
          balance: { decrement: 1000 },
          mustahiqBalance: { decrement: 800 },
          amilBalance: { decrement: 200 },
          reservedBalance: { increment: 1000 },
          reservedMustahiqBalance: { increment: 800 },
          reservedAmilBalance: { increment: 200 },
        },
      });
      expect(prisma.withdrawal.create).toHaveBeenCalled();
      expect(autoJournalService.createWithdrawalCompletionJournal).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe("approveWithdrawal", () => {
    it("should throw error if already approved or not found", async () => {
      prisma.withdrawal.updateMany.mockResolvedValue({ count: 0 }); // Optimistic lock fails

      await expect(
        repository.approveWithdrawal("with-1", "admin-1")
      ).rejects.toThrow(AppError);
    });

    it("should approve withdrawal if pending", async () => {
      prisma.withdrawal.updateMany.mockResolvedValue({ count: 1 });
      prisma.withdrawal.findUnique.mockResolvedValue({ id: "with-1", lembagaId: "lembaga-1" });

      await repository.approveWithdrawal("with-1", "admin-1");

      expect(prisma.withdrawal.updateMany).toHaveBeenCalledWith({
        where: { id: "with-1", status: "PENDING" },
        data: { status: "APPROVED", approvedById: "admin-1", updatedAt: expect.any(Date) },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe("rejectWithdrawal", () => {
    it("should throw error if not pending", async () => {
      prisma.withdrawal.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        repository.rejectWithdrawal("with-1", "admin-1", "reason")
      ).rejects.toThrow(AppError);
    });

    it("should reject and reverse reserved balance", async () => {
      prisma.withdrawal.updateMany.mockResolvedValue({ count: 1 });
      prisma.withdrawal.findUniqueOrThrow.mockResolvedValue({
        id: "with-1",
        lembagaId: "lembaga-1",
        programId: "program-1",
        amount: 1000,
        mustahiqAmount: 800,
        amilAmount: 200,
      });
      prisma.$queryRaw
        .mockResolvedValueOnce([{
          reservedBalance: 1000,
          reservedMustahiqBalance: 800,
          reservedAmilBalance: 200,
        }])
        .mockResolvedValueOnce([{
          reservedBalance: 1000,
          reservedMustahiqBalance: 800,
          reservedAmilBalance: 200,
        }]);

      await repository.rejectWithdrawal("with-1", "admin-1", "reason");

      expect(prisma.institutionBalance.update).toHaveBeenCalledWith({
        where: { lembagaId: "lembaga-1" },
        data: {
          balance: { increment: 1000 },
          mustahiqBalance: { increment: 800 },
          amilBalance: { increment: 200 },
          reservedBalance: { decrement: 1000 },
          reservedMustahiqBalance: { decrement: 800 },
          reservedAmilBalance: { decrement: 200 },
        },
      });
      expect(prisma.programBalance.update).toHaveBeenCalledWith({
        where: { programId: "program-1" },
        data: {
          balance: { increment: 1000 },
          mustahiqBalance: { increment: 800 },
          amilBalance: { increment: 200 },
          reservedBalance: { decrement: 1000 },
          reservedMustahiqBalance: { decrement: 800 },
          reservedAmilBalance: { decrement: 200 },
        },
      });
      expect(autoJournalService.createWithdrawalCompletionJournal).not.toHaveBeenCalled();
    });
  });

  describe("payout webhook idempotency", () => {
    it("posts the bank journal atomically when a program payout succeeds", async () => {
      prisma.payout.findUnique.mockResolvedValue({
        id: "payout-1",
        withdrawalId: "with-1",
        status: "PROCESSING",
      });
      prisma.payout.updateMany.mockResolvedValue({ count: 1 });
      prisma.withdrawal.findUniqueOrThrow.mockResolvedValue({
        programId: "program-1",
        mustahiqAmount: 800,
        amilAmount: 200,
        bankCode: "ID_MANDIRI",
        accountNumber: "1234567890",
        requestedById: "user-1",
        approvedById: "admin-1",
        program: { title: "Program Pendidikan" },
      });
      prisma.$queryRaw
        .mockResolvedValueOnce([{
          reservedBalance: 1000,
          reservedMustahiqBalance: 800,
          reservedAmilBalance: 200,
        }])
        .mockResolvedValueOnce([{
          reservedBalance: 1000,
          reservedMustahiqBalance: 800,
          reservedAmilBalance: 200,
        }]);

      const result = await repository.updatePayoutStatusAndFinalize(
        "payout-1",
        "with-1",
        "lembaga-1",
        false,
        "coa-bank-1",
        1000,
        "SUCCEEDED",
        "COMPLETED",
      );

      expect(result).toEqual({ success: true });
      expect(autoJournalService.createWithdrawalCompletionJournal).toHaveBeenCalledWith(
        prisma,
        "with-1",
        1000,
        "lembaga-1",
        "admin-1",
        "coa-bank-1",
        "program-1",
        {
          bankCode: "ID_MANDIRI",
          accountNumber: "1234567890",
          programTitle: "Program Pendidikan",
        },
      );
    });

    it("does not finalize balances when another terminal webhook already claimed the payout", async () => {
      prisma.payout.findUnique.mockResolvedValue({
        id: "payout-1",
        withdrawalId: "with-1",
        status: "PROCESSING",
      });
      prisma.payout.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.updatePayoutStatusAndFinalize(
        "payout-1",
        "with-1",
        "lembaga-1",
        false,
        "coa-bank-1",
        1000,
        "SUCCEEDED",
        "COMPLETED",
      );

      expect(result).toEqual({ success: false, reason: "ALREADY_PROCESSED" });
      expect(prisma.withdrawal.update).not.toHaveBeenCalled();
      expect(prisma.institutionBalance.update).not.toHaveBeenCalled();
      expect(prisma.programBalance.update).not.toHaveBeenCalled();
    });
  });
});
