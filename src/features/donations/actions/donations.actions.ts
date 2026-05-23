"use server";

import { auth } from "@/lib/auth";
import { donationsService } from "@/features/donations/services/donations.service";
import { donationsRepository } from "@/features/donations/repositories/donations.repository";
import { donationSchema } from "@/features/donations/validations/donations.schema";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/constants/permissions";

export async function createDonationAction(formData: FormData) {
  try {
    const session = await auth(); // Might be null for guests
    const userId = session?.user?.id;

    const rawData = Object.fromEntries(formData.entries());
    const parsed = donationSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: "Data donasi tidak valid", details: parsed.error.flatten() };
    }

    const { donation } = await donationsService.createDonation(parsed.data, userId);
    
    // In Phase 5, we rely on Webhooks, so we leave it PENDING
    // and let the webhook or the Admin Dashboard simulator handle the status change.

    revalidatePath("/programs/[slug]", "page");
    revalidatePath("/dashboard/donations");
    
    return { success: true, donationId: donation.id };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat memproses donasi" };
  }
}

import crypto from "crypto";

export async function generateMockWebhookPayloadAction(donationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.PAYMENTS_MANAGE)) {
      return { error: "Akses ditolak" };
    }

    const donation = await donationsRepository.getDonationWithPayment(donationId);

    if (!donation || !donation.payment) {
      return { error: "Donation atau Payment tidak ditemukan" };
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return { error: "MIDTRANS_SERVER_KEY belum diatur di .env" };
    }

    const payload = {
      order_id: donation.payment.gatewayRef,
      status_code: "200",
      gross_amount: donation.payment.amount.toString(),
      transaction_status: "settlement",
      payment_type: donation.payment.paymentMethod || "bank_transfer",
      transaction_time: new Date().toISOString(),
      transaction_id: `mock-tx-${Date.now()}`,
      signature_key: "",
    };

    const payloadString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
    payload.signature_key = crypto.createHash("sha512").update(payloadString).digest("hex");

    return { success: true, payload };
  } catch (error: any) {
    return { error: error.message || "Gagal membuat payload webhook" };
  }
}
