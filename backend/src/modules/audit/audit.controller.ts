import { Controller, Get, Query } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { resolveLazScope } from "../../common/utils/laz-scope";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission(PERMISSIONS.AUDIT_READ)
  async getLogs(
    @CurrentUser() user: RBACSessionUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("lazId") lazId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const { items, metadata } = await this.auditService.getLogs(
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
      resolveLazScope(user, lazId),
      startDate || undefined,
      endDate || undefined,
    );
    return { data: items, meta: metadata };
  }
}
