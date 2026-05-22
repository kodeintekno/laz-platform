"use server";

import { auth } from "@/lib/auth";
import { rbacService } from "@/features/rbac/services/rbac.service";
import { PERMISSIONS } from "@/constants/permissions";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for RBAC Management.
 */

export async function saveRolePermissionsAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // RBAC Guard
    if (!session.user.permissions.includes(PERMISSIONS.ROLES_MANAGE)) {
      return { error: "Anda tidak memiliki akses untuk mengubah role permissions" };
    }

    const roleId = formData.get("roleId") as string;
    
    // Extract all checked permission IDs for this role
    const permissionIds = formData.getAll(`permissions_${roleId}`) as string[];

    if (!roleId) {
      return { error: "Data tidak lengkap" };
    }

    await rbacService.updateRolePermissions(roleId, permissionIds, session.user.id);
    
    // Invalidate the cache so the UI updates
    revalidatePath("/dashboard/rbac");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menyimpan permissions" };
  }
}
