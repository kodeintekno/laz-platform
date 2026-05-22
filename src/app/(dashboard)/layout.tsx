import { Sidebar } from "@/features/dashboard/components/Sidebar";
import { Header } from "@/features/dashboard/components/Header";

/**
 * Dashboard Route Group Layout — Phase 1 Shell.
 *
 * This layout wraps all routes inside (dashboard)/.
 * It is a Server Component — no client state here.
 *
 * RBAC / auth protection:
 * - Full auth guard is enforced by middleware.ts
 * - TODO (Auth Phase): Add `auth()` call to validate session server-side
 *   and redirect unauthenticated users before the layout renders.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header bar */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
