import { Controller, ForbiddenException, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
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
   * Statistik platform lintas-tenant — SUPER_ADMIN only. Dicek eksplisit via
   * roleName (bukan permission key) supaya tidak bocor ke LEMBAGA_ADMIN yang
   * juga punya reports.read/donations.read untuk laporan tenant sendiri.
   */
  @Get("platform-overview")
  async platformOverview(@CurrentUser() user: RBACSessionUser) {
    if (user.roleName !== "SUPER_ADMIN") {
      throw new ForbiddenException("Akses ditolak");
    }
    return this.analyticsService.getPlatformOverview();
  }
}
