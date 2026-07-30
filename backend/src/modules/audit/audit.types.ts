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
  LEMBAGA_APPROVE = "LEMBAGA_APPROVE",
  LEMBAGA_REJECT = "LEMBAGA_REJECT",
  PROGRAM_APPROVE = "PROGRAM_APPROVE",
  PROGRAM_REJECT = "PROGRAM_REJECT",
  VOLUNTEER_APPLICATION_REVIEW = "VOLUNTEER_APPLICATION_REVIEW",
  VOLUNTEER_REPORT_SUBMIT = "VOLUNTEER_REPORT_SUBMIT",
  VOLUNTEER_REPORT_VERIFY = "VOLUNTEER_REPORT_VERIFY",
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
  lembagaId?: string;
}
