import { z } from "zod";

// Phone validation regex for standard Indonesian formats (starts with 08 or 62)
const phoneRegex = /^(08|62)[0-9]{7,13}$/;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal harus 2 karakter.")
    .max(50, "Nama maksimal 50 karakter.")
    .trim(),
  phoneNumber: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val))
    .refine(
      (val) => !val || phoneRegex.test(val),
      "Nomor telepon tidak valid. Gunakan format Indonesia (contoh: 0812xxxxxxxx atau 62812xxxxxxxx)."
    ),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Password saat ini minimal harus 6 karakter."),
    newPassword: z
      .string()
      .min(6, "Password baru minimal harus 6 karakter."),
    confirmPassword: z
      .string()
      .min(6, "Konfirmasi password minimal harus 6 karakter."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok.",
    path: ["confirmPassword"],
  });

export const updateNotificationsSchema = z.object({
  emailNotifications: z.boolean(),
  waNotifications: z.boolean(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>;
