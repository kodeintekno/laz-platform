"use server";

import { auth } from "@/lib/auth";
import { usersService } from "@/features/users/services/users.service";
import { createUserSchema, updateUserSchema } from "../validations/users.schema";
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

/**
 * Server Action to create a new user.
 */
export async function createUserAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.USERS_CREATE)) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk membuat user baru" };
    }

    const rawData = Object.fromEntries(formData.entries());
    
    // Parse checkbox value safely
    const dataToParse = {
      ...rawData,
    };

    const parsed = createUserSchema.safeParse(dataToParse);
    if (!parsed.success) {
      return { error: "Data user tidak valid", details: parsed.error.flatten() };
    }

    const isSuperAdmin = session.user.roleName === "SUPER_ADMIN";

    await usersService.createUser(
      parsed.data,
      session.user.id,
      session.user.lazId,
      isSuperAdmin
    );

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal membuat user baru" };
  }
}

/**
 * Server Action to update an existing user.
 */
export async function updateUserAction(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.USERS_UPDATE)) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk mengubah data user" };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = updateUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Data user tidak valid", details: parsed.error.flatten() };
    }

    const isSuperAdmin = session.user.roleName === "SUPER_ADMIN";

    await usersService.updateUser(
      id,
      parsed.data,
      session.user.id,
      session.user.lazId,
      isSuperAdmin
    );

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal memperbarui data user" };
  }
}

/**
 * Server Action to delete a user.
 */
export async function deleteUserAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.USERS_DELETE)) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk menghapus user" };
    }

    const isSuperAdmin = session.user.roleName === "SUPER_ADMIN";

    await usersService.deleteUser(
      id,
      session.user.id,
      session.user.lazId,
      isSuperAdmin
    );

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus user" };
  }
}
