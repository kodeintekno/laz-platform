import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { UserForm } from "@/features/users/components/UserForm";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function NewUserPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const { data: rolesResult, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get<any[]>("/roles"),
  });

  const { data: lazsResult, isLoading: lazsLoading } = useQuery({
    queryKey: ["laz", "options"],
    queryFn: () => api.get<any>("/laz/options"),
    enabled: isSuperAdmin,
  });

  if (rolesLoading || (isSuperAdmin && lazsLoading)) {
    return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Tambah Pengguna Baru"
        description="Buat akun baru untuk pengelola LAZ, relawan, donatur, atau administrator."
      />
      <UserForm
        roles={rolesResult?.data ?? []}
        lazs={lazsResult?.data ?? []}
        isSuperAdmin={isSuperAdmin}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
