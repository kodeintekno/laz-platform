"use server";

import { auth } from "@/lib/auth";
import { donationsService } from "@/features/donations/services/donations.service";
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
    
    // Auto-simulate payment success for Phase 4 Demo
    await donationsService.simulatePaymentSuccess(donation.id);

    revalidatePath("/programs/[slug]", "page");
    revalidatePath("/dashboard/donations");
    
    return { success: true, donationId: donation.id };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat memproses donasi" };
  }
}

export async function simulatePaymentAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.PAYMENTS_MANAGE)) {
      return { error: "Akses ditolak" };
    }

    const donationId = formData.get("donationId") as string;
    if (!donationId) return { error: "ID Donasi diperlukan" };

    await donationsService.simulatePaymentSuccess(donationId, session.user.id);
    revalidatePath("/dashboard/donations");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal simulasi pembayaran" };
  }
}
