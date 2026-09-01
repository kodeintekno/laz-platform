import { z } from "zod";
import { INDONESIA_PHONE_REGEX } from "./donations.schema";

export const distributionSchema = z.object({
  programId: z.string().min(1, "Program tidak valid"),
  fundSource: z.enum(["MUSTAHIQ", "AMIL"], { message: "Sumber saldo tidak valid" }),
  amount: z.coerce.number().min(1000, "Nominal minimal Rp 1.000"),
  title: z.string().min(5, "Judul minimal 5 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  receiptImageUrl: z.string().url("Format URL gambar tidak valid").optional().or(z.literal("")),
});

export type DistributionInput = z.infer<typeof distributionSchema>;

export const distributionHistoryQuerySchema = z.object({
  phone: z.string().regex(INDONESIA_PHONE_REGEX, "Format nomor telepon tidak valid"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type DistributionHistoryQuery = z.infer<typeof distributionHistoryQuerySchema>;
