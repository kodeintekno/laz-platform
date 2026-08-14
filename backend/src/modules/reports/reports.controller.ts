import { Controller, Get, Query } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("summary")
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  async summary(@CurrentUser() user: RBACSessionUser, @Query("lembagaId") lembagaId?: string) {
    return this.reportsService.getSummaryStats(resolveLembagaScope(user, lembagaId));
  }

  @Get("donation-trend")
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  async donationTrend(
    @CurrentUser() user: RBACSessionUser,
    @Query("lembagaId") lembagaId?: string,
    @Query("period") period?: "monthly" | "yearly",
    @Query("programId") programId?: string,
  ) {
    return this.reportsService.getDonationTrend(
      resolveLembagaScope(user, lembagaId),
      period ?? "monthly",
      programId,
    );
  }

  @Get("top-programs")
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  async topPrograms(
    @CurrentUser() user: RBACSessionUser,
    @Query("lembagaId") lembagaId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reportsService.getTopPrograms(
      resolveLembagaScope(user, lembagaId),
      Number(limit) || 5,
    );
  }
}
