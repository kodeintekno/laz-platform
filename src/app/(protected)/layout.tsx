import { Sidebar } from "@/features/dashboard/components/Sidebar";
import { NAV_ITEMS, type NavItem } from "@/constants/nav";
import { hasPermission } from "@/features/rbac/lib/permissions";
import { Header } from "@/features/dashboard/components/Header";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { logger } from "@/lib/logger";

/**
 * Protected Route Group Layout.
 *
 * This layout wraps all routes inside (protected)/.
 * It is a Server Component that validates session server-side
 * and redirects unauthenticated users before the layout renders.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // Build initial menu based on server‑side permissions so the sidebar renders immediately
  const initialMenu: NavItem[] = NAV_ITEMS.filter((item) =>
    !item.permission ||
    hasPermission(
      { permissions: session?.user?.permissions ?? [], roleName: session?.user?.roleName },
      item.permission
    )
  );

  // Guard: Redirect unauthenticated users
  if (!session?.user) {
    redirect("/login");
  }

  logger.info(
    {
      userId: session.user.id,
      email: session.user.email,
      roleName: session.user.roleName,
      permissions: session.user.permissions,
    },
    "Protected Layout Loaded"
  );


  return (
    <BreadcrumbProvider>
      <div className="flex h-screen overflow-hidden bg-surface-muted">
        {/* Sidebar */}
        <Sidebar initialItems={initialMenu} user={session?.user} />

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top header bar */}
          <Header user={session?.user} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full" id="main-content">
            {/* Force hot-reload trigger */}
            <div className="mb-4">
              <Breadcrumbs />
            </div>
            {children}
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}

