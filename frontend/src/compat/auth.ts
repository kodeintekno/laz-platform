import { useAuth } from "@/auth/AuthProvider";

/**
 * Shim kompatibilitas next-auth/react di atas AuthProvider.
 * Komponen lama tetap memakai useSession()/signOut() tanpa perubahan.
 */

export function useSession() {
  const { user, isLoading } = useAuth();
  return {
    data: user ? { user } : null,
    status: isLoading ? ("loading" as const) : user ? ("authenticated" as const) : ("unauthenticated" as const),
  };
}

export function signOut(options?: { callbackUrl?: string }) {
  // logout via AuthProvider tidak bisa dipanggil di luar hook —
  // pakai jalur imperative: POST logout lalu hard-redirect (state bersih).
  void import("@/lib/api-client").then(async ({ api, invalidateCsrfToken }) => {
    try {
      await api.post("/auth/logout");
    } catch {
      // abaikan — session mungkin sudah berakhir
    }
    invalidateCsrfToken();
    window.location.href = options?.callbackUrl ?? "/";
  });
}
