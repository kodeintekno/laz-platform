import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { UserTable } from "@/features/users/components/UserTable";
import { PageHeader, Button, TableSkeleton, Badge } from "@/components/ui";
import { DataTable, DataTableToolbar } from "@/components/ui/data-table";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { Link } from "react-router-dom";

export function UsersListPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const categories = [
    { value: "all", label: "Semua Staf" },
    { value: "lembaga", label: "Lembaga" },
    { value: "finance", label: "Finance Platform" },
    { value: "volunteer", label: "Relawan" },
  ];
  const requestedCategory = searchParams.get("category") ?? "all";
  const category = isSuperAdmin && categories.some((item) => item.value === requestedCategory) ? requestedCategory : "all";
  const isVolunteer = category === "volunteer";
  const showLembagaFilter = isSuperAdmin && (category === "all" || category === "lembaga");
  const changeCategory = (value: string) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("category", value);
      next.set("page", "1");
      next.delete("lembagaId");
      return next;
    });
  };

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lembagaId = showLembagaFilter ? searchParams.get("lembagaId") ?? undefined : undefined;

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["users", { page, limit, search, lembagaId, category }],
    queryFn: () => api.get<any[]>("/users", { page, limit, search, lembagaId, category }),
  });

  const { data: rolesResult } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get<any[]>("/roles"),
  });

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: isSuperAdmin,
  });

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola pengguna staf dan lihat daftar relawan berdasarkan kategori."
        action={
          !isVolunteer && can(PERMISSIONS.USERS_CREATE) ? (
            <Link to="/dashboard/users/new">
              <Button size="md">Tambah Pengguna</Button>
            </Link>
          ) : undefined
        }
      />

      {isSuperAdmin && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kategori pengguna">
          {categories.map((item) => (
            <Button key={item.value} intent={category === item.value ? "primary" : "outline"}
              aria-pressed={category === item.value} onClick={() => changeCategory(item.value)}>
              {item.label}
            </Button>
          ))}
        </div>
      )}

      <DataTableToolbar
        key={category}
        searchValue={search}
        searchPlaceholder="Cari nama atau email..."
        filterSlot={
          showLembagaFilter && lembagasResult?.data?.length ? (
            <UserLembagaFilter lembagas={lembagasResult.data} />
          ) : undefined
        }
      />

      {isError ? <p role="alert" className="text-destructive">Gagal memuat daftar pengguna. Silakan muat ulang halaman.</p> : isLoading ? (
        <TableSkeleton
          headers={isVolunteer ? ["Nama", "Email", "Telepon", "Status"] : isSuperAdmin ? ["Nama", "Email", "Status", "Role / Peran", "Lembaga", "Aksi"] : ["Nama", "Email", "Status", "Role / Peran", "Aksi"]}
          rowCount={limit}
          columnTypes={isVolunteer ? ["text", "text", "text", "text"] : isSuperAdmin ? ["avatar", "text", "text", "text", "text", "action"] : ["avatar", "text", "text", "text", "action"]}
        />
      ) : isVolunteer ? (
        <DataTable
          data={result?.data ?? []}
          columns={[
            { header: "Nama", accessorKey: "name" },
            { header: "Email", accessorKey: "email" },
            { header: "Telepon", accessorKey: "phone" },
            { header: "Status", cell: (volunteer: any) => <Badge intent={volunteer.status === "ACTIVE" ? "success" : "warning"}>{volunteer.status === "ACTIVE" ? "Aktif" : "Ditangguhkan"}</Badge> },
          ]}
          pagination={pagination}
          emptyTitle="Tidak ada relawan ditemukan"
          emptyDescription="Belum ada relawan atau tidak ada yang sesuai dengan pencarian."
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
