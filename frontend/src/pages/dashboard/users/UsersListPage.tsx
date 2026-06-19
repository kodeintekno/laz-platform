import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { UserTable } from "@/features/users/components/UserTable";
import { PageHeader, Button, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLazFilter } from "@/features/users/components/UserLazFilter";
import { Link } from "react-router-dom";

export function UsersListPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lazId = searchParams.get("lazId") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["users", { page, limit, search, lazId }],
    queryFn: () => api.get<any[]>("/users", { page, limit, search, lazId }),
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

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Daftar semua pengguna terdaftar, termasuk donatur, admin, dan relawan."
        action={
          can(PERMISSIONS.USERS_CREATE) ? (
            <Link to="/dashboard/users/new">
              <Button size="md">Tambah Pengguna</Button>
            </Link>
          ) : undefined
        }
      />

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari nama atau email..."
        filterSlot={
          isSuperAdmin && lazsResult?.data?.length ? (
            <UserLazFilter lazs={lazsResult.data} />
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton
          headers={isSuperAdmin ? ["Nama", "Email", "Status", "Role / Peran", "Lembaga Zakat (LAZ)", "Aksi"] : ["Nama", "Email", "Status", "Role / Peran", "Aksi"]}
          rowCount={limit}
          columnTypes={isSuperAdmin ? ["avatar", "text", "text", "text", "text", "action"] : ["avatar", "text", "text", "text", "action"]}
        />
      ) : (
        <UserTable
          users={(result?.data ?? []) as any}
          roles={rolesResult?.data ?? []}
          isSuperAdmin={isSuperAdmin}
          currentUserId={user?.id ?? ""}
          pagination={pagination}
        />
      )}
    </div>
  );
}
