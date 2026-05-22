import crypto from "crypto";
import { donationsRepository } from "@/features/donations/repositories/donations.repository";
import { prisma } from "@/lib/prisma";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";
import { PaymentStatus, DonationStatus } from "@prisma/client";

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

export const webhookService = {
  /**
   * Verifies the SHA512 signature sent by Midtrans.
   * hash(order_id + status_code + gross_amount + server_key)
   */
  verifySignature(payload: MidtransWebhookPayload): boolean {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error("MIDTRANS_SERVER_KEY is not configured");
    }

    const payloadString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
    const hash = crypto.createHash("sha512").update(payloadString).digest("hex");

    return hash === payload.signature_key;
  },

  /**
   * Processes the webhook payload safely using idempotency checks.
   */
  async processMidtransWebhook(payload: MidtransWebhookPayload) {
    if (!this.verifySignature(payload)) {
      throw new Error("Invalid signature");
    }

    // 1. Find the payment using gatewayRef (which we mapped to order_id during creation)
    const payment = await prisma.payment.findUnique({
      where: { gatewayRef: payload.order_id },
      include: { donation: true },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // 2. Idempotency Check: if it's already success, don't process it again to prevent double-funding the program
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
    await prisma.$transaction(async (tx) => {
      // Update Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newPaymentStatus,
          metadata: payload as any,
        },
      });

      // Update Donation
      await tx.donation.update({
        where: { id: payment.donationId },
        data: {
          status: newDonationStatus,
        },
      });

      // If successful, increment the Program funding
      if (newDonationStatus === "PAID") {
        await tx.program.update({
          where: { id: payment.donation.programId },
          data: {
            currentAmount: {
              increment: payment.amount,
            },
          },
        });
      }
    });

    // 5. Audit Log (System level, no user)
    await auditService.log({
      userId: null,
      action: AuditAction.PAYMENT_UPDATE,
      entity: "Payment",
      entityId: payment.id,
      oldData: { status: payment.status },
      newData: { status: newPaymentStatus, midtransPayload: payload as any },
    });

    return { status: "Processed", newStatus: newPaymentStatus };
  },
};
