import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PERMISSION_KEY } from "../decorators/require-permission.decorator";
import type { PermissionKey } from "../../../../shared/constants/permissions";
import { hasPermission } from "../../../../shared/lib/permissions";

/**
 * PermissionsGuard (global, jalan SETELAH AuthGuard) — menegakkan
 * @RequirePermission(key) memakai helper hasPermission yang sama
 * dengan frontend. Tanpa decorator = cukup login.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user;
    if (
      !hasPermission(
        user ? { permissions: user.permissions, roleName: user.roleName } : null,
        required,
      )
    ) {
      throw new ForbiddenException("Akses ditolak");
    }
    return true;
  }
}
