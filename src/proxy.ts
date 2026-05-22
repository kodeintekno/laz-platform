import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (formerly Middleware) — Phase 1 Scaffold.
 *
 * Next.js 16 renamed `middleware.ts` → `proxy.ts`.
 * The exported function must be named `proxy` (not `middleware` or default).
 *
 * Currently: validates authenticated session for dashboard routes.
 * Unauthenticated users are redirected to /login.
 *
 * TODO (RBAC Phase): Add permission-based route guards.
 *   1. After auth(), call hasPermission(session.user, requiredPermission)
 *   2. Return NextResponse.redirect("/unauthorized") if check fails.
 *
 * TODO (Auth Phase): Handle edge cases:
 *   - Already-authenticated users accessing /login → redirect to /dashboard
 *   - Session expiry handling
 */
export const proxy = auth(function proxyHandler(
  req: NextRequest & { auth: { user?: { id: string } } | null },
) {
  const { nextUrl, auth: session } = req;

  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  // Protect dashboard routes — redirect to login if not authenticated
  if (isDashboardRoute && !session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

/**
 * Matcher — apply proxy only to relevant paths.
 * Exclude static files, API auth routes, and Next.js internals.
 */
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
