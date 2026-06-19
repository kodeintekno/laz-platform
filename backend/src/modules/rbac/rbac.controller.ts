import { BadRequestException, Body, Controller, Get, Param, Put } from "@nestjs/common";
import { RbacService } from "./rbac.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/rbac")
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get("matrix")
  @RequirePermission(PERMISSIONS.ROLES_MANAGE)
  async matrix() {
    return this.rbacService.getMatrixData();
  }

  @Put("roles/:roleId/permissions")
  @RequirePermission(PERMISSIONS.ROLES_MANAGE)
  async updateRolePermissions(
    @Param("roleId") roleId: string,
    @Body() body: { permissionIds?: string[] },
    @CurrentUser() user: RBACSessionUser,
  ) {
    if (!Array.isArray(body?.permissionIds)) {
      throw new BadRequestException("Data tidak lengkap");
    }
    await this.rbacService.updateRolePermissions(roleId, body.permissionIds, user.id);
    return { updated: true };
  }
}
