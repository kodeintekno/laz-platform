import { z } from "zod";
import { ProgramCategory, ProgramStatus } from "@prisma/client";

export const programSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  targetAmount: z.coerce.number().min(10000, "Target minimal Rp 10.000"),
  category: z.nativeEnum(ProgramCategory, { message: "Kategori harus dipilih" }),
  status: z.nativeEnum(ProgramStatus).default(ProgramStatus.DRAFT),
  image: z.string().url("Format URL gambar tidak valid").optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ProgramInput = z.infer<typeof programSchema>;
