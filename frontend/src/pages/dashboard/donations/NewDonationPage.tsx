import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { AdminDonationForm } from "@/features/donations/components/AdminDonationForm";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function NewDonationPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const lazId = isSuperAdmin ? undefined : user?.lazId;

  const { data: programsResult, isLoading: programsLoading } = useQuery({
    queryKey: ["programs", "all", lazId],
    queryFn: () => api.get<any[]>("/programs", { page: 1, limit: 100, lazId }),
  });

  const { data: usersResult, isLoading: usersLoading } = useQuery({
    queryKey: ["users", "all", lazId],
    queryFn: () => api.get<any[]>("/users", { page: 1, limit: 200, lazId }),
  });

  if (programsLoading || usersLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Donasi Manual"
        description="Catat donasi offline yang masuk secara manual ke dalam sistem."
      />
      <AdminDonationForm
        programs={programsResult?.data ?? []}
        users={(usersResult?.data ?? []).map((u: any) => ({ id: u.id, name: u.name, email: u.email }))}
      />
    </div>
  );
}
