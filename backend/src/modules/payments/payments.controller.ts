import { Controller, Get, Query } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { resolveLazScope } from "../../common/utils/laz-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PAYMENTS_READ)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("lazId") lazId?: string,
  ) {
    const { items, metadata } = await this.paymentsService.getPayments(
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
      resolveLazScope(user, lazId),
    );
    return { data: items, meta: metadata };
  }
}
