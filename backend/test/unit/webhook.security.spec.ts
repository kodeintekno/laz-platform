import { Test, TestingModule } from "@nestjs/testing";
import { WebhookService } from "../../src/modules/payments/webhook.service";
import { PaymentsRepository } from "../../src/modules/payments/payments.repository";
import { AuditService } from "../../src/modules/audit/audit.service";
import { NotificationsService } from "../../src/modules/notifications/notifications.service";
import { ConfigService } from "@nestjs/config";
import { AppError } from "../../src/common/errors/app.error";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Webhook Security", () => {
  let service: WebhookService;
  let paymentsRepository: any;
  let configService: any;
  let auditService: any;
  let notifications: any;

  beforeEach(async () => {
    paymentsRepository = {
      findByGatewayRef: vi.fn(),
      findByXenditPaymentRequestId: vi.fn(),
      updatePaymentAndDonationStatus: vi.fn(),
    };

    configService = {
      get: vi.fn((key) => {
        if (key === "XENDIT_WEBHOOK_TOKEN") return "secure_token_123";
        return null;
      }),
    };

    auditService = { log: vi.fn(), logRequired: vi.fn() };
    notifications = { notifyLembaga: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: PaymentsRepository, useValue: paymentsRepository },
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  describe("8. Webhook Authentication Failure", () => {
    it.each(["", "wrong_token", "secure_token_124"])(
      "rejects a forged success callback with token %j before any financial processing",
      async (token) => {
        paymentsRepository.findByGatewayRef.mockResolvedValue({
          id: "pay-1", donationId: "don-1", status: "PENDING", amount: 50000,
          xenditPaymentRequestId: "pr-1", donation: { programId: "prog-1" },
        });
        const payload = {
          event: "payment.capture",
          data: {
            payment_id: "py-1", reference_id: "don-1", payment_request_id: "pr-1",
            status: "SUCCEEDED", request_amount: 50000, currency: "IDR",
          },
        } as any;

        await expect(service.processXenditPaymentWebhook(token, payload))
          .rejects.toMatchObject({ code: "INVALID_WEBHOOK_TOKEN", status: 401 });
        expect(paymentsRepository.findByGatewayRef).not.toHaveBeenCalled();
        expect(paymentsRepository.findByXenditPaymentRequestId).not.toHaveBeenCalled();
        // This is the only entry point for payment/donation updates and credits.
        expect(paymentsRepository.updatePaymentAndDonationStatus).not.toHaveBeenCalled();
        expect(notifications.notifyLembaga).not.toHaveBeenCalled();
        expect(auditService.logRequired).toHaveBeenCalledWith(expect.objectContaining({
          status: "FAILED", errorMessage: "INVALID_WEBHOOK_TOKEN",
          transactionData: expect.objectContaining({ processingResult: "FAILED" }),
        }));
        const auditOutput = JSON.stringify(auditService.logRequired.mock.calls);
        expect(auditOutput).not.toContain("secure_token_123");
        if (token) expect(auditOutput).not.toContain(token);
      },
    );
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
          payment_id: "py-1", reference_id: "don-1",
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
          payment_id: "py-1", reference_id: "don-1",
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
          payment_id: "py-1", reference_id: "don-1",
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
