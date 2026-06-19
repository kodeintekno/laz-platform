import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { AuditTable } from "@/features/audit/components/AuditTable";
import { PageHeader, TableSkeleton, DateRangeFilter } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";

export function AuditPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["audit", { page, limit, search, startDate, endDate }],
    queryFn: () =>
      api.get<any[]>("/audit", { page, limit, search, startDate, endDate, lazId: user?.lazId }),
  });

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Audit Logs"
          description="Pantau seluruh aktivitas penting dan krusial yang terjadi di dalam sistem platform."
        />
        <div className="mt-4">
          <DataTableToolbar
            searchValue={search}
            searchPlaceholder="Cari operator, aktivitas, atau entitas..."
            filterSlot={<DateRangeFilter startDate={startDate} endDate={endDate} search={search} page={page} />}
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton
          headers={["Waktu", "Operator", "Aktivitas", "Entitas / ID", "Perubahan Data", "Klien Info"]}
          rowCount={limit}
          columnTypes={["text", "avatar", "text", "text", "text", "text"]}
        />
      ) : (
        <AuditTable logs={result?.data ?? []} pagination={pagination} />
      )}
    </div>
  );
}
