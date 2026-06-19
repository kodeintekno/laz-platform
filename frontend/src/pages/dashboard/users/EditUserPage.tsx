import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { UserForm } from "@/features/users/components/UserForm";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const { data: userResult, isLoading: userLoading, isError } = useQuery({
    queryKey: ["users", id],
    queryFn: () => api.get<any>(`/users/${id}`),
  });

  const { data: rolesResult } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get<any[]>("/roles"),
  });

  const { data: lazsResult } = useQuery({
    queryKey: ["laz", "options"],
    queryFn: () => api.get<any>("/laz/options"),
    enabled: isSuperAdmin,
  });

  if (userLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (isError || !userResult?.data) {
    navigate("/dashboard/users", { replace: true });
    return null;
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Ubah Data Pengguna"
        description="Perbarui informasi profil, peran, status, atau password pengguna di sini."
      />
      <UserForm
        initialData={userResult.data as any}
        roles={rolesResult?.data ?? []}
        lazs={lazsResult?.data ?? []}
        isSuperAdmin={isSuperAdmin}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
