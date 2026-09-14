import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "../../../../shared/validations/users.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("users")
  @RequirePermission(PERMISSIONS.USERS_READ)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("lembagaId") lembagaId?: string,
    @Query("category") category?: string,
  ) {
    if (category && !["all", "lembaga", "finance", "volunteer"].includes(category)) {
      throw new BadRequestException("Kategori pengguna tidak valid.");
    }
    if (category && category !== "all" && user.roleName !== "SUPER_ADMIN") {
      throw new ForbiddenException("Filter kategori hanya tersedia untuk Super Admin.");
    }
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new BadRequestException("Pagination tidak valid.");
    }
    if (category === "volunteer") {
      const { items, metadata } = await this.usersService.getVolunteers(pageNumber, pageSize, search || undefined);
      return { data: items, meta: metadata };
    }
    const { items, metadata } = await this.usersService.getUsers(
      pageNumber,
      pageSize,
      search || undefined,
      resolveLembagaScope(user, category === "finance" ? undefined : lembagaId),
      category === "lembaga" ? "LEMBAGA_ADMIN" : category === "finance" ? "FINANCE_PLATFORM" : undefined,
    );
    return { data: items, meta: metadata };
  }

  /** Daftar role untuk dropdown form user. */
  @Get("roles")
  @RequirePermission(PERMISSIONS.USERS_READ)
  async roles(@CurrentUser() user: RBACSessionUser) {
    return this.usersService.getRoles(user.roleName === "SUPER_ADMIN");
  }

  @Get("users/:id")
  @RequirePermission(PERMISSIONS.USERS_READ)
  async detail(@Param("id") id: string) {
    const found = await this.usersService.getUserById(id);
    if (!found) throw new NotFoundException("User tidak ditemukan");
    return found;
  }

  @Post("users")
  @RequirePermission(PERMISSIONS.USERS_CREATE)
  async create(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.usersService.createUser(
      body,
      user.id,
      user.lembagaId ?? undefined,
      user.roleName === "SUPER_ADMIN",
    );
  }

  @Patch("users/:id")
  @RequirePermission(PERMISSIONS.USERS_UPDATE)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.usersService.updateUser(
      id,
      body,
      user.id,
      user.lembagaId ?? undefined,
      user.roleName === "SUPER_ADMIN",
    );
  }

  @Delete("users/:id")
  @RequirePermission(PERMISSIONS.USERS_DELETE)
  async remove(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.usersService.deleteUser(
      id,
      user.id,
      user.lembagaId ?? undefined,
      user.roleName === "SUPER_ADMIN",
    );
  }

  @Patch("users/:id/role")
  @RequirePermission(PERMISSIONS.USERS_MANAGE_ROLES)
  async changeRole(
    @Param("id") id: string,
    @Body() body: { roleId?: string },
    @CurrentUser() user: RBACSessionUser,
  ) {
    if (!body?.roleId) {
      throw new BadRequestException("Data tidak lengkap");
    }
    return this.usersService.changeRole(
      id,
      body.roleId,
      user.id,
      user.lembagaId ?? undefined,
      user.roleName === "SUPER_ADMIN"
    );
  }
}
