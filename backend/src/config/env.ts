import { z } from "zod";

/**
 * Environment validation — fail fast on boot when a secret is missing.
 * Used by ConfigModule.forRoot({ validate }).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET minimal 16 karakter"),
  CSRF_SECRET: z.string().min(16, "CSRF_SECRET minimal 16 karakter"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  MIDTRANS_SERVER_KEY: z.string().min(1, "MIDTRANS_SERVER_KEY wajib diisi"),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(flat)
      .map(([key, errs]) => `${key}: ${(errs ?? []).join(", ")}`)
      .join("\n  ");
    throw new Error(`Konfigurasi environment tidak valid:\n  ${messages}`);
  }
  return parsed.data;
}

/** Validated env singleton — populated saat ConfigModule memanggil validateEnv. */
export const env = {
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
};
