"use server";

import { auth } from "@/lib/auth";
import { lazService } from "@/features/laz/services/laz.service";
import { lazSchema } from "@/features/laz/validations/laz.schema";
import { PERMISSIONS } from "@/constants/permissions";
import { revalidatePath } from "next/cache";

/**
 * Server Action to create a new LAZ organization.
 * Restricted to users with LAZ_MANAGE permission (Super Admins).
 */
export async function createLazAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.LAZ_MANAGE)) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk mengelola LAZ" };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = lazSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: "Data LAZ tidak valid", details: parsed.error.flatten() };
    }

    await lazService.createLaz(parsed.data, session.user.id);

    revalidatePath("/dashboard/laz");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menambahkan LAZ baru" };
  }
}

/**
 * Server Action to delete a LAZ organization.
 * Restricted to users with LAZ_MANAGE permission (Super Admins).
 */
export async function deleteLazAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.LAZ_MANAGE)) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk mengelola LAZ" };
    }

    await lazService.deleteLaz(id, session.user.id);

    revalidatePath("/dashboard/laz");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menghapus LAZ" };
  }
}

/**
 * Server Action to update an existing LAZ organization.
 * Restricted to users with LAZ_MANAGE permission (Super Admins).
 */
export async function EditLazAction(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.LAZ_MANAGE)) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk mengelola LAZ" };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = lazSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Data LAZ tidak valid", details: parsed.error.flatten() };
    }

    await lazService.updateLaz(id, parsed.data, session.user.id);
    revalidatePath("/dashboard/laz");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat memperbarui LAZ" };
  }
}
