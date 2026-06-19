/**
 * Audit log types.
 *
 * RULES:
 * - Audit logs are IMMUTABLE — never update or delete them.
 * - All admin mutations MUST create an audit log.
 * - oldData / newData are stored as JSONB in PostgreSQL.
 */

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

export interface CreateAuditLogInput {
  /** The user who performed the action. Null for system-initiated actions. */
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  lazId?: string;
}
