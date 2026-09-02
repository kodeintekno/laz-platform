import type { RBACSessionUser } from "../../../../shared/types/rbac";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import { hasPermission } from "../../../../shared/lib/permissions";

/**
 * Tenant scoping: lembagaId SELALU dari user yang login, tidak pernah dari body.
 * Role dengan akses keuangan platform boleh memfilter via query ?lembagaId= —
 * meniru perilaku dashboard sebelumnya.
 */
export function resolveLembagaScope(
  user: RBACSessionUser,
  queryLembagaId?: string,
): string | undefined {
  if (hasPermission(user, PERMISSIONS.PLATFORM_FINANCE_READ)) {
    return queryLembagaId || undefined;
  }
  return user.lembagaId ?? undefined;
}
