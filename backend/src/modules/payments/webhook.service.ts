import { Injectable, Logger, Inject, forwardRef, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentsRepository } from "./payments.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";
import type { DonationStatus, PaymentStatus } from "@prisma/client";
import type { Env } from "../../config/env";

/**
 * Xendit payment.capture webhook payload (v3 API).
 * See: https://docs.xendit.co/apidocs/payment-webhook-notification
 */
export interface XenditPaymentWebhookPayload {
  /** Event type: "payment.capture" | "payment.failure" */
  event: string;
  business_id: string;
  created: string;
  api_version?: string;
  data: {
    /** Xendit payment attempt ID (py-xxxx) */
    payment_id: string;
    /** Xendit payment request ID (pr-xxxx) */
    payment_request_id: string;
    /** Our donationId — passed as reference_id during creation */
    reference_id: string;
    /** Payment status: "SUCCEEDED" | "FAILED" | "EXPIRED" etc. */
    status: string;
    /** Amount in IDR */
    request_amount: number;
    /** Currency code */
    currency: string;
    /** Channel code e.g. "QRIS" or "BCA_VIRTUAL_ACCOUNT" */
    channel_code?: string;
    created: string;
    updated: string;
    /** Reason for failure, if status is FAILED */
    failure_code?: string;
  };
}

import { WithdrawalsRepository } from "../withdrawals/withdrawals.repository";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    @Optional()
    @Inject(forwardRef(() => WithdrawalsRepository))
    private readonly withdrawalsRepository: WithdrawalsRepository,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService<Env>,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  /**
   * Verifies the Xendit webhook authenticity.
   *
   * Xendit webhook verification is simple string equality:
   * compare the x-callback-token header against XENDIT_WEBHOOK_TOKEN env var.
   *
   * Reference: https://docs.xendit.co/docs/payments-api-webhooks
   */
  verifyXenditToken(callbackToken: string): boolean {
    const expectedToken = this.configService.get<string>("XENDIT_WEBHOOK_TOKEN")!;
    if (!expectedToken) {
      throw new AppError("CONFIG_ERROR", "XENDIT_WEBHOOK_TOKEN is not configured", 500);
    }
    // Constant-time comparison to prevent timing attacks
    if (callbackToken.length !== expectedToken.length) return false;
    let result = 0;
    for (let i = 0; i < callbackToken.length; i++) {
      result |= callbackToken.charCodeAt(i) ^ expectedToken.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Processes a Xendit payment webhook safely.
   *
   * Security:
   * - Verifies x-callback-token before any DB access
   * - Looks up payment by reference_id (our donationId) — not by frontend-provided data
   * - Validates amount from DB, not from webhook payload
   * - Idempotent: skips if already in terminal state
   * - Runs DB updates in a transaction
   */
  async processXenditPaymentWebhook(
    callbackToken: string,
    payload: XenditPaymentWebhookPayload,
  ) {
    // 1. Verify webhook token
    if (!this.verifyXenditToken(callbackToken)) {
      this.logger.warn(
        { event: payload.event },
        "Xendit webhook rejected: invalid x-callback-token",
      );
      throw new AppError("INVALID_WEBHOOK_TOKEN", "Invalid webhook token", 401);
    }

    const { data } = payload;

    // Handle Xendit dashboard "Test Webhook" ping which might not have full data
    if (!data || !data.reference_id) {
      this.logger.warn(
        { payload },
        "Xendit webhook: received ping or malformed payload without reference_id",
      );
      return { status: "Test ping received" };
    }

    this.logger.log(
      {
        event: payload.event,
        referenceId: data.reference_id,
        status: data.status,
        paymentRequestId: data.payment_request_id,
      },
      "Processing Xendit webhook",
    );

    // 2. Find payment by our donationId (stored as gatewayRef = reference_id during creation)
    const payment = await this.paymentsRepository.findByGatewayRef(data.reference_id);

    if (!payment) {
      // Could be a test event or unrelated payment — log and return 200 to stop retries
      this.logger.warn(
        { referenceId: data.reference_id },
        "Xendit webhook: payment not found for reference_id",
      );
      return { status: "Payment not found — ignored" };
    }

    // 3. Idempotency: skip if already in a terminal state
    const terminalPaymentStatuses: PaymentStatus[] = ["SUCCESS", "FAILED", "EXPIRED", "CANCELLED"];
    if (terminalPaymentStatuses.includes(payment.status)) {
      this.logger.log(
        { paymentId: payment.id, currentStatus: payment.status },
        "Xendit webhook: already in terminal state — skipping",
      );
      return { status: "Already processed", currentStatus: payment.status };
    }

    // 3.5 Verify Payment Request ID matches (Defense-in-depth)
    if (payment.xenditPaymentRequestId && payment.xenditPaymentRequestId !== data.payment_request_id) {
      this.logger.error(
        {
          paymentId: payment.id,
          expectedPrId: payment.xenditPaymentRequestId,
          actualPrId: data.payment_request_id,
        },
        "Xendit webhook: PAYMENT REQUEST ID MISMATCH",
      );
      throw new AppError("PAYMENT_REQUEST_MISMATCH", "Payment request ID mismatch", 400);
    }

    // 4. Validate amount from DB (never trust webhook amount)
    const dbAmount = Number(payment.amount);
    if (data.request_amount !== dbAmount) {
      this.logger.error(
        {
          paymentId: payment.id,
          dbAmount,
          webhookAmount: data.request_amount,
        },
        "Xendit webhook: AMOUNT MISMATCH — possible tampering",
      );
      // Log as security event but still return 200 to prevent replay
      throw new AppError("AMOUNT_MISMATCH", "Payment amount mismatch", 400);
    }

    // 5. Validate currency
    if (data.currency && data.currency !== "IDR") {
      this.logger.error(
        { currency: data.currency, paymentId: payment.id },
        "Xendit webhook: unexpected currency",
      );
      throw new AppError("CURRENCY_MISMATCH", "Unexpected currency in webhook", 400);
    }

    // 6. Map Xendit event/status to our PaymentStatus + DonationStatus
    let newPaymentStatus: PaymentStatus = "PENDING";
    let newDonationStatus: DonationStatus = "PENDING";
    let paidAt: Date | undefined;

    if (payload.event === "payment.capture" || data.status === "SUCCEEDED") {
      newPaymentStatus = "SUCCESS";
      newDonationStatus = "PAID";
      paidAt = new Date();
    } else if (payload.event === "payment.failure" || data.status === "FAILED") {
      newPaymentStatus = "FAILED";
      newDonationStatus = "FAILED";
    } else if (data.status === "EXPIRED") {
      newPaymentStatus = "EXPIRED";
      newDonationStatus = "EXPIRED";
    } else {
      // Unknown event — log and return 200 to acknowledge receipt
      this.logger.warn(
        { event: payload.event, status: data.status },
        "Xendit webhook: unhandled event/status",
      );
      return { status: "Unhandled event — no action taken" };
    }

    // 7. Update DB in a transaction
    const updateResult = await this.paymentsRepository.updatePaymentAndDonationStatus({
      paymentId: payment.id,
      donationId: payment.donationId,
      programId: payment.donation.programId,
      amount: dbAmount,
      newPaymentStatus,
      newDonationStatus,
      paidAt,
      metadata: payload as any,
      auditUserId: null,
      xenditPaymentId: data.payment_id,
      xenditEvent: payload.event,
    });

    if (!updateResult.success) {
      this.logger.log(
        { paymentId: payment.id },
        "Xendit webhook: already processed (race condition prevented)",
      );
      return { status: "Already processed (concurrently)", currentStatus: newPaymentStatus };
    }

    this.logger.log(
      {
        paymentId: payment.id,
        donationId: payment.donationId,
        newPaymentStatus,
        newDonationStatus,
      },
      "Xendit webhook processed successfully",
    );

    if (newPaymentStatus === "SUCCESS") {
      const donor = payment.donation.isAnonymous ? "Donatur anonim" : (payment.donation.donorName || "Donatur");
      await this.notifications?.notifyLembaga(payment.donation.lembagaId, {
        type: "SUCCESS",
        title: "Donasi berhasil diterima",
        message: `${donor} berdonasi sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(dbAmount)}.`,
        link: "/dashboard/donations",
      });
    }

    return { status: "Processed", newStatus: newPaymentStatus };
  }

  async processXenditPayoutWebhook(callbackToken: string, payload: any) {
    const expectedToken = this.configService.get<string>("XENDIT_WEBHOOK_TOKEN");
    if (!expectedToken || callbackToken !== expectedToken) {
      this.logger.error("Xendit payout webhook: invalid callback token");
      throw new AppError("INVALID_TOKEN", "Invalid callback token", 401);
    }

    if (payload.event !== "payout.succeeded" && payload.event !== "payout.failed") {
      this.logger.warn({ event: payload.event }, "Xendit payout webhook: ignored event");
      return { status: "Ignored event" };
    }

    const payoutId = payload.data?.id;
    const referenceId = payload.data?.reference_id;
    const status = payload.data?.status;

    if (!payoutId || !referenceId || !status) {
      this.logger.error("Xendit payout webhook: missing required fields");
      throw new AppError("INVALID_PAYLOAD", "Missing required fields", 400);
    }

    // Determine target status
    let newPayoutStatus = "FAILED";
    let newWithdrawalStatus = "FAILED";
    if (status === "SUCCEEDED" || status === "COMPLETED") {
      newPayoutStatus = "SUCCEEDED";
      newWithdrawalStatus = "COMPLETED";
    }

    // The reference_id is "payout-<withdrawalId>"
    const withdrawalId = referenceId.replace("payout-", "");
    
    // Find the withdrawal to get lembagaId and amount
    const w = await this.withdrawalsRepository.findById(withdrawalId);
    if (!w || !w.payout) {
      this.logger.error({ withdrawalId }, "Xendit payout webhook: withdrawal or payout not found");
      throw new AppError("NOT_FOUND", "Withdrawal or payout not found", 404);
    }

    const lembagaId = w.lembagaId;
    if (!w.isPlatform && !lembagaId) {
      this.logger.error({ withdrawalId }, "Xendit payout webhook: withdrawal has no lembagaId");
      throw new AppError("INVALID_STATE", "Withdrawal has no institution", 400);
    }

    const result = await this.withdrawalsRepository.updatePayoutStatusAndFinalize(
      w.payout.id,
      withdrawalId,
      lembagaId,
      w.isPlatform,
      w.bankAccount?.chartOfAccountId ?? null,
      Number(w.amount),
      newPayoutStatus,
      newWithdrawalStatus,
      payload
    );

    if (!result.success) {
      this.logger.log({ withdrawalId, reason: result.reason }, "Xendit payout webhook: already processed or not found");
      return { status: "Already processed or invalid state", reason: result.reason };
    }

    this.logger.log({ withdrawalId, newWithdrawalStatus }, "Xendit payout webhook processed successfully");
    return { status: "Processed", newStatus: newWithdrawalStatus };
  }
}
