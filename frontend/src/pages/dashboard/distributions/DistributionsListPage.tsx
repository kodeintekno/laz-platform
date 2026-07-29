import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { DistributionTable } from "@/features/distributions/components/DistributionTable";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";

export function DistributionsListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lembagaId = searchParams.get("lembagaId") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["distributions", { page, limit, search, lembagaId }],
    queryFn: () => api.get<any[]>("/distributions", { page, limit, search, lembagaId }),
  });

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: isSuperAdmin,
  });

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Penyaluran Dana"
        description="Daftar pengajuan penyaluran dana dari berbagai program kampanye."
      />

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari rincian penyaluran atau nama program..."
        filterSlot={
          isSuperAdmin && lembagasResult?.data?.length ? (
            <UserLembagaFilter lembagas={lembagasResult.data} />
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton
          headers={["Program", "Rincian Penyaluran", "Nominal", "Pemohon", "Status", "Aksi"]}
          rowCount={limit}
          columnTypes={["text", "text", "text", "text", "text", "action"]}
        />
      ) : (
        <DistributionTable distributions={result?.data ?? []} pagination={pagination} />
      )}
    </div>
  );
}
