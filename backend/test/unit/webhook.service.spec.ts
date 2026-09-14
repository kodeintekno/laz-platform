import { describe, it, expect, beforeEach, vi, type Mocked } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { WebhookService } from "../../src/modules/payments/webhook.service";
import { PaymentsRepository } from "../../src/modules/payments/payments.repository";
import { AuditService } from "../../src/modules/audit/audit.service";
import { AppError } from "../../src/common/errors/app.error";
import { WithdrawalsRepository } from "../../src/modules/withdrawals/withdrawals.repository";

describe("WebhookService", () => {
  let service: WebhookService;
  let paymentsRepo: Mocked<PaymentsRepository>;
  let configService: Mocked<ConfigService>;
  let auditService: Mocked<AuditService>;
  let withdrawalsRepo: { findById: ReturnType<typeof vi.fn>; updatePayoutStatusAndFinalize: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    withdrawalsRepo = { findById: vi.fn(), updatePayoutStatusAndFinalize: vi.fn() };
    paymentsRepo = {
      findByGatewayRef: vi.fn(),
      updatePaymentAndDonationStatus: vi.fn(),
      findManyPaged: vi.fn(),
    } as any;

    configService = {
      get: vi.fn().mockReturnValue("secret-token"),
    } as any;

    auditService = {
      log: vi.fn(),
      getLogs: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: PaymentsRepository, useValue: paymentsRepo },
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
        { provide: WithdrawalsRepository, useValue: withdrawalsRepo },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  describe("payout dashboard test", () => {
    const sample = {
      event: "payout.succeeded",
      data: { id: "disb-example", reference_id: "9e01aa0f-d452-4630-916b-7ac77ca12234", status: "SUCCEEDED" },
    };

    it("acknowledges unrelated sample references without touching withdrawals", async () => {
      await expect(service.processXenditPayoutWebhook("secret-token", sample))
        .resolves.toEqual({ status: "Unrelated payout reference — ignored" });
      expect(withdrawalsRepo.findById).not.toHaveBeenCalled();
      expect(withdrawalsRepo.updatePayoutStatusAndFinalize).not.toHaveBeenCalled();
    });

    it("still rejects dashboard samples with an invalid token", async () => {
      await expect(service.processXenditPayoutWebhook("wrong-token", sample)).rejects.toThrow("Invalid callback token");
      expect(withdrawalsRepo.findById).not.toHaveBeenCalled();
    });

    it("keeps missing application payouts retryable", async () => {
      withdrawalsRepo.findById.mockResolvedValue(null);
      await expect(service.processXenditPayoutWebhook("secret-token", {
        ...sample, data: { ...sample.data, reference_id: "payout-withdrawal-123" },
      })).rejects.toThrow("Withdrawal or payout not found");
      expect(withdrawalsRepo.findById).toHaveBeenCalledWith("withdrawal-123");
      expect(withdrawalsRepo.updatePayoutStatusAndFinalize).not.toHaveBeenCalled();
    });
  });

  describe("processXenditPaymentWebhook", () => {
    const validToken = "secret-token";
    const basePayload = {
      event: "payment.capture",
      business_id: "biz-123",
      created: "2023-10-10T00:00:00Z",
      data: {
        payment_id: "py-123",
        payment_request_id: "pr-123",
        reference_id: "don-123",
        status: "SUCCEEDED",
        request_amount: 100000,
        currency: "IDR",
        created: "2023-10-10T00:00:00Z",
        updated: "2023-10-10T00:00:00Z",
      },
    };

    const mockPayment = {
      id: "pay-123",
      donationId: "don-123",
      status: "PENDING",
      amount: "100000",
      xenditPaymentRequestId: "pr-123",
      donation: { programId: "prog-123" },
    };

    // Wire format from the Payments API v2 VA/QRIS callback documentation.
    const v2Payload = {
      event: "payment.succeeded",
      business_id: "biz-123",
      created: basePayload.created,
      api_version: null,
      data: {
        id: "pymt-123",
        payment_request_id: "pr-123",
        reference_id: "don-123",
        amount: 100000,
        currency: "IDR",
        status: "SUCCEEDED",
        created: basePayload.created,
        updated: basePayload.created,
      },
    };

    it.each([
      ["payment.succeeded", "SUCCEEDED", "SUCCESS", "PAID"],
      ["payment.failed", "FAILED", "FAILED", "FAILED"],
    ])("processes v2 %s", async (event, status, paymentStatus, donationStatus) => {
      paymentsRepo.findByGatewayRef.mockResolvedValue(mockPayment as any);
      paymentsRepo.updatePaymentAndDonationStatus.mockResolvedValue({ success: true });
      await service.processXenditPaymentWebhook(validToken, {
        ...v2Payload, event, data: { ...v2Payload.data, status },
      });
      expect(paymentsRepo.updatePaymentAndDonationStatus).toHaveBeenCalledWith(expect.objectContaining({
        amount: 100000, xenditPaymentId: "pymt-123", xenditEvent: event,
        newPaymentStatus: paymentStatus, newDonationStatus: donationStatus,
      }));
    });

    it("rejects a v2 amount mismatch", async () => {
      paymentsRepo.findByGatewayRef.mockResolvedValue(mockPayment as any);
      await expect(service.processXenditPaymentWebhook(validToken, {
        ...v2Payload, data: { ...v2Payload.data, amount: 1 },
      })).rejects.toThrow("Payment amount mismatch");
      expect(paymentsRepo.updatePaymentAndDonationStatus).not.toHaveBeenCalled();
    });

    it.each(["payment_method.expired", "payment_method.activated", "unknown"])(
      "ignores %s even when its status looks like a payment outcome", async (event) => {
        await service.processXenditPaymentWebhook(validToken, { ...v2Payload, event });
        expect(paymentsRepo.findByGatewayRef).not.toHaveBeenCalled();
        expect(paymentsRepo.updatePaymentAndDonationStatus).not.toHaveBeenCalled();
      },
    );

    it.each([
      { status: "FAILED" }, { amount: undefined }, { id: undefined },
      { payment_request_id: undefined },
    ])("rejects incomplete or contradictory v2 outcomes: %j", async (data) => {
      await expect(service.processXenditPaymentWebhook(validToken, {
        ...v2Payload, data: { ...v2Payload.data, ...data },
      } as any)).rejects.toThrow("Invalid payment outcome payload");
      expect(paymentsRepo.updatePaymentAndDonationStatus).not.toHaveBeenCalled();
    });

    it("does not credit a repeated v2 success twice", async () => {
      paymentsRepo.findByGatewayRef.mockResolvedValueOnce(mockPayment as any)
        .mockResolvedValueOnce({ ...mockPayment, status: "SUCCESS" } as any);
      paymentsRepo.updatePaymentAndDonationStatus.mockResolvedValue({ success: true });
      await service.processXenditPaymentWebhook(validToken, v2Payload);
      await service.processXenditPaymentWebhook(validToken, v2Payload);
      expect(paymentsRepo.updatePaymentAndDonationStatus).toHaveBeenCalledTimes(1);
    });

    it("should reject invalid webhook token", async () => {
      await expect(
        service.processXenditPaymentWebhook("invalid-token", basePayload)
      ).rejects.toThrow(AppError);
    });

    it("should skip if payment is already in terminal state", async () => {
      paymentsRepo.findByGatewayRef.mockResolvedValue({
        ...mockPayment,
        status: "SUCCESS",
      } as any);

      const result = await service.processXenditPaymentWebhook(validToken, basePayload);
      expect(result.status).toBe("Already processed");
      expect(paymentsRepo.updatePaymentAndDonationStatus).not.toHaveBeenCalled();
    });

    it("should reject if amount mismatches", async () => {
      paymentsRepo.findByGatewayRef.mockResolvedValue(mockPayment as any);
      const tamperedPayload = { ...basePayload, data: { ...basePayload.data, request_amount: 50000 } };

      await expect(
        service.processXenditPaymentWebhook(validToken, tamperedPayload)
      ).rejects.toThrow(AppError);
    });

    it("should reject if payment_request_id mismatches", async () => {
      paymentsRepo.findByGatewayRef.mockResolvedValue({
        ...mockPayment,
        xenditPaymentRequestId: "pr-999", // Different PR ID
      } as any);

      await expect(
        service.processXenditPaymentWebhook(validToken, basePayload)
      ).rejects.toThrow(AppError);
    });

    it("should handle race condition (updateReturns false)", async () => {
      paymentsRepo.findByGatewayRef.mockResolvedValue(mockPayment as any);
      
      // Simulate concurrent update returning success: false
      paymentsRepo.updatePaymentAndDonationStatus.mockResolvedValue({ success: false, reason: "ALREADY_PROCESSED" } as any);

      const result = await service.processXenditPaymentWebhook(validToken, basePayload);
      expect(result.status).toBe("Already processed (concurrently)");
    });

    it("should process valid webhook and update db", async () => {
      paymentsRepo.findByGatewayRef.mockResolvedValue(mockPayment as any);
      paymentsRepo.updatePaymentAndDonationStatus.mockResolvedValue({ success: true } as any);

      const result = await service.processXenditPaymentWebhook(validToken, basePayload);
      
      expect(result.status).toBe("Processed");
      expect(paymentsRepo.updatePaymentAndDonationStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          newPaymentStatus: "SUCCESS",
          newDonationStatus: "PAID",
          amount: 100000,
          xenditPaymentId: "py-123",
          xenditEvent: "payment.capture",
        })
      );
    });
  });
});
