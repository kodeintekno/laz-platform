import { Controller, Get, Put, Body, Param, UseGuards } from "@nestjs/common";
import { AmilService } from "./amil.service";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { ProgramCategory } from "@prisma/client";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/amil")
@UseGuards(AuthGuard, PermissionsGuard)
export class AmilController {
  constructor(private readonly amilService: AmilService) {}

  // ─── Super Admin Endpoints ──────────────────────────────────────────────────

  @Get("global-settings")
  @RequirePermission("settings.manage")
  async getGlobalSettings() {
    const data = await this.amilService.getGlobalSettings();
    return data;
  }

  @Put("global-settings")
  @RequirePermission("settings.manage")
  async updateGlobalSetting(
    @Body() body: { category: ProgramCategory; maxTotalPercentage: number; defaultPlatformPercentage: number }
  ) {
    const data = await this.amilService.updateGlobalSetting(
      body.category,
      body.maxTotalPercentage,
      body.defaultPlatformPercentage
    );
    return data;
  }

  @Get("institution-settings/:lembagaId")
  @RequirePermission("lembaga.manage")
  async getInstitutionSettingsByAdmin(@Param("lembagaId") lembagaId: string) {
    const data = await this.amilService.getInstitutionSettings(lembagaId);
    return data;
  }

  @Put("institution-settings/:lembagaId")
  @RequirePermission("lembaga.manage")
  async updateInstitutionSettingByAdmin(
    @Param("lembagaId") lembagaId: string,
    @Body() body: { category: ProgramCategory; institutionPercentage: number; platformPercentage: number }
  ) {
    const data = await this.amilService.updateInstitutionSetting(
      lembagaId,
      body.category,
      body.institutionPercentage,
      body.platformPercentage // Super Admin can override platform percentage
    );
    return data;
  }

  // ─── Institution Admin Endpoints ────────────────────────────────────────────

  @Get("my-settings")
  @RequirePermission("lembaga.read")
  async getMyInstitutionSettings(@CurrentUser() user: RBACSessionUser) {
    if (!user.lembagaId) {
      throw new Error("Lembaga ID is required");
    }
    const data = await this.amilService.getInstitutionSettings(user.lembagaId);
    return data;
  }

  @Put("my-settings")
  @RequirePermission("lembaga.read")
  async updateMyInstitutionSetting(
    @CurrentUser() user: RBACSessionUser,
    @Body() body: { category: ProgramCategory; institutionPercentage: number }
  ) {
    if (!user.lembagaId) {
      throw new Error("Lembaga ID is required");
    }
    const data = await this.amilService.updateInstitutionSetting(
      user.lembagaId,
      body.category,
      body.institutionPercentage
    );
    return data;
  }
}
