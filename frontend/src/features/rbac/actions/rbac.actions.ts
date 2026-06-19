import { api, asAction, type ActionResult } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export async function saveRolePermissionsAction(formData: FormData): Promise<ActionResult> {
  const roleId = formData.get("roleId") as string;
  const permissionIds = formData.getAll(`permissions_${roleId}`) as string[];

  const result = await asAction(
    api.put(`/rbac/roles/${roleId}/permissions`, { permissionIds }),
  );
  if ("success" in result) queryClient.invalidateQueries({ queryKey: ["rbac"] });
  return result;
}
