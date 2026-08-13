import { Controller, Get, Query } from "@nestjs/common";
import { LedgerService } from "./ledger.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { AppError } from "../../common/errors/app.error";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/ledger")
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @RequirePermission(PERMISSIONS.JOURNAL_READ)
  async getLedger(
    @CurrentUser() user: RBACSessionUser,
    @Query("lembagaId") queryLembagaId?: string,
    @Query("accountId") accountId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const lembagaId = resolveLembagaScope(user, queryLembagaId);
    if (!lembagaId) {
      throw new AppError("LEMBAGA_REQUIRED", "Parameter lembagaId diperlukan", 400);
    }
    
    if (!accountId) {
      throw new AppError("ACCOUNT_REQUIRED", "Parameter accountId diperlukan", 400);
    }

    const data = await this.ledgerService.getLedger({
      lembagaId,
      accountId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return {
      data: {
        account: data.account,
        openingBalance: data.openingBalance,
        transactions: data.transactions,
        totalDebit: data.totalDebit,
        totalCredit: data.totalCredit,
        closingBalance: data.closingBalance,
      },
      meta: data.meta,
    };
  }
}
