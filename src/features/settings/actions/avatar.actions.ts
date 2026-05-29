"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    return { error: "URL atau publicId avatar tidak ditemukan." };
  }

  // Remove previous avatar if it exists and is different
  const existing = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (existing?.avatarPublicId && existing.avatarPublicId !== publicId) {
    try {
      const { deleteFile } = await import("@/lib/upload/uploadService");
      await deleteFile(existing.avatarPublicId);
    } catch (_) {
      // ignore deletion errors
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: url, avatarPublicId: publicId } as any,
  });

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
