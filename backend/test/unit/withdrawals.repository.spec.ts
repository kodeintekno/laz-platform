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
      institutionBalance: {
        updateMany: vi.fn(),
        update: vi.fn(),
      },
      withdrawal: {
        create: vi.fn(),
        updateMany: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    autoJournalService = {
      createWithdrawalReservationJournal: vi.fn(),
      createWithdrawalRejectionJournal: vi.fn(),
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
    it("should throw error if balance is insufficient (updateMany count = 0)", async () => {
      prisma.institutionBalance.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        repository.createWithdrawal("lembaga-1", 1000, "user-1", "BCA", "123", "John")
      ).rejects.toThrow(AppError);
    });

    it("should atomic reserve balance and create withdrawal", async () => {
      prisma.institutionBalance.updateMany.mockResolvedValue({ count: 1 });
      prisma.withdrawal.create.mockResolvedValue({ id: "with-1" });

      await repository.createWithdrawal("lembaga-1", 1000, "user-1", "BCA", "123", "John");

      expect(prisma.institutionBalance.updateMany).toHaveBeenCalledWith({
        where: { 
          lembagaId: "lembaga-1",
          balance: { gte: 1000 }
        },
        data: {
          balance: { decrement: 1000 },
          reservedBalance: { increment: 1000 },
        },
      });
      expect(prisma.withdrawal.create).toHaveBeenCalled();
      expect(autoJournalService.createWithdrawalReservationJournal).toHaveBeenCalled();
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
      prisma.withdrawal.findUniqueOrThrow.mockResolvedValue({ id: "with-1", lembagaId: "lembaga-1", amount: 1000 });

      await repository.rejectWithdrawal("with-1", "admin-1", "reason");

      expect(prisma.institutionBalance.update).toHaveBeenCalledWith({
        where: { lembagaId: "lembaga-1" },
        data: {
          balance: { increment: 1000 },
          reservedBalance: { decrement: 1000 },
        },
      });
      expect(autoJournalService.createWithdrawalRejectionJournal).toHaveBeenCalled();
    });
  });
});
