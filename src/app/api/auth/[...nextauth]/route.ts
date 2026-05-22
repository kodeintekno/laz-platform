import { handlers } from "@/lib/auth";

/**
 * NextAuth v5 Route Handler.
 *
 * Exports GET and POST handlers from the auth config.
 * This handles all /api/auth/* routes:
 *   - /api/auth/signin
 *   - /api/auth/signout
 *   - /api/auth/session
 *   - /api/auth/csrf
 *   - /api/auth/callback/[provider]
 */
export const { GET, POST } = handlers;
