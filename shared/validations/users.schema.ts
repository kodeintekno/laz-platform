import { z } from "zod";

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export const createUserSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").max(50, "Nama maksimal 50 karakter"),
    email: z.string().email("Format email tidak valid"),
    roleId: z.string().min(1, "Silakan pilih role"),
    lembagaId: z.string().min(1, "Silakan pilih Lembaga").optional(),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
    status: z.enum(USER_STATUSES).default("ACTIVE"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sesuai",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").max(50, "Nama maksimal 50 karakter"),
    email: z.string().email("Format email tidak valid"),
    roleId: z.string().min(1, "Silakan pilih role"),
    lembagaId: z.string().min(1, "Silakan pilih Lembaga").optional(),
    password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
    status: z.enum(USER_STATUSES).default("ACTIVE"),
  })
  .refine(
    (data) => {
      if (data.password && data.password !== "") {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Konfirmasi password tidak sesuai",
      path: ["confirmPassword"],
    }
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
