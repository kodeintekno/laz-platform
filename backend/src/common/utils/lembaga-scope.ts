import type { RBACSessionUser } from "../../../../shared/types/rbac";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import { hasPermission } from "../../../../shared/lib/permissions";
import { isPlatformRoleName } from "../../../../shared/lib/roles";
import { ForbiddenException } from "@nestjs/common";

/**
 * Tenant scoping: lembagaId SELALU dari user yang login, tidak pernah dari body.
 * Role dengan akses keuangan platform boleh memfilter via query ?lembagaId= —
 * meniru perilaku dashboard sebelumnya.
 */
export function resolveLembagaScope(
  user: RBACSessionUser,
  queryLembagaId?: string,
): string | undefined {
  if (!isPlatformRoleName(user.roleName) && !user.lembagaId?.trim()) {
    throw new ForbiddenException("Lembaga pengguna tidak ditemukan");
  }
  if (hasPermission(user, PERMISSIONS.PLATFORM_FINANCE_READ)) {
    return queryLembagaId || undefined;
  }
  if (!user.lembagaId?.trim()) {
    throw new ForbiddenException("Lembaga pengguna tidak ditemukan");
  }
  return user.lembagaId;
}
