import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** Route bisa diakses tanpa login. AuthGuard tetap memuat req.user jika ada session. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
