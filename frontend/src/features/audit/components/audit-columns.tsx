import type { AuditLogRecord } from "../types/audit.types";
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
    timeStyle: "long",
  }).format(new Date(date));
};

export function getAuditTableColumns(): ColumnDef<AuditLogRecord>[] {
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
        (log.actorName || log.user) ? (
          <div>
            <div className="font-semibold text-primary">{log.actorName || log.user?.name}</div>
            <div className="text-xs text-secondary">{log.actorEmail || log.user?.email}</div>
            <div className="text-xs">{log.actorRole} | {log.actorInstitutionName || "Platform"}</div>
          </div>
        ) : (
          <span className="italic text-muted font-medium">{log.actor || "SYSTEM"}</span>
        ),
    },
    {
      header: "Aktivitas",
      cell: (log) => (
        <div><Badge intent={getActionIntent(log.action)}>{log.action}</Badge><div className="text-xs mt-1">{log.module} | {log.status}</div></div>
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
      cell: (log) => (
          <details className="text-xs text-secondary font-mono cursor-pointer">
            <summary className="text-xs text-brand-primary font-semibold hover:underline outline-none">
              Lihat detail
            </summary>
            <pre className="mt-2 p-2 bg-surface-muted border border-border rounded-lg max-w-xs overflow-x-auto text-[10px] leading-tight select-all">
              {JSON.stringify({ actor: log.actor, userId: log.userId, name: log.actorName, email: log.actorEmail, role: log.actorRole, actorInstitutionId: log.actorInstitutionId, actorInstitution: log.actorInstitutionName, institutionId: log.institutionId, institution: log.institutionName, timestamp: log.createdAt, action: log.action, module: log.module, entityId: log.entityId, status: log.status, before: log.oldData, after: log.newData, changes: log.changes, transaction: log.transactionData, ip: log.ipAddress, device: log.userAgent, method: log.httpMethod, endpoint: log.endpoint, requestId: log.requestId, correlationId: log.correlationId, error: log.errorMessage }, null, 2)}
            </pre>
          </details>
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
