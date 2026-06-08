import { donationsRepository } from "@/features/donations/repositories/donations.repository";
import type { DonationInput } from "@/features/donations/validations/donations.schema";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";
import { prisma } from "@/lib/prisma";

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
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      donorPhone: data.donorPhone,
    });

    return result;
  },

  async getDonationById(id: string) {
    return donationsRepository.getDonationById(id);
  },

  async createAdminDonation(data: import("../validations/donations.schema").AdminDonationInput, adminUserId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { lazId: true, role: { select: { name: true } }, isPlatformAdmin: true },
    });
    if (!admin) throw new Error("Admin tidak ditemukan");

    const isSuperAdmin = admin.role?.name === "SUPER_ADMIN" || admin.isPlatformAdmin;

    // Fetch the target program
    const program = await prisma.program.findUnique({
      where: { id: data.programId },
      select: { lazId: true },
    });
    if (!program) throw new Error("Program tidak ditemukan");

    if (!isSuperAdmin && program.lazId !== admin.lazId) {
      throw new Error("Akses ditolak: Anda tidak memiliki wewenang untuk mencatat donasi pada program lembaga lain.");
    }

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
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { lazId: true, role: { select: { name: true } }, isPlatformAdmin: true },
    });
    if (!admin) throw new Error("Admin tidak ditemukan");

    const isSuperAdmin = admin.role?.name === "SUPER_ADMIN" || admin.isPlatformAdmin;

    // Fetch target donation to update
    const donation = await prisma.donation.findUnique({
      where: { id },
      select: { lazId: true },
    });
    if (!donation) throw new Error("Donasi tidak ditemukan");

    if (!isSuperAdmin && donation.lazId !== admin.lazId) {
      throw new Error("Akses ditolak: Anda tidak memiliki wewenang untuk mengubah donasi lembaga lain.");
    }

    // Also fetch target program if changed
    const program = await prisma.program.findUnique({
      where: { id: data.programId },
      select: { lazId: true },
    });
    if (!program) throw new Error("Program tidak ditemukan");

    if (!isSuperAdmin && program.lazId !== admin.lazId) {
      throw new Error("Akses ditolak: Anda tidak memiliki wewenang untuk memindahkan donasi ke program lembaga lain.");
    }

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
