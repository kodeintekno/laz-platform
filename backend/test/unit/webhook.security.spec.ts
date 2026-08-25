import { Test, TestingModule } from "@nestjs/testing";
import { WebhookService } from "../../src/modules/payments/webhook.service";
import { PaymentsRepository } from "../../src/modules/payments/payments.repository";
import { AuditService } from "../../src/modules/audit/audit.service";
import { ConfigService } from "@nestjs/config";
import { AppError } from "../../src/common/errors/app.error";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Webhook Security", () => {
  let service: WebhookService;
  let paymentsRepository: any;
  let configService: any;
  let auditService: any;

  beforeEach(async () => {
    paymentsRepository = {
      findByGatewayRef: vi.fn(),
      updatePaymentAndDonationStatus: vi.fn(),
    };

    configService = {
      get: vi.fn((key) => {
        if (key === "XENDIT_WEBHOOK_TOKEN") return "secure_token_123";
        return null;
      }),
    };

    auditService = { log: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: PaymentsRepository, useValue: paymentsRepository },
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  describe("8. Webhook Authentication Failure", () => {
    it("should throw 401 if x-callback-token is missing", async () => {
      await expect(
        service.processXenditPaymentWebhook("", { event: "payment.capture", data: {} as any } as any)
      ).rejects.toThrow(new AppError("INVALID_WEBHOOK_TOKEN", "Invalid webhook token", 401));
    });

    it("should throw 401 if x-callback-token is incorrect", async () => {
      await expect(
        service.processXenditPaymentWebhook("wrong_token", { event: "payment.capture", data: {} as any } as any)
      ).rejects.toThrow(new AppError("INVALID_WEBHOOK_TOKEN", "Invalid webhook token", 401));
    });
  });

  describe("9. Payment Amount Mismatch", () => {
    it("should throw 400 if webhook amount does not match db amount", async () => {
      paymentsRepository.findByGatewayRef.mockResolvedValue({
        id: "pay-1",
        status: "PENDING",
        amount: 50000,
        xenditPaymentRequestId: "pr-1",
      });

      const payload = {
        event: "payment.capture",
        data: {
          reference_id: "don-1",
          payment_request_id: "pr-1",
          status: "SUCCEEDED",
          request_amount: 10000, // Attacker modified the webhook to say it's paid for a smaller amount
          currency: "IDR"
        }
      } as any;

      await expect(
        service.processXenditPaymentWebhook("secure_token_123", payload)
      ).rejects.toThrow(new AppError("AMOUNT_MISMATCH", "Payment amount mismatch", 400));
    });
  });

  describe("6. Duplicate Payment Webhook", () => {
    it("should ignore webhook if payment is already in terminal state", async () => {
      paymentsRepository.findByGatewayRef.mockResolvedValue({
        id: "pay-1",
        status: "SUCCESS", // Already succeeded
        amount: 50000,
      });

      const payload = {
        event: "payment.capture",
        data: {
          reference_id: "don-1",
          payment_request_id: "pr-1",
          status: "SUCCEEDED",
          request_amount: 50000,
          currency: "IDR"
        }
      } as any;

      const result = await service.processXenditPaymentWebhook("secure_token_123", payload);
      
      expect(result).toEqual({ status: "Already processed", currentStatus: "SUCCESS" });
      expect(paymentsRepository.updatePaymentAndDonationStatus).not.toHaveBeenCalled();
    });

    it("should gracefully handle race condition if updateMany count returns 0", async () => {
      paymentsRepository.findByGatewayRef.mockResolvedValue({
        id: "pay-1",
        status: "PENDING",
        amount: 50000,
        xenditPaymentRequestId: "pr-1",
        donation: { programId: "prog-1" }
      });
      
      // updateMany returns 0 implying it was updated concurrently after the findUnique
      paymentsRepository.updatePaymentAndDonationStatus.mockResolvedValue({ success: false, reason: "ALREADY_PROCESSED" });

      const payload = {
        event: "payment.capture",
        data: {
          reference_id: "don-1",
          payment_request_id: "pr-1",
          status: "SUCCEEDED",
          request_amount: 50000,
          currency: "IDR"
        }
      } as any;

      const result = await service.processXenditPaymentWebhook("secure_token_123", payload);
      
      expect(result).toEqual({ status: "Already processed (concurrently)", currentStatus: "SUCCESS" });
    });
  });
});
