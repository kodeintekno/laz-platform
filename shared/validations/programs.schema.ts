import { z } from "zod";
// Local program enums – avoid importing @prisma/client in client‑side code
export const PROGRAM_CATEGORIES = ["ZAKAT","INFAK","SEDEKAH","WAKAF"] as const;
export const PROGRAM_STATUSES = ["DRAFT","PUBLISHED"] as const;

export const programSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  targetAmount: z.coerce.number().min(10000, "Target minimal Rp 10.000"),
  category: z.enum(PROGRAM_CATEGORIES),
  status: z.enum(PROGRAM_STATUSES).default("DRAFT"),
  image: z.string().url("Format URL gambar tidak valid").optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ProgramInput = z.infer<typeof programSchema>;
