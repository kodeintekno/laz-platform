import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { DistributionsService } from "./distributions.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import {
  distributionSchema,
  type DistributionInput,
} from "../../../../shared/validations/distributions.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/distributions")
export class DistributionsController {
  constructor(private readonly distributionsService: DistributionsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.DISTRIBUTIONS_READ)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("lembagaId") lembagaId?: string,
  ) {
    const { items, metadata } = await this.distributionsService.getDashboardDistributions(
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
      resolveLembagaScope(user, lembagaId),
    );
    return { data: items, meta: metadata };
  }

  @Post()
  @RequirePermission(PERMISSIONS.DISTRIBUTIONS_MANAGE)
  async create(
    @Body(new ZodValidationPipe(distributionSchema)) body: DistributionInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    const distribution = await this.distributionsService.createDistribution(body, user.id);
    return { distributionId: distribution.id };
  }

  @Post(":id/approve")
  @RequirePermission(PERMISSIONS.DISTRIBUTIONS_MANAGE)
  async approve(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.distributionsService.approveDistribution(id, user.id);
  }

  @Post(":id/reject")
  @RequirePermission(PERMISSIONS.DISTRIBUTIONS_MANAGE)
  async reject(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.distributionsService.rejectDistribution(id, user.id);
  }
}
