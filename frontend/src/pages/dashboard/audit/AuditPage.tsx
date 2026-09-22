import type { AuditLogRecord } from "@/features/audit/types/audit.types";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { AuditTable } from "@/features/audit/components/AuditTable";
import { PageHeader, TableSkeleton, DateRangeFilter } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";

export function AuditPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterFields = [["userId", "User ID"], ["lembagaId", "Lembaga ID"], ["actorRole", "Role"], ["action", "Action"], ["module", "Module"], ["entityId", "Entity ID"], ["status", "SUCCESS / FAILED"], ["ipAddress", "IP"], ["requestId", "Request ID"], ["correlationId", "Correlation ID"]];
  const filters = Object.fromEntries(filterFields.map(([key]) => [key, searchParams.get(key) || undefined]));

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["audit", { page, limit, search, startDate, endDate, filters, scope: user?.lembagaId }],
    queryFn: () =>
      api.get<AuditLogRecord[]>("/audit", { page, limit, search, startDate, endDate, ...filters, lembagaId: user?.lembagaId || filters.lembagaId }),
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

      <form key={searchParams.toString()} className="grid grid-cols-2 md:grid-cols-5 gap-3" onSubmit={(event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const next = new URLSearchParams(searchParams);
        filterFields.forEach(([key]) => { const value = String(values.get(key) || "").trim(); if (value) next.set(key, value); else next.delete(key); });
        next.set("page", "1"); setSearchParams(next);
      }}>
        {filterFields.map(([key, label]) => <label key={key} className="text-xs text-secondary">{label}
          <input name={key} disabled={key === "lembagaId" && Boolean(user?.lembagaId)} defaultValue={key === "lembagaId" ? user?.lembagaId || filters[key] : filters[key]} className="mt-1 block w-full rounded border border-border bg-surface p-2" />
        </label>)}
        <button type="submit" className="rounded border border-border p-2">Terapkan filter</button>
      </form>
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
