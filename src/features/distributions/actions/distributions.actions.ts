"use server";

import { auth } from "@/lib/auth";
import { distributionsService } from "../services/distributions.service";
import { distributionSchema } from "../validations/distributions.schema";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/constants/permissions";

export async function createDistributionAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.DISTRIBUTIONS_MANAGE)) {
      return { error: "Akses ditolak" };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = distributionSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: "Data penyaluran tidak valid", details: parsed.error.flatten() };
    }

    const distribution = await distributionsService.createDistribution(parsed.data, session.user.id);
    
    revalidatePath("/dashboard/distributions");
    
    return { success: true, distributionId: distribution.id };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat membuat penyaluran" };
  }
}

export async function approveDistributionAction(distributionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.DISTRIBUTIONS_MANAGE)) {
      return { error: "Akses ditolak" };
    }

    await distributionsService.approveDistribution(distributionId, session.user.id);
    
    revalidatePath("/dashboard/distributions");
    revalidatePath("/programs/[slug]", "page");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menyetujui penyaluran" };
  }
}

export async function rejectDistributionAction(distributionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.DISTRIBUTIONS_MANAGE)) {
      return { error: "Akses ditolak" };
    }

    await distributionsService.rejectDistribution(distributionId, session.user.id);
    
    revalidatePath("/dashboard/distributions");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menolak penyaluran" };
  }
}
