import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { AdminDonationForm } from "@/features/donations/components/AdminDonationForm";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function EditDonationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const lembagaId = isSuperAdmin ? undefined : user?.lembagaId;

  const { data: donationResult, isLoading: donationLoading, isError } = useQuery({
    queryKey: ["donations", id],
    queryFn: () => api.get<any>(`/donations/${id}`),
  });

  const { data: programsResult } = useQuery({
    queryKey: ["programs", "all", lembagaId],
    queryFn: () => api.get<any[]>("/programs", { page: 1, limit: 100, lembagaId }),
  });

  const { data: usersResult } = useQuery({
    queryKey: ["users", "all", lembagaId],
    queryFn: () => api.get<any[]>("/users", { page: 1, limit: 200, lembagaId }),
  });

  if (donationLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (isError || !donationResult?.data) {
    navigate("/dashboard/donations", { replace: true });
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Donasi Manual"
        description="Perbarui informasi donasi offline yang sudah tercatat."
      />
      <AdminDonationForm
        programs={programsResult?.data ?? []}
        users={(usersResult?.data ?? []).map((u: any) => ({ id: u.id, name: u.name, email: u.email }))}
        initialData={donationResult.data}
      />
    </div>
  );
}
