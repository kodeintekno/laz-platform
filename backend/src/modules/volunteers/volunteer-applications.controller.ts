import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { VolunteerApplicationsService } from "./volunteer-applications.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import {
  volunteerApplicationReviewSchema,
  volunteerReportReviewSchema,
  type VolunteerApplicationReviewInput,
  type VolunteerReportReviewInput,
} from "../../../../shared/validations/volunteers.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

/** Review pendaftaran & laporan kegiatan relawan oleh admin lembaga pemilik kegiatan. */
@Controller("api/lembaga/volunteer-applications")
export class VolunteerApplicationsController {
  constructor(private readonly applicationsService: VolunteerApplicationsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("lembagaId") lembagaId?: string,
    @Query("activityId") activityId?: string,
  ) {
    const { items, metadata } = await this.applicationsService.getDashboardApplications(
      Number(page) || 1,
      Number(limit) || 10,
      resolveLembagaScope(user, lembagaId),
      status || undefined,
      search || undefined,
      activityId || undefined,
    );
    return { data: items, meta: metadata };
  }

  @Patch(":id/approve")
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async approve(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.applicationsService.approve(id, resolveLembagaScope(user), user.id);
  }

  @Patch(":id/reject")
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async reject(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(volunteerApplicationReviewSchema)) body: VolunteerApplicationReviewInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.applicationsService.reject(id, body.reason || "", resolveLembagaScope(user), user.id);
  }

  /** Verifikasi laporan kegiatan — menandai kegiatan selesai untuk relawan ini. */
  @Patch(":id/verify")
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async verify(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(volunteerReportReviewSchema)) body: VolunteerReportReviewInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.applicationsService.verifyReport(id, resolveLembagaScope(user), user.id, body.note);
  }

  /** Minta relawan merevisi & mengirim ulang laporan. */
  @Patch(":id/request-revision")
  @RequirePermission(PERMISSIONS.VOLUNTEERS_MANAGE)
  async requestRevision(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(volunteerReportReviewSchema)) body: VolunteerReportReviewInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.applicationsService.requestReportRevision(id, resolveLembagaScope(user), user.id, body.note);
  }
}
