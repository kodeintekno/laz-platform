import { Test, TestingModule } from "@nestjs/testing";
import { WithdrawalsService } from "../../src/modules/withdrawals/withdrawals.service";
import { WithdrawalsController } from "../../src/modules/withdrawals/withdrawals.controller";
import { WithdrawalsRepository } from "../../src/modules/withdrawals/withdrawals.repository";
import { PrismaService } from "../../src/prisma/prisma.service";
import { XenditService } from "../../src/lib/xendit/xendit.service";
import { AppError } from "../../src/common/errors/app.error";
import { AuthGuard } from "../../src/common/guards/auth.guard";
import { PermissionsGuard } from "../../src/common/guards/permissions.guard";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Withdrawals Security", () => {
  let service: WithdrawalsService;
  let controller: WithdrawalsController;
  let repository: any;
  let prisma: any;
  let xenditService: any;

  beforeEach(async () => {
    prisma = {
      lembaga: { findUnique: vi.fn() },
      lembagaBankAccount: { findFirst: vi.fn() },
      withdrawal: { findUnique: vi.fn() },
    };

    repository = {
      createWithdrawal: vi.fn(),
      approveWithdrawal: vi.fn(),
      createPayoutRecord: vi.fn(),
      updatePayoutStatus: vi.fn(),
    };

    xenditService = {
      createPayout: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithdrawalsController],
      providers: [
        WithdrawalsService,
        { provide: WithdrawalsRepository, useValue: repository },
        { provide: PrismaService, useValue: prisma },
        { provide: XenditService, useValue: xenditService },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: vi.fn(() => true) })
    .overrideGuard(PermissionsGuard)
    .useValue({ canActivate: vi.fn(() => true) })
    .compile();

    service = module.get<WithdrawalsService>(WithdrawalsService);
    controller = module.get<WithdrawalsController>(WithdrawalsController);
  });

  describe("1. Frontend Amount Manipulation (Service Validation)", () => {
    it("should reject negative amount", async () => {
      await expect(service.createWithdrawal("lembaga-1", "user-1", -5000, "bank-1")).rejects.toThrow(
        new AppError("INVALID_AMOUNT", "Withdrawal amount must be a positive integer.", 400)
      );
    });

    it("should reject zero amount", async () => {
      await expect(service.createWithdrawal("lembaga-1", "user-1", 0, "bank-1")).rejects.toThrow(AppError);
    });

    it("should reject floating point amount", async () => {
      await expect(service.createWithdrawal("lembaga-1", "user-1", 10000.5, "bank-1")).rejects.toThrow(AppError);
    });
  });

  describe("2 & 3. Institution ID Manipulation & Cross-Institution Access", () => {
    it("controller strictly uses user.lembagaId and ignores body", async () => {
      const mockReq = {
        user: { id: "user-1", lembagaId: "lembaga-1", permissions: [] },
      };

      prisma.lembaga.findUnique.mockResolvedValue({
        status: "APPROVED",
      });
      prisma.lembagaBankAccount.findFirst.mockResolvedValue({
        id: "bank-1", bankCode: "ID_BCA", accountNumber: "12345", accountHolder: "John",
      });

      // Even if attacker tries to pass a different lembagaId in body, 
      // the controller signature doesn't even accept it. It hardcodes user.lembagaId.
      await controller.createWithdrawal(mockReq as any, { amount: 10000, bankAccountId: "bank-1" });

      expect(repository.createWithdrawal).toHaveBeenCalledWith(
        "lembaga-1", 
        10000, 
        "user-1",
        "bank-1", "ID_BCA", "12345", "John"
      );
    });
  });

  describe("12. Duplicate Payout Creation", () => {
    it("processApprovedWithdrawal uses idempotencyKey", async () => {
      repository.createPayoutRecord.mockResolvedValue({
        status: "REQUESTED",
        idempotencyKey: "uuid-1234",
        referenceId: "payout-with-1"
      });
      xenditService.createPayout.mockResolvedValue({ status: "ACCEPTED", payoutId: "py-1" });

      await service.processApprovedWithdrawal({
        id: "with-1", status: "APPROVED", amount: 10000, bankCode: "BCA", accountNumber: "123", accountHolder: "John"
      });

      expect(xenditService.createPayout).toHaveBeenCalledWith(expect.objectContaining({
        idempotencyKey: "uuid-1234"
      }));
    });
  });

  describe("13. Payout retry after timeout", () => {
    it("retryPayout calls processApprovedWithdrawal which reuses the same idempotency key", async () => {
      prisma.withdrawal.findUnique.mockResolvedValue({
        id: "with-1", status: "APPROVED", amount: 10000, bankCode: "BCA", accountNumber: "123", accountHolder: "John",
        payout: { status: "REQUESTED", idempotencyKey: "uuid-1234", referenceId: "payout-with-1" }
      });
      repository.createPayoutRecord.mockResolvedValue({
        status: "REQUESTED", idempotencyKey: "uuid-1234", referenceId: "payout-with-1"
      });
      xenditService.createPayout.mockResolvedValue({ status: "ACCEPTED", payoutId: "py-1" });

      await controller.retryPayout("with-1");

      expect(xenditService.createPayout).toHaveBeenCalledWith(expect.objectContaining({
        idempotencyKey: "uuid-1234"
      }));
    });
  });
});
