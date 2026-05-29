import { Badge } from "@/components/ui";
import { ColumnDef } from "@/components/ui/data-table";

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

export function getAuditTableColumns(): ColumnDef<any>[] {
  return [
    {
      header: "Waktu",
      cell: (log) => (
        <span className="text-primary font-medium text-sm">{formatDate(log.createdAt)}</span>
      ),
    },
    {
      header: "Operator",
      cell: (log) =>
        log.user ? (
          <div>
            <div className="font-semibold text-primary">{log.user.name}</div>
            <div className="text-xs text-secondary">{log.user.email}</div>
          </div>
        ) : (
          <span className="italic text-muted font-medium">System</span>
        ),
    },
    {
      header: "Aktivitas",
      cell: (log) => (
        <Badge intent={getActionIntent(log.action)}>{log.action}</Badge>
      ),
    },
    {
      header: "Entitas / ID",
      cell: (log) => (
        <div>
          <span className="font-semibold text-primary">{log.entity}</span>
          {log.entityId && (
            <span className="block text-xs font-mono text-muted mt-0.5 truncate max-w-[120px]" title={log.entityId}>
              {log.entityId}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Perubahan Data",
      cell: (log) =>
        log.oldData || log.newData ? (
          <details className="text-xs text-secondary font-mono cursor-pointer">
            <summary className="text-xs text-brand-primary font-semibold hover:underline outline-none">
              Lihat snapshot
            </summary>
            <pre className="mt-2 p-2 bg-surface-muted border border-border rounded-lg max-w-xs overflow-x-auto text-[10px] leading-tight select-all">
              {JSON.stringify({ sebelum: log.oldData, sesudah: log.newData }, null, 2)}
            </pre>
          </details>
        ) : (
          <span className="text-xs text-muted italic">No snapshot</span>
        ),
    },
    {
      header: "Klien Info",
      cell: (log) => (
        <div className="max-w-[200px]">
          <div className="truncate text-xs font-semibold text-secondary" title={log.ipAddress}>
            IP: {log.ipAddress || "-"}
          </div>
          <div className="truncate text-[10px] text-muted mt-0.5" title={log.userAgent}>
            Agent: {log.userAgent || "-"}
          </div>
        </div>
      ),
    },
  ];
}
