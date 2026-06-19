import crypto from "crypto";
import { Injectable } from "@nestjs/common";
import { PaymentsRepository } from "./payments.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";
import type { DonationStatus, PaymentStatus } from "@prisma/client";

export interface MidtransWebhookPayload {
  order_id: string; // We map this to gatewayRef
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string; // 'settlement' | 'capture' | 'pending' | 'deny' | 'cancel' | 'expire' | 'failure'
  payment_type: string;
  transaction_time: string;
  transaction_id: string;
}

@Injectable()
export class WebhookService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Verifies the SHA512 signature sent by Midtrans.
   * hash(order_id + status_code + gross_amount + server_key)
   */
  verifySignature(payload: MidtransWebhookPayload): boolean {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new AppError("CONFIG_ERROR", "MIDTRANS_SERVER_KEY is not configured", 500);
    }

    const payloadString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
    const hash = crypto.createHash("sha512").update(payloadString).digest("hex");

    return hash === payload.signature_key;
  }

  /**
   * Processes the webhook payload safely using idempotency checks.
   */
  async processMidtransWebhook(payload: MidtransWebhookPayload) {
    if (!this.verifySignature(payload)) {
      throw new AppError("INVALID_SIGNATURE", "Invalid signature", 400);
    }

    // 1. Find the payment using gatewayRef (mapped to order_id during creation)
    const payment = await this.paymentsRepository.findByGatewayRef(payload.order_id);

    if (!payment) {
      throw new AppError("PAYMENT_NOT_FOUND", "Payment not found", 400);
    }

    // 2. Idempotency Check: if it's already success, don't process it again
    if (payment.status === "SUCCESS") {
      return { status: "Already processed" };
    }

    // 3. Map Midtrans transaction_status to our PaymentStatus
    let newPaymentStatus: PaymentStatus = "PENDING";
    let newDonationStatus: DonationStatus = "PENDING";

    if (["settlement", "capture"].includes(payload.transaction_status)) {
      newPaymentStatus = "SUCCESS";
      newDonationStatus = "PAID";
    } else if (["deny", "cancel", "failure"].includes(payload.transaction_status)) {
      newPaymentStatus = "FAILED";
      newDonationStatus = "FAILED";
    } else if (payload.transaction_status === "expire") {
      newPaymentStatus = "EXPIRED";
      newDonationStatus = "EXPIRED";
    }

    // If status hasn't changed to a final state, just return early
    if (newPaymentStatus === payment.status) {
      return { status: "No status change" };
    }

    // 4. Update the DB inside a transaction
    await this.paymentsRepository.updatePaymentAndDonationStatus({
      paymentId: payment.id,
      donationId: payment.donationId,
      programId: payment.donation.programId,
      amount: Number(payment.amount),
      newPaymentStatus,
      newDonationStatus,
      metadata: payload,
    });

    // 5. Audit Log (System level, no user)
    await this.auditService.log({
      userId: null,
      action: AuditAction.PAYMENT_UPDATE,
      entity: "Payment",
      entityId: payment.id,
      oldData: { status: payment.status },
      newData: { status: newPaymentStatus, midtransPayload: payload as any },
    });

    return { status: "Processed", newStatus: newPaymentStatus };
  }
}
