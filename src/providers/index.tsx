/**
 * Root providers wrapper.
 *
 * Compose all client-side providers here.
 * This is the single entry point mounted in src/app/layout.tsx.
 *
 * Order matters:
 * 1. SessionProvider   — auth context (outer)
 * 2. QueryProvider     — data fetching (inner, may use session)
 */

import { SessionProvider } from "@/providers/SessionProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import type { Session } from "next-auth";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
