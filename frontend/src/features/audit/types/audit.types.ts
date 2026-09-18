/**
 * Audit log types — Phase 1 scaffold.
 *
 * These types define the shape of audit log entries.
 * The AuditService (added in service phase) uses these types to write to the DB.
 *
 * RULES (from docs/audit-log.md):
 * - Audit logs are IMMUTABLE — never update or delete them.
 * - All admin mutations MUST create an audit log.
 * - oldData / newData are stored as JSONB in PostgreSQL.
 */

// ─── Audit Action Enum ───────────────────────────────────────────────────────

export enum AuditAction {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  ROLE_CHANGE = "ROLE_CHANGE",
  PAYMENT_UPDATE = "PAYMENT_UPDATE",
  DISTRIBUTION_UPDATE = "DISTRIBUTION_UPDATE",
}

// ─── Input Type ──────────────────────────────────────────────────────────────

/**
 * Input shape for creating an audit log entry.
 * Passed to AuditService.create() — which writes to the `audit_logs` table.
 */
export interface CreateAuditLogInput {
  /** The user who performed the action. Null for system-initiated actions. */
  userId: string | null;

  /** What happened (e.g. CREATE, UPDATE, DELETE). */
  action: AuditAction | string;

  /** The entity type affected (e.g. "User", "Program", "Donation"). */
  entity: string;

  /** The primary key of the affected entity. */
  entityId?: string;

  /** Snapshot of the entity state BEFORE the mutation (JSONB). */
  oldData?: Record<string, unknown>;

  /** Snapshot of the entity state AFTER the mutation (JSONB). */
  newData?: Record<string, unknown>;

  /** IP address of the request origin. */
  ipAddress?: string;

  /** User agent string from the request headers. */
  userAgent?: string;
}

// ─── Output Type ─────────────────────────────────────────────────────────────

/**
 * Shape of an audit log record as returned from the DB.
 */
export interface AuditLogRecord extends CreateAuditLogInput {
  id: string;
  createdAt: string;
  actor: "USER" | "SUPER_ADMIN" | "SYSTEM" | "WEBHOOK";
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  actorInstitutionId?: string | null;
  actorInstitutionName?: string | null;
  institutionId?: string | null;
  institutionName?: string | null;
  module: string;
  status: "SUCCESS" | "FAILED";
  changes?: Record<string, { before: unknown; after: unknown }> | null;
  transactionData?: Record<string, unknown> | null;
  httpMethod?: string | null;
  endpoint?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  errorMessage?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
}
