import { Controller, Get, Query } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { resolveLazScope } from "../../common/utils/laz-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("summary")
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  async summary(@CurrentUser() user: RBACSessionUser, @Query("lazId") lazId?: string) {
    return this.reportsService.getSummaryStats(resolveLazScope(user, lazId));
  }

  @Get("donation-trend")
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  async donationTrend(@CurrentUser() user: RBACSessionUser, @Query("lazId") lazId?: string) {
    return this.reportsService.getDonationTrend(resolveLazScope(user, lazId));
  }

  @Get("top-programs")
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  async topPrograms(
    @CurrentUser() user: RBACSessionUser,
    @Query("lazId") lazId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reportsService.getTopPrograms(
      resolveLazScope(user, lazId),
      Number(limit) || 5,
    );
  }
}
