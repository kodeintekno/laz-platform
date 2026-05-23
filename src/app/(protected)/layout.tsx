import { Sidebar } from "@/features/dashboard/components/Sidebar";
import { Header } from "@/features/dashboard/components/Header";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { Breadcrumbs } from "@/components/ui/breadcrumb";

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

  // Guard: Redirect unauthenticated users
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <BreadcrumbProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top header bar */}
          <Header user={session?.user} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6" id="main-content">
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

