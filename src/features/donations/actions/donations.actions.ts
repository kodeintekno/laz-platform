"use server";

import { auth } from "@/lib/auth";
import { donationsService } from "@/features/donations/services/donations.service";
import { donationsRepository } from "@/features/donations/repositories/donations.repository";
import { donationSchema, adminDonationSchema } from "@/features/donations/validations/donations.schema";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/constants/permissions";

export async function createAdminDonationAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.DONATIONS_CREATE)) {
      return { error: "Akses ditolak" };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = adminDonationSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: "Data tidak valid", details: parsed.error.flatten() };
    }

    const donation = await donationsService.createAdminDonation(parsed.data, session.user.id);
    
    revalidatePath("/dashboard/donations");
    return { success: true, donationId: donation.id };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan sistem" };
  }
}

export async function updateAdminDonationAction(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.DONATIONS_UPDATE)) {
      return { error: "Akses ditolak" };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = adminDonationSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: "Data tidak valid", details: parsed.error.flatten() };
    }

    await donationsService.updateAdminDonation(id, parsed.data, session.user.id);
    
    revalidatePath("/dashboard/donations");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan sistem" };
  }
}

export async function createDonationAction(formData: FormData) {
  try {
    const session = await auth(); // Might be null for guests
    const userId = session?.user?.id;

    const rawData = Object.fromEntries(formData.entries());
    const parsed = donationSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: "Data donasi tidak valid", details: parsed.error.flatten() };
    }

    // Server-side validation for guests
    if (!session?.user) {
      if (!parsed.data.donorName || parsed.data.donorName.trim() === "") {
        return { error: "Nama donatur wajib diisi" };
      }
      if (!parsed.data.donorEmail || parsed.data.donorEmail.trim() === "") {
        return { error: "Email donatur wajib diisi" };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(parsed.data.donorEmail)) {
        return { error: "Format email tidak valid" };
      }
    }

    // Auto-populate donor details from session if user is logged in
    if (session?.user) {
      if (!parsed.data.donorName && session.user.name) {
        parsed.data.donorName = session.user.name;
      }
      if (!parsed.data.donorEmail && session.user.email) {
        parsed.data.donorEmail = session.user.email;
      }
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
