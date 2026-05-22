import { z } from "zod";

export const distributionSchema = z.object({
  programId: z.string().min(1, "Program tidak valid"),
  amount: z.coerce.number().min(1000, "Nominal minimal Rp 1.000"),
  title: z.string().min(5, "Judul minimal 5 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  receiptImage: z.string().url("Format URL gambar tidak valid").optional().or(z.literal("")),
});

export type DistributionInput = z.infer<typeof distributionSchema>;
