import {
  BadRequestException,
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
  ) {
    const { items, metadata } = await this.usersService.getUsers(
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
      resolveLembagaScope(user, lembagaId),
    );
    return { data: items, meta: metadata };
  }

  /** Daftar role untuk dropdown form user. */
  @Get("roles")
  @RequirePermission(PERMISSIONS.USERS_READ)
  async roles() {
    return this.usersService.getRoles();
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
    return this.usersService.changeRole(id, body.roleId, user.id);
  }
}
