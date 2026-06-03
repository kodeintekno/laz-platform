"use server";

import { auth } from "@/lib/auth";
import { programsService } from "@/features/programs/services/programs.service";
import { programSchema } from "@/features/programs/validations/programs.schema";
import { PERMISSIONS } from "@/constants/permissions";
import { revalidatePath } from "next/cache";

export async function createProgramAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.PROGRAMS_CREATE)) {
      return { error: "Akses ditolak" };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = programSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: "Data program tidak valid", details: parsed.error.flatten() };
    }

    await programsService.createProgram(parsed.data, session.user.id);
    
    revalidatePath("/dashboard/programs");
    revalidatePath("/programs");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat membuat program" };
  }
}

export async function updateProgramAction(id: string, prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.PROGRAMS_UPDATE)) {
      return { error: "Akses ditolak" };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = programSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: "Data program tidak valid", details: parsed.error.flatten() };
    }

    await programsService.updateProgram(id, parsed.data, session.user.id);
    
    revalidatePath("/dashboard/programs");
    revalidatePath("/programs");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat mengupdate program" };
  }
}

export async function deleteProgramAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.permissions.includes(PERMISSIONS.PROGRAMS_DELETE)) {
      return { error: "Akses ditolak" };
    }

    await programsService.deleteProgram(id, session.user.id);
    
    revalidatePath("/dashboard/programs");
    revalidatePath("/programs");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menghapus program" };
  }
}
