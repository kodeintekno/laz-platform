import type { RBACSessionUser } from "../../../../shared/types/rbac";

/**
 * Tenant scoping: lembagaId SELALU dari user yang login, tidak pernah dari body.
 * SUPER_ADMIN (platform admin) boleh memfilter via query ?lembagaId= —
 * meniru perilaku dashboard sebelumnya.
 */
export function resolveLembagaScope(
  user: RBACSessionUser,
  queryLembagaId?: string,
): string | undefined {
  if (user.roleName === "SUPER_ADMIN") {
    return queryLembagaId || undefined;
  }
  return user.lembagaId ?? undefined;
}
