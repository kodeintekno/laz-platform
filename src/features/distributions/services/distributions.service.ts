import { distributionsRepository } from "../repositories/distributions.repository";
import type { DistributionInput } from "../validations/distributions.schema";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";

export const distributionsService = {
  async getDashboardDistributions(page: number, limit: number, search?: string, lazId?: string) {
    return distributionsRepository.findMany(page, limit, search, lazId);
  },

  async getPublicDistributions(programSlug: string) {
    return distributionsRepository.getByProgramSlug(programSlug);
  },

  async createDistribution(data: DistributionInput, userId: string) {
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
