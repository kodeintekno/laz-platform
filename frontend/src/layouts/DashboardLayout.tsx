import { Outlet } from "react-router-dom";
import { Sidebar } from "@/features/dashboard/components/Sidebar";
import { Header } from "@/features/dashboard/components/Header";
import { useAuth } from "@/auth/AuthProvider";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";

export function DashboardLayout() {
  const { user } = useAuth();

  return (
    <BreadcrumbProvider>
      <div className="flex h-screen overflow-hidden bg-transparent">
        <Sidebar user={user} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header user={user ?? undefined} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
