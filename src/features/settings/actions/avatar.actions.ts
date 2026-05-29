"use server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/upload/uploadService";
import { revalidatePath } from "next/cache";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";

/**
 * Server Action: Update user's avatar.
 * Expects FormData with fields `url` and `publicId`.
 */
export async function updateAvatarAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Akses ditolak: Sesi tidak valid." };
  }

  const url = formData.get("url") as string | null;
  const publicId = formData.get("publicId") as string | null;
  if (!url || !publicId) {
    return { error: "URL atau publicId foto profil tidak ditemukan." };
  }

  const existing = await prisma.user.findUnique({ where: { id: session.user.id } });
  const oldPublicId = existing?.avatarPublicId;
  
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: url, avatarPublicId: publicId } as any,
  });

  // Delete previous avatar after successful update
  if (oldPublicId && oldPublicId !== publicId) {
    try {
      await deleteFile(oldPublicId);
      logger.info({ publicId: oldPublicId }, "Deleted old avatar file");
    } catch (e) {
      logger.error({ err: e }, "Failed to delete old avatar file");
    }
  }

  await auditService.log({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: "UserAvatar",
    entityId: session.user.id,
    newData: { avatarUrl: updated.avatarUrl },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}
