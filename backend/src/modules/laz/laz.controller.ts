import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { LazService } from "./laz.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import { lazSchema, type LazInput } from "../../../../shared/validations/laz.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/laz")
export class LazController {
  constructor(private readonly lazService: LazService) {}

  @Get()
  @RequirePermission(PERMISSIONS.LAZ_MANAGE)
  async list(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    const { items, total, totalPages } = await this.lazService.getLazs(
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
    );
    return {
      data: items,
      meta: {
        total,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        totalPages,
      },
    };
  }

  /** Dropdown LAZ aktif — cukup login (dipakai form user). */
  @Get("options")
  async options() {
    return this.lazService.getOptions();
  }

  @Post()
  @RequirePermission(PERMISSIONS.LAZ_MANAGE)
  async create(
    @Body(new ZodValidationPipe(lazSchema)) body: LazInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.lazService.createLaz(body, user.id);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.LAZ_MANAGE)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(lazSchema)) body: LazInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.lazService.updateLaz(id, body, user.id);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.LAZ_MANAGE)
  async remove(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.lazService.deleteLaz(id, user.id);
  }
}
