import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditTable } from "@/features/audit/components/AuditTable";
import { PageHeader, TableSkeleton } from "@/components/ui";
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
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;
  const startDate = typeof resolvedSearchParams.startDate === "string" ? resolvedSearchParams.startDate : undefined;
  const endDate = typeof resolvedSearchParams.endDate === "string" ? resolvedSearchParams.endDate : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Riwayat log audit aktivitas mutasi admin dan pengelolaan sistem secara realtime."
      />

      <Suspense
        key={`${search}-${page}-${startDate}-${endDate}`}
        fallback={
          <TableSkeleton
            headers={["Waktu", "Operator", "Aktivitas", "Entitas / ID", "Perubahan Data", "Klien Info"]}
            rowCount={10}
            columnTypes={["text", "avatar", "text", "text", "text", "text"]}
          />
        }
      >
        <AuditTableSection page={page} search={search} lazId={session.user.lazId} startDate={startDate} endDate={endDate} filterSlot={<DateRangeFilter startDate={startDate} endDate={endDate} search={search} page={page} />} />
      </Suspense>
    </div>
  );
}

async function AuditTableSection({ page, search, lazId, startDate, endDate, filterSlot }: { page: number; search?: string; lazId?: string; startDate?: string; endDate?: string; filterSlot?: React.ReactNode }) {
  const { items: logs, metadata: paginatedMetadata } = await auditService.getLogs(page, 10, search, lazId, startDate, endDate);

  return (
    <AuditTable filterSlot={filterSlot}
      logs={logs}
      search={search}
      pagination={{
        currentPage: page,
        totalPages: paginatedMetadata.totalPages,
        totalCount: paginatedMetadata.total,
        pageSize: 10,
      }}
    />
  );
}


