import { z } from "zod";

/**
 * Authentication validation schemas using Zod.
 * Shared between client (React Hook Form) and server (Server Actions).
 */

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
