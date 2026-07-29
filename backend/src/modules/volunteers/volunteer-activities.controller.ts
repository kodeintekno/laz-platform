import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { VolunteerActivitiesService } from "./volunteer-activities.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import {
  volunteerActivitySchema,
  type VolunteerActivityInput,
} from "../../../../shared/validations/volunteers.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

/** CRUD "Kegiatan Relawan" oleh admin lembaga pemilik kegiatan. */
@Controller("api/lembaga/volunteer-activities")
export class VolunteerActivitiesController {
  constructor(private readonly activitiesService: VolunteerActivitiesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("lembagaId") lembagaId?: string,
  ) {
    const { items, metadata } = await this.activitiesService.getDashboardActivities(
      Number(page) || 1,
      Number(limit) || 10,
      resolveLembagaScope(user, lembagaId),
      search || undefined,
    );
    return { data: items, meta: metadata };
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async detail(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.activitiesService.getById(id, resolveLembagaScope(user));
  }

  @Post()
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async create(
    @Body(new ZodValidationPipe(volunteerActivitySchema)) body: VolunteerActivityInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    if (!user.lembagaId) {
      throw new BadRequestException("Akun ini tidak terhubung dengan lembaga manapun");
    }
    return this.activitiesService.create(body, user.id, user.lembagaId);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(volunteerActivitySchema)) body: VolunteerActivityInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.activitiesService.update(id, body, user.id, resolveLembagaScope(user));
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async remove(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.activitiesService.delete(id, user.id, resolveLembagaScope(user));
  }
}
