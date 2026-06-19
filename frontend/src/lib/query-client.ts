import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton QueryClient — dipakai QueryProvider DAN shim actions
 * (invalidateQueries menggantikan revalidatePath server action lama).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 60 seconds
      staleTime: 60 * 1000,
      // Retry failed requests once
      retry: 1,
    },
  },
});
