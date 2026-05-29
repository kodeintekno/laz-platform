import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditTable } from "@/features/audit/components/AuditTable";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { Suspense } from "react";

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

      <form method="get" className="flex space-x-2 items-end mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" name="startDate" defaultValue={startDate} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" name="endDate" defaultValue={endDate} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <input type="hidden" name="search" value={search ?? ''} />
        <input type="hidden" name="page" value={page.toString()} />
        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/80">Filter</button>
      </form>

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
        <AuditTableSection page={page} search={search} lazId={session.user.lazId} startDate={startDate} endDate={endDate} />
      </Suspense>
    </div>
  );
}

async function AuditTableSection({ page, search, lazId, startDate, endDate }: { page: number; search?: string; lazId?: string; startDate?: string; endDate?: string }) {
  const { items: logs, metadata: paginatedMetadata } = await auditService.getLogs(page, 10, search, lazId, startDate, endDate);

  return (
    <AuditTable
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


