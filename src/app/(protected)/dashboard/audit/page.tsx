import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { auditService } from "@/features/audit/services/audit.service";
import { Badge, Input, Button, Pagination, EmptyState } from "@/components/ui";
import Link from "next/link";

export const metadata = {
  title: "Audit Logs | LAZ Platform",
};

function getActionIntent(action: string): "success" | "warning" | "destructive" | "info" | "muted" {
  switch (action) {
    case "CREATE":
      return "success";
    case "UPDATE":
    case "PAYMENT_UPDATE":
    case "DISTRIBUTION_UPDATE":
      return "warning";
    case "DELETE":
    case "ROLE_CHANGE":
      return "destructive";
    case "LOGIN":
      return "info";
    case "LOGOUT":
    default:
      return "muted";
  }
}

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
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

  const { items: logs, metadata } = await auditService.getLogs(page, 10, search);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Riwayat log audit aktivitas mutasi admin dan pengelolaan sistem secara realtime.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form method="GET" className="flex items-center gap-2 max-w-md">
        <Input
          name="search"
          defaultValue={search || ""}
          placeholder="Cari operator, entitas, atau aktivitas..."
          className="w-full bg-white"
        />
        <Button type="submit">Cari</Button>
        {search && (
          <Link href="?">
            <Button type="button" intent="outline">Reset</Button>
          </Link>
        )}
      </form>

      {logs.length === 0 ? (
        <EmptyState
          title="Tidak ada log audit ditemukan"
          description="Riwayat log audit kosong atau tidak ada catatan yang sesuai dengan pencarian Anda."
        />
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Waktu
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Operator
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Aktivitas
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Entitas / ID
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Perubahan Data
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Klien Info
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logs.map((log: any) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 font-medium">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {log.user ? (
                      <div>
                        <div className="font-semibold text-gray-900">{log.user.name}</div>
                        <div className="text-xs text-gray-500">{log.user.email}</div>
                      </div>
                    ) : (
                      <span className="italic text-gray-400">System</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <Badge intent={getActionIntent(log.action)}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{log.entity}</span>
                    {log.entityId && (
                      <span className="block text-xs font-mono text-gray-400 mt-0.5 truncate max-w-[120px]">
                        {log.entityId}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {(log.oldData || log.newData) ? (
                      <details className="text-xs text-slate-500 font-mono cursor-pointer">
                        <summary className="text-xs text-indigo-600 font-semibold hover:underline outline-none">
                          Lihat snapshot
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-lg max-w-xs overflow-x-auto text-[10px] leading-tight select-all">
                          {JSON.stringify({ sebelum: log.oldData, sesudah: log.newData }, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No snapshot</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 max-w-[200px]">
                    <div className="truncate text-xs font-semibold text-gray-700" title={log.ipAddress}>
                      IP: {log.ipAddress || "-"}
                    </div>
                    <div className="truncate text-[10px] text-gray-400 mt-0.5" title={log.userAgent}>
                      Agent: {log.userAgent || "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      {metadata.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={metadata.totalPages}
          totalCount={metadata.total}
          pageSize={10}
        />
      )}
    </div>
  );
}

