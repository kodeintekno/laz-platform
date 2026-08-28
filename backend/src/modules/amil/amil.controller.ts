import { BadRequestException, Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from "@nestjs/common";
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

  @Get("platform-change-requests")
  @RequirePermission("settings.manage")
  async getPlatformChangeRequests(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    const { items, metadata } = await this.amilService.getPlatformChangeRequests(
      Number(page) || 1,
      Number(limit) || 10,
      status || undefined,
      search || undefined,
    );
    return { data: items, meta: metadata };
  }

  @Patch("platform-change-requests/:id/approve")
  @RequirePermission("settings.manage")
  async approvePlatformChangeRequest(
    @Param("id") id: string,
    @CurrentUser() user: RBACSessionUser,
    @Body() body: { reviewNote?: string },
  ) {
    return this.amilService.approvePlatformChangeRequest(id, user.id, body.reviewNote);
  }

  @Patch("platform-change-requests/:id/reject")
  @RequirePermission("settings.manage")
  async rejectPlatformChangeRequest(
    @Param("id") id: string,
    @CurrentUser() user: RBACSessionUser,
    @Body() body: { reviewNote: string },
  ) {
    return this.amilService.rejectPlatformChangeRequest(id, user.id, body.reviewNote);
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

  @Get("my-platform-change-requests")
  @RequirePermission("lembaga.read")
  async getMyPlatformChangeRequests(@CurrentUser() user: RBACSessionUser) {
    if (!user.lembagaId) throw new BadRequestException("Lembaga ID is required");
    return this.amilService.getMyPlatformChangeRequests(user.lembagaId);
  }

  @Post("my-platform-change-requests")
  @RequirePermission("lembaga.read")
  async createMyPlatformChangeRequest(
    @CurrentUser() user: RBACSessionUser,
    @Body() body: { category: ProgramCategory; requestedPlatformPercentage: number; reason: string },
  ) {
    if (!user.lembagaId) throw new BadRequestException("Lembaga ID is required");
    return this.amilService.createPlatformChangeRequest(
      user.lembagaId,
      user.id,
      body.category,
      Number(body.requestedPlatformPercentage),
      body.reason,
    );
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
