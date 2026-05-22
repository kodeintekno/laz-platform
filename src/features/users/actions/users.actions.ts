"use server";

import { auth } from "@/lib/auth";
import { usersService } from "@/features/users/services/users.service";
import { PERMISSIONS } from "@/constants/permissions";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for User Management.
 */

export async function changeUserRoleAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // RBAC Guard
    if (!session.user.permissions.includes(PERMISSIONS.USERS_MANAGE_ROLES)) {
      return { error: "Anda tidak memiliki akses untuk mengubah role" };
    }

    const targetUserId = formData.get("userId") as string;
    const newRoleId = formData.get("roleId") as string;

    if (!targetUserId || !newRoleId) {
      return { error: "Data tidak lengkap" };
    }

    await usersService.changeRole(targetUserId, newRoleId, session.user.id);
    
    // Invalidate the users table cache
    revalidatePath("/dashboard/users");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah role" };
  }
}
