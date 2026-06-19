import type { ApiErrorBody, PaginationMeta } from "@shared/types/api";

/**
 * Fetch wrapper untuk backend NestJS:
 * - credentials: 'include' (cookie session laz.sid)
 * - header X-CSRF-Token untuk mutasi (token di-cache; refetch setelah
 *   login/logout atau saat 403 CSRF)
 * - unwrap envelope { success, data, meta } → lempar ApiError saat gagal
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: {
      formErrors: string[];
      fieldErrors: Record<string, string[] | undefined>;
    },
  ) {
    super(message);
  }
}

let csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/csrf`, { credentials: "include" });
  const body = (await res.json()) as { success: true; data: { token: string } };
  csrfToken = body.data.token;
  return csrfToken;
}

/** Paksa refresh token CSRF — wajib dipanggil setelah login/logout. */
export function invalidateCsrfToken() {
  csrfToken = null;
}

export interface ApiResult<T> {
  data: T;
  meta?: PaginationMeta;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  init?: { retryCsrf?: boolean },
): Promise<ApiResult<T>> {
  const isMutation = !["GET", "HEAD"].includes(method);
  const headers: Record<string, string> = {};
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (isMutation) {
    headers["X-CSRF-Token"] = csrfToken ?? (await fetchCsrfToken());
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    parsed = undefined;
  }

  if (!res.ok) {
    const err = parsed as ApiErrorBody | undefined;
    const code = err?.error?.code ?? "ERROR";
    // Token CSRF kedaluwarsa (mis. session diregenerate) → ambil ulang, retry sekali
    if (res.status === 403 && isMutation && init?.retryCsrf !== false && /csrf/i.test(`${code} ${err?.error?.message ?? ""}`)) {
      invalidateCsrfToken();
      return request<T>(method, path, body, { retryCsrf: false });
    }
    throw new ApiError(
      res.status,
      code,
      err?.error?.message ?? "Terjadi kesalahan sistem",
      err?.error?.details,
    );
  }

  const ok = parsed as { success: true; data: T; meta?: PaginationMeta };
  return { data: ok.data, meta: ok.meta };
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  if (!params) return path;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `${path}?${qs}` : path;
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>("GET", buildUrl(path, params)),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

/**
 * Bentuk hasil kompatibel server-action lama: { success } | { error, details }.
 * Dipakai shim features/{feature}/actions agar komponen form/tabel tidak berubah.
 */
export type ActionResult<Extra extends object = object> = {
  success?: boolean;
  error?: string;
  details?: { formErrors: string[]; fieldErrors: Record<string, string[] | undefined> };
} & Partial<Extra>;

export async function asAction<T, Extra extends object = object>(
  promise: Promise<ApiResult<T>>,
  mapExtra?: (data: T) => Extra,
): Promise<ActionResult<Extra>> {
  try {
    const { data } = await promise;
    return { success: true, ...(mapExtra ? mapExtra(data) : ({} as Extra)) };
  } catch (e) {
    if (e instanceof ApiError) {
      return { error: e.message, details: e.details } as ActionResult<Extra>;
    }
    return { error: e instanceof Error ? e.message : "Terjadi kesalahan sistemas" } as ActionResult<Extra>;
  }
}

/** Konversi FormData (form lama) → plain object untuk body JSON. */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries());
}
