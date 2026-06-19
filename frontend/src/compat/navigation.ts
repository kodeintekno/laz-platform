import { useCallback, useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Shim next/navigation di atas react-router + React Query.
 * - router.refresh() → invalidate semua query (pengganti revalidatePath)
 * - useSearchParams() → URLSearchParams read-only (API sama dengan Next)
 */

export function useRouter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMemo(
    () => ({
      push: (url: string) => navigate(url),
      replace: (url: string) => navigate(url, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => {
        void queryClient.invalidateQueries();
      },
      prefetch: (_url: string) => undefined,
    }),
    [navigate, queryClient],
  );
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  const [params] = useRouterSearchParams();
  return params;
}

export function useParams<
  T extends Record<string, string | string[]> = Record<string, string>,
>(): T {
  return useRouterParams() as unknown as T;
}

/** Pengganti redirect() Next — hanya valid dipanggil dalam event handler. */
export function redirect(url: string): never {
  window.location.href = url;
  throw new Error("REDIRECT");
}

/** Hook util pengganti metadata export. */
export function useDocumentTitle(title?: string) {
  if (typeof document !== "undefined" && title) {
    document.title = `${title} | LAZ Platform`;
  }
  return useCallback((t: string) => {
    document.title = `${t} | LAZ Platform`;
  }, []);
}
