import { donationsRepository } from "@/features/donations/repositories/donations.repository";
import type { DonationInput } from "@/features/donations/validations/donations.schema";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";

export const donationsService = {
  async getDashboardDonations(page: number, limit: number, search?: string, lazId?: string) {
    return donationsRepository.findMany(page, limit, search, lazId);
  },

  async createDonation(data: DonationInput, userId?: string) {
    const result = await donationsRepository.createWithPayment({
      amount: data.amount,
      message: data.message,
      isAnonymous: data.isAnonymous,
      userId,
      programId: data.programId,
      paymentMethod: data.paymentMethod,
    });

    return result;
  },

  async getDonationById(id: string) {
    return donationsRepository.getDonationById(id);
  },

  async createAdminDonation(data: import("../validations/donations.schema").AdminDonationInput, adminUserId: string) {
    const result = await donationsRepository.createAdminDonation(data);

    await auditService.log({
      userId: adminUserId,
      action: AuditAction.CREATE,
      entity: "Donation",
      entityId: result.id,
      newData: result,
    });

    return result;
  },

  async updateAdminDonation(id: string, data: import("../validations/donations.schema").AdminDonationInput, adminUserId: string) {
    const result = await donationsRepository.updateAdminDonation(id, data);

    await auditService.log({
      userId: adminUserId,
      action: AuditAction.UPDATE,
      entity: "Donation",
      entityId: id,
      newData: result,
    });

    return result;
  },

  /**
   * Stub for Webhook / Simulator.
   */
  async simulatePaymentSuccess(donationId: string, adminUserId?: string) {
    const updated = await donationsRepository.markAsPaid(donationId);

    // If an admin triggered this simulation, log it.
    if (adminUserId) {
      await auditService.log({
        userId: adminUserId,
        action: AuditAction.PAYMENT_UPDATE,
        entity: "Donation",
        entityId: donationId,
        newData: { status: "PAID" },
      });
    }

    return updated;
  },
};
