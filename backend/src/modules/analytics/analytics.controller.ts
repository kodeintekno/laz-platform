import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/dashboard")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Tenant-scoped; cukup login (mengikuti dashboard lama). */
  @Get("overview")
  async overview(@CurrentUser() user: RBACSessionUser, @Query("lembagaId") lembagaId?: string) {
    return this.analyticsService.getDashboardOverview(resolveLembagaScope(user, lembagaId));
  }

  /**
   * Statistik keuangan platform lintas-tenant. Permission khusus mencegah
   * laporan agregat ini bocor ke LEMBAGA_ADMIN.
   */
  @Get("platform-overview")
  @RequirePermission(PERMISSIONS.PLATFORM_FINANCE_READ)
  async platformOverview() {
    return this.analyticsService.getPlatformOverview();
  }
}
