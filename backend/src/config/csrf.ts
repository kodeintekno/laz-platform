import { doubleCsrf } from "csrf-csrf";
import type { Request } from "express";

/**
 * CSRF double-submit (csrf-csrf). SPA mengambil token via GET /api/auth/csrf
 * saat boot dan SETELAH login (regenerate session merotasi token), lalu
 * mengirimkannya di header X-CSRF-Token pada setiap mutasi.
 * GET/HEAD/OPTIONS otomatis lolos; webhook dikecualikan di main.ts.
 */
let cached: ReturnType<typeof createCsrf> | undefined;

export function getCsrf() {
  cached ??= createCsrf();
  return cached;
}

function createCsrf() {
  const isProd = process.env.NODE_ENV === "production";

  const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET as string,
    getSessionIdentifier: (req: Request) => req.session?.userId ?? "",
    cookieName: isProd ? "__Host-laz.csrf" : "laz.csrf",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
    },
    getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"] as string,
  });

  return { doubleCsrfProtection, generateCsrfToken };
}

