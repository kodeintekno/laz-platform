"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateNotificationsSchema,
} from "../validations/settings.schema";

/**
 * Server Action: Update User Profile (Name, Phone Number)
 */
export async function updateProfileAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Akses ditolak: Sesi tidak valid atau telah berakhir." };
    }

    const rawData = {
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
    };

    const parsed = updateProfileSchema.safeParse(rawData);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Input tidak valid.";
      return { error: errorMsg };
    }

    const { name, phoneNumber } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!existingUser) {
      return { error: "User tidak ditemukan." };
    }

    // Update DB
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phoneNumber,
      },
    });

    // Log Audit
    await auditService.log({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: "User",
      entityId: session.user.id,
      oldData: {
        name: existingUser.name,
        phoneNumber: existingUser.phoneNumber,
      },
      newData: {
        name: updatedUser.name,
        phoneNumber: updatedUser.phoneNumber,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal memperbarui profil." };
  }
}

/**
 * Server Action: Change Password
 */
export async function changePasswordAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Akses ditolak: Sesi tidak valid atau telah berakhir." };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = changePasswordSchema.safeParse(rawData);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Input tidak valid.";
      return { error: errorMsg };
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return { error: "User atau password tidak ditemukan di sistem." };
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return { error: "Password saat ini yang Anda masukkan salah." };
    }

    // Hash and update new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword,
      },
    });

    // Log Audit
    await auditService.log({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: "UserPassword",
      entityId: session.user.id,
      newData: { action: "Password changed by user" },
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah kata sandi." };
  }
}

/**
 * Server Action: Update Notification Preferences
 */
export async function updateNotificationsAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Akses ditolak: Sesi tidak valid atau telah berakhir." };
    }

    const rawData = {
      emailNotifications: formData.get("emailNotifications") === "true",
      waNotifications: formData.get("waNotifications") === "true",
    };

    const parsed = updateNotificationsSchema.safeParse(rawData);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Input tidak valid.";
      return { error: errorMsg };
    }

    const { emailNotifications, waNotifications } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!existingUser) {
      return { error: "User tidak ditemukan." };
    }

    // Update DB
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailNotifications,
        waNotifications,
      },
    });

    // Log Audit
    await auditService.log({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: "UserNotifications",
      entityId: session.user.id,
      oldData: {
        emailNotifications: existingUser.emailNotifications,
        waNotifications: existingUser.waNotifications,
      },
      newData: {
        emailNotifications: updatedUser.emailNotifications,
        waNotifications: updatedUser.waNotifications,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal memperbarui preferensi notifikasi." };
  }
}
