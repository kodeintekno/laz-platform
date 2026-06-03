import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditTable } from "@/features/audit/components/AuditTable";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { DateRangeFilter } from "@/components/ui";
import { Suspense } from "react";
import React from "react";

export const metadata = {
  title: "Audit Logs",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.AUDIT_READ)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
  const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;
  const startDate = typeof resolvedSearchParams.startDate === "string" ? resolvedSearchParams.startDate : undefined;
  const endDate = typeof resolvedSearchParams.endDate === "string" ? resolvedSearchParams.endDate : undefined;

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

      <Suspense
        key={`${search}-${page}-${limit}-${startDate}-${endDate}`}
        fallback={
          <TableSkeleton
            headers={["Waktu", "Operator", "Aktivitas", "Entitas / ID", "Perubahan Data", "Klien Info"]}
            rowCount={limit}
            columnTypes={["text", "avatar", "text", "text", "text", "text"]}
          />
        }
      >
        <AuditTableSection page={page} limit={limit} search={search} lazId={session.user.lazId} startDate={startDate} endDate={endDate} />
      </Suspense>
    </div>
  );
}

async function AuditTableSection({ page, limit, search, lazId, startDate, endDate }: { page: number; limit: number; search?: string; lazId?: string; startDate?: string; endDate?: string; }) {
  const { items: logs, metadata: paginatedMetadata } = await auditService.getLogs(page, limit, search, lazId, startDate, endDate);

  return (
    <AuditTable 
      logs={logs}
      pagination={{
        currentPage: page,
        totalPages: paginatedMetadata.totalPages,
        totalCount: paginatedMetadata.total,
        pageSize: limit,
      }}
    />
  );
}
