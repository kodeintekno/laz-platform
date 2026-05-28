import { z } from "zod";

export const LAZ_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const lazSchema = z.object({
  name: z.string().min(3, "Nama LAZ minimal 3 karakter").max(100, "Nama LAZ maksimal 100 karakter"),
  slug: z
    .string()
    .min(3, "Slug minimal 3 karakter")
    .max(50, "Slug maksimal 50 karakter")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)"),
  logo: z.string().url("Format URL logo tidak valid").optional().or(z.literal("")),
  status: z.enum(LAZ_STATUSES).default("ACTIVE"),
});

export type LazInput = z.infer<typeof lazSchema>;
