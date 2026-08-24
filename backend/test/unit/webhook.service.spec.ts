import { describe, it, expect, beforeEach, vi, type Mocked } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { WebhookService } from "../../src/modules/payments/webhook.service";
import { PaymentsRepository } from "../../src/modules/payments/payments.repository";
import { AuditService } from "../../src/modules/audit/audit.service";
import { AppError } from "../../src/common/errors/app.error";

describe("WebhookService", () => {
  let service: WebhookService;
  let paymentsRepo: Mocked<PaymentsRepository>;
  let configService: Mocked<ConfigService>;
  let auditService: Mocked<AuditService>;

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
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
