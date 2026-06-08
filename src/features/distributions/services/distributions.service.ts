import { distributionsRepository } from "../repositories/distributions.repository";
import type { DistributionInput } from "../validations/distributions.schema";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";
import { prisma } from "@/lib/prisma";

export const distributionsService = {
  async getDashboardDistributions(page: number, limit: number, search?: string, lazId?: string) {
    return distributionsRepository.findMany(page, limit, search, lazId);
  },

  async getPublicDistributions(programSlug: string) {
    return distributionsRepository.getByProgramSlug(programSlug);
  },

  async createDistribution(data: DistributionInput, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lazId: true, role: { select: { name: true } }, isPlatformAdmin: true },
    });
    if (!user) throw new Error("Pengguna tidak ditemukan");

    const isSuperAdmin = user.role?.name === "SUPER_ADMIN" || user.isPlatformAdmin;

    const program = await prisma.program.findUnique({
      where: { id: data.programId },
      select: { lazId: true },
    });
    if (!program) throw new Error("Program tidak ditemukan");

    if (!isSuperAdmin && program.lazId !== user.lazId) {
      throw new Error("Akses ditolak: Anda tidak memiliki wewenang untuk menyalurkan dana program dari lembaga lain.");
    }

    const distribution = await distributionsRepository.create(data, userId);

    await auditService.log({
      userId,
      action: AuditAction.CREATE,
      entity: "Distribution",
      entityId: distribution.id,
      newData: distribution as any,
    });

    return distribution;
  },

  async approveDistribution(distributionId: string, adminUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { lazId: true, role: { select: { name: true } }, isPlatformAdmin: true },
    });
    if (!user) throw new Error("Admin tidak ditemukan");

    const isSuperAdmin = user.role?.name === "SUPER_ADMIN" || user.isPlatformAdmin;

    const distribution = await prisma.distribution.findUnique({
      where: { id: distributionId },
      select: { lazId: true },
    });
    if (!distribution) throw new Error("Penyaluran tidak ditemukan");

    if (!isSuperAdmin && distribution.lazId !== user.lazId) {
      throw new Error("Akses ditolak: Anda tidak memiliki wewenang untuk menyetujui penyaluran lembaga lain.");
    }

    const updated = await distributionsRepository.approve(distributionId, adminUserId);

    await auditService.log({
      userId: adminUserId,
      action: AuditAction.DISTRIBUTION_UPDATE,
      entity: "Distribution",
      entityId: distributionId,
      newData: updated as any,
    });

    return updated;
  },

  async rejectDistribution(distributionId: string, adminUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { lazId: true, role: { select: { name: true } }, isPlatformAdmin: true },
    });
    if (!user) throw new Error("Admin tidak ditemukan");

    const isSuperAdmin = user.role?.name === "SUPER_ADMIN" || user.isPlatformAdmin;

    const distribution = await prisma.distribution.findUnique({
      where: { id: distributionId },
      select: { lazId: true },
    });
    if (!distribution) throw new Error("Penyaluran tidak ditemukan");

    if (!isSuperAdmin && distribution.lazId !== user.lazId) {
      throw new Error("Akses ditolak: Anda tidak memiliki wewenang untuk menolak penyaluran lembaga lain.");
    }

    const updated = await distributionsRepository.reject(distributionId, adminUserId);

    await auditService.log({
      userId: adminUserId,
      action: AuditAction.DISTRIBUTION_UPDATE,
      entity: "Distribution",
      entityId: distributionId,
      newData: updated as any,
    });

    return updated;
  },
};
