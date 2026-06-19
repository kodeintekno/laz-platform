import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { ProgramTable } from "@/features/programs/components/ProgramTable";
import { PageHeader, Button, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLazFilter } from "@/features/users/components/UserLazFilter";
import { Link } from "react-router-dom";

export function ProgramsListPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lazId = searchParams.get("lazId") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["programs", { page, limit, search, lazId }],
    queryFn: () => api.get<any[]>("/programs", { page, limit, search, lazId }),
  });

  const { data: lazsResult } = useQuery({
    queryKey: ["laz", "options"],
    queryFn: () => api.get<any>("/laz/options"),
    enabled: isSuperAdmin,
  });

  const programs = (result?.data ?? []).map((p: any) => ({
    ...p,
    targetAmount: Number(p.targetAmount),
    currentAmount: Number(p.currentAmount),
    distributedAmount: Number(p.distributedAmount),
  }));

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Management"
        description="Kelola semua program kampanye zakat, infak, dan sedekah."
        action={
          can(PERMISSIONS.PROGRAMS_CREATE) ? (
            <Link to="/dashboard/programs/new">
              <Button size="sm">Buat Program</Button>
            </Link>
          ) : undefined
        }
      />

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari judul atau deskripsi..."
        filterSlot={
          isSuperAdmin && lazsResult?.data?.length ? (
            <UserLazFilter lazs={lazsResult.data} />
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton
          headers={["Judul Program", "Kategori", "Terkumpul", "Status", "Aksi"]}
          rowCount={limit}
          columnTypes={["text", "text", "text", "text", "action"]}
        />
      ) : (
        <ProgramTable programs={programs} pagination={pagination} />
      )}
    </div>
  );
}
