import { z } from "zod";
// Local program enums – avoid importing @prisma/client in client‑side code
export const PROGRAM_CATEGORIES = ["ZAKAT", "INFAK_SEDEKAH", "WAKAF", "CSR", "DSKL"] as const;
export const PROGRAM_STATUSES = ["DRAFT","PENDING_REVIEW","PUBLISHED","REJECTED","COMPLETED","CANCELLED"] as const;

/** Statuses a LEMBAGA_ADMIN may set directly via create/update — publishing/rejecting requires SUPER_ADMIN approval. */
export const PROGRAM_SELF_SERVICE_STATUSES = ["DRAFT", "PENDING_REVIEW"] as const;

export const programSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  targetAmount: z.coerce.number().min(10000, "Target minimal Rp 10.000"),
  category: z.enum(PROGRAM_CATEGORIES),
  status: z.enum(PROGRAM_STATUSES).default("DRAFT"),
  image: z.string().url("Format URL gambar tidak valid").optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  institutionPercentage: z.coerce.number().min(0).max(100).optional(),
  requestedPlatformPercentage: z.coerce.number().min(0).max(100).optional(),
  platformChangeReason: z.string().trim().max(1000, "Alasan perubahan maksimal 1000 karakter").optional().or(z.literal("")),
});

export type ProgramInput = z.infer<typeof programSchema>;

export const programRejectSchema = z.object({
  reason: z.string().min(5, "Alasan penolakan minimal 5 karakter").max(500),
});

export type ProgramRejectInput = z.infer<typeof programRejectSchema>;

/** Maximum number of programs that may be marked as featured (shown on the homepage) at once. */
export const MAX_FEATURED_PROGRAMS = 3;

export const programFeatureSchema = z.object({
  isFeatured: z.boolean(),
});

export type ProgramFeatureInput = z.infer<typeof programFeatureSchema>;
