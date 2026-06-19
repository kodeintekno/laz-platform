import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { resolveLazScope } from "../../common/utils/laz-scope";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/dashboard")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Tenant-scoped; cukup login (mengikuti dashboard lama). */
  @Get("overview")
  async overview(@CurrentUser() user: RBACSessionUser, @Query("lazId") lazId?: string) {
    return this.analyticsService.getDashboardOverview(resolveLazScope(user, lazId));
  }
}
