import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditTable } from "@/features/audit/components/AuditTable";

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

  const { items: logs, metadata: paginatedMetadata } = await auditService.getLogs(page, 10, search);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-primary">Audit Logs</h1>
          <p className="mt-2 text-sm text-secondary">
            Riwayat log audit aktivitas mutasi admin dan pengelolaan sistem secara realtime.
          </p>
        </div>
      </div>

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
    </div>
  );
}

