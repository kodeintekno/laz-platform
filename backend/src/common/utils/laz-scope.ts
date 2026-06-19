import type { RBACSessionUser } from "../../../../shared/types/rbac";

/**
 * Tenant scoping: lazId SELALU dari user yang login, tidak pernah dari body.
 * SUPER_ADMIN (platform admin) boleh memfilter via query ?lazId= —
 * meniru perilaku dashboard sebelumnya.
 */
export function resolveLazScope(
  user: RBACSessionUser,
  queryLazId?: string,
): string | undefined {
  if (user.roleName === "SUPER_ADMIN") {
    return queryLazId || undefined;
  }
  return user.lazId;
}
