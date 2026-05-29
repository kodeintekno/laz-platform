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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Riwayat log audit aktivitas mutasi admin dan pengelolaan sistem secara realtime."
      />

      <Suspense
        key={`${search}-${page}`}
        fallback={
          <TableSkeleton
            headers={["Waktu", "Operator", "Aktivitas", "Entitas / ID", "Perubahan Data", "Klien Info"]}
            rowCount={10}
            columnTypes={["text", "avatar", "text", "text", "text", "text"]}
          />
        }
      >
        <AuditTableSection page={page} search={search} lazId={session.user.lazId} />
      </Suspense>
    </div>
  );
}

async function AuditTableSection({ page, search, lazId }: { page: number; search?: string; lazId?: string }) {
  const { items: logs, metadata: paginatedMetadata } = await auditService.getLogs(page, 10, search, lazId);

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


