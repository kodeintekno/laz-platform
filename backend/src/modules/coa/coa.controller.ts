import { Controller, Get, Post, Query, Body, HttpCode } from "@nestjs/common";
import { CoaService } from "./coa.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import { AppError } from "../../common/errors/app.error";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/coa")
export class CoaController {
  constructor(private readonly coaService: CoaService) {}

  /**
   * GET /api/coa — Daftar Chart of Accounts milik lembaga.
   *
   * - LEMBAGA_ADMIN: selalu dikunci ke lembagaId dari session (tenant-safe).
   * - SUPER_ADMIN: bisa pass ?lembagaId= untuk melihat COA lembaga tertentu.
   *
   * Response berupa flat array; tree-building dilakukan di sisi frontend.
   */
  @Get()
  @RequirePermission(PERMISSIONS.COA_READ)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("lembagaId") queryLembagaId?: string,
  ) {
    const lembagaId = resolveLembagaScope(user, queryLembagaId);

    if (!lembagaId) {
      throw new AppError(
        "LEMBAGA_REQUIRED",
        "Parameter lembagaId diperlukan untuk SUPER_ADMIN",
        400,
      );
    }

    const accounts = await this.coaService.getCoaByLembaga(lembagaId);
    return accounts;
  }

  /**
   * POST /api/coa/provision — Provision (backfill) COA untuk lembaga.
   * Dipanggil manual via UI jika lembaga belum memiliki COA.
   */
  @Post("provision")
  @HttpCode(200)
  @RequirePermission(PERMISSIONS.COA_READ)
  async provision(
    @CurrentUser() user: RBACSessionUser,
    @Body("lembagaId") bodyLembagaId?: string,
  ) {
    const lembagaId = resolveLembagaScope(user, bodyLembagaId);

    if (!lembagaId) {
      throw new AppError(
        "LEMBAGA_REQUIRED",
        "Parameter lembagaId diperlukan untuk SUPER_ADMIN",
        400,
      );
    }

    await this.coaService.seedCoaForLembaga(lembagaId);
    return { message: "COA berhasil diprovision" };
  }
}
