import { z } from "zod";

export const LEMBAGA_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

/** Internal Super Admin CRUD (closest to the old admin-only `lazSchema`). */
export const lembagaAdminSchema = z.object({
  name: z.string().min(3, "Nama lembaga minimal 3 karakter").max(100, "Nama lembaga maksimal 100 karakter"),
  slug: z
    .string()
    .min(3, "Slug minimal 3 karakter")
    .max(50, "Slug maksimal 50 karakter")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)"),
  logoUrl: z.string().url("Format URL logo tidak valid").optional().or(z.literal("")),
  logoPublicId: z.string().optional().or(z.literal("")),
  status: z.enum(LEMBAGA_STATUSES).default("PENDING"),
});

export type LembagaAdminInput = z.infer<typeof lembagaAdminSchema>;

/** Public self-service registration: lembaga profile + its first admin account. */
export const lembagaRegistrationSchema = z
  .object({
    name: z.string().min(3, "Nama lembaga minimal 3 karakter").max(100, "Nama lembaga maksimal 100 karakter"),
    picName: z.string().min(2, "Nama penanggung jawab minimal 2 karakter").max(100),
    picPhone: z.string().min(7, "Nomor telepon minimal 7 karakter").max(20, "Nomor telepon maksimal 20 karakter"),
    address: z.string().min(10, "Alamat minimal 10 karakter"),
    description: z.string().min(20, "Deskripsi minimal 20 karakter").max(2000, "Deskripsi maksimal 2000 karakter"),
    website: z.string().url("Format URL website tidak valid").optional().or(z.literal("")),
    izinYayasanNumber: z.string().min(3, "Nomor izin yayasan wajib diisi").max(100),
    logoUrl: z.string().min(1, "Logo lembaga wajib diupload"),
    logoPublicId: z.string().optional().or(z.literal("")),
    officePhotoUrl: z.string().url().optional().or(z.literal("")),
    officePhotoPublicId: z.string().optional().or(z.literal("")),
    aktaYayasanUrl: z.string().min(1, "Akta Yayasan wajib diupload"),
    aktaYayasanPublicId: z.string().optional().or(z.literal("")),
    skKemenkumhamUrl: z.string().min(1, "SK Kemenkumham / Legalitas wajib diupload"),
    skKemenkumhamPublicId: z.string().optional().or(z.literal("")),
    npwpUrl: z.string().url().optional().or(z.literal("")),
    npwpPublicId: z.string().optional().or(z.literal("")),
    otherDocumentUrl: z.string().url().optional().or(z.literal("")),
    otherDocumentPublicId: z.string().optional().or(z.literal("")),
    adminName: z.string().min(2, "Nama minimal 2 karakter").max(100),
    adminEmail: z.string().email("Format email tidak valid"),
    adminPassword: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export type LembagaRegistrationInput = z.infer<typeof lembagaRegistrationSchema>;

/** Self-edit profile for LEMBAGA_ADMIN — excludes status/approval fields. */
export const lembagaProfileSchema = z.object({
  name: z.string().min(3, "Nama lembaga minimal 3 karakter").max(100, "Nama lembaga maksimal 100 karakter"),
  picName: z.string().min(2, "Nama penanggung jawab minimal 2 karakter").max(100),
  picPhone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().min(10, "Alamat minimal 10 karakter"),
  description: z.string().max(2000).optional().or(z.literal("")),
  website: z.string().url("Format URL website tidak valid").optional().or(z.literal("")),
  izinYayasanNumber: z.string().max(100).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  logoPublicId: z.string().optional().or(z.literal("")),
  officePhotoUrl: z.string().url().optional().or(z.literal("")),
  officePhotoPublicId: z.string().optional().or(z.literal("")),
  bankCode: z.string().optional().or(z.literal("")),
  accountNumber: z.string().optional().or(z.literal("")),
  accountHolder: z.string().optional().or(z.literal("")),
});

export type LembagaProfileInput = z.infer<typeof lembagaProfileSchema>;

export const lembagaRejectSchema = z.object({
  reason: z.string().min(5, "Alasan penolakan minimal 5 karakter").max(500),
});

export type LembagaRejectInput = z.infer<typeof lembagaRejectSchema>;

export const LEMBAGA_DOCUMENT_TYPES = ["AKTA_YAYASAN", "SK_KEMENKUMHAM", "NPWP", "OTHER"] as const;
