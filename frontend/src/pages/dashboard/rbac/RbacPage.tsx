import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { RoleMatrix } from "@/features/rbac/components/RoleMatrix";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function RbacPage() {
  const { data: result, isLoading } = useQuery({
    queryKey: ["rbac", "matrix"],
    queryFn: () => api.get<any>("/rbac/matrix"),
  });

  const matrix = result?.data ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role & Permissions"
        description="Kelola akses sistem. Centang kotak untuk memberikan izin kepada sebuah Role, lalu klik tombol Simpan di bawah nama Role tersebut."
      />
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : (
        <RoleMatrix
          roles={matrix.roles ?? []}
          permissions={matrix.permissions ?? []}
          initialActiveMappings={matrix.activeMappings ?? []}
        />
      )}
    </div>
  );
}
