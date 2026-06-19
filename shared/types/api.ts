/**
 * API response envelope + shared DTO types.
 *
 * All backend responses use this envelope:
 *   success: { success: true, data, meta? }
 *   error:   { success: false, error: { code, message, details? } }
 *
 * NOTE: Prisma `Decimal` fields are serialized to **string** in JSON
 * (e.g. "150000"). Frontend code must Number() them before math/formatting.
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    /** zodError.flatten() shape for 422 validation errors */
    details?: {
      formErrors: string[];
      fieldErrors: Record<string, string[] | undefined>;
    };
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;
