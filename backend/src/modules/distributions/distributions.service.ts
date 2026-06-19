import { Injectable } from "@nestjs/common";
import { DistributionsRepository } from "./distributions.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import type { DistributionInput } from "../../../../shared/validations/distributions.schema";

@Injectable()
export class DistributionsService {
  constructor(
    private readonly distributionsRepository: DistributionsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getDashboardDistributions(page: number, limit: number, search?: string, lazId?: string) {
    return this.distributionsRepository.findMany(page, limit, search, lazId);
  }

  async getPublicDistributions(programSlug: string) {
    return this.distributionsRepository.getByProgramSlug(programSlug);
  }

  async createDistribution(data: DistributionInput, userId: string) {
    const distribution = await this.distributionsRepository.create(data, userId);

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entity: "Distribution",
      entityId: distribution.id,
      newData: distribution as any,
    });

    return distribution;
  }

  async approveDistribution(distributionId: string, adminUserId: string) {
    const updated = await this.distributionsRepository.approve(distributionId, adminUserId);

    await this.auditService.log({
      userId: adminUserId,
      action: AuditAction.DISTRIBUTION_UPDATE,
      entity: "Distribution",
      entityId: distributionId,
      newData: updated as any,
    });

    return updated;
  }

  async rejectDistribution(distributionId: string, adminUserId: string) {
    const updated = await this.distributionsRepository.reject(distributionId, adminUserId);

    await this.auditService.log({
      userId: adminUserId,
      action: AuditAction.DISTRIBUTION_UPDATE,
      entity: "Distribution",
      entityId: distributionId,
      newData: updated as any,
    });

    return updated;
  }
}
