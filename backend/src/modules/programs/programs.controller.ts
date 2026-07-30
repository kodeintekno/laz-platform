import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ProgramsService } from "./programs.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import {
  programSchema,
  programRejectSchema,
  programFeatureSchema,
  type ProgramInput,
  type ProgramRejectInput,
  type ProgramFeatureInput,
} from "../../../../shared/validations/programs.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/programs")
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PROGRAMS_READ)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("lembagaId") lembagaId?: string,
    @Query("status") status?: string,
  ) {
    const { items, metadata } = await this.programsService.getDashboardPrograms(
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
      resolveLembagaScope(user, lembagaId),
      status || undefined,
    );
    return { data: items, meta: metadata };
  }

  @Get(":slug")
  @RequirePermission(PERMISSIONS.PROGRAMS_READ)
  async detail(@Param("slug") slug: string) {
    const program = await this.programsService.getProgramBySlug(slug);
    if (!program) throw new NotFoundException("Program tidak ditemukan");
    return program;
  }

  @Post()
  @RequirePermission(PERMISSIONS.PROGRAMS_CREATE)
  async create(
    @Body(new ZodValidationPipe(programSchema)) body: ProgramInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.programsService.createProgram(body, user);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.PROGRAMS_UPDATE)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(programSchema)) body: ProgramInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.programsService.updateProgram(id, body, user);
  }

  @Patch(":id/approve")
  @RequirePermission(PERMISSIONS.PROGRAMS_APPROVE)
  async approve(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.programsService.approveProgram(id, user.id);
  }

  @Patch(":id/reject")
  @RequirePermission(PERMISSIONS.PROGRAMS_APPROVE)
  async reject(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(programRejectSchema)) body: ProgramRejectInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.programsService.rejectProgram(id, body.reason, user.id);
  }

  @Patch(":id/feature")
  @RequirePermission(PERMISSIONS.PROGRAMS_PUBLISH)
  async setFeatured(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(programFeatureSchema)) body: ProgramFeatureInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.programsService.setFeaturedProgram(id, body.isFeatured, user);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.PROGRAMS_DELETE)
  async remove(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.programsService.deleteProgram(id, user.id);
  }
}
