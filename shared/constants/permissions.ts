/**
 * Centralized permission constants.
 *
 * All permission strings used in RBAC checks MUST be defined here.
 * Never use raw strings for permission checks — always import from this file.
 *
 * Convention: "<resource>.<action>"
 */

export const PERMISSIONS = {
  // ── User Management ──────────────────────────────────────────────
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_MANAGE_ROLES: "users.manage_roles",

  // ── Program Management ───────────────────────────────────────────
  PROGRAMS_READ: "programs.read",
  PROGRAMS_CREATE: "programs.create",
  PROGRAMS_UPDATE: "programs.update",
  PROGRAMS_DELETE: "programs.delete",
  PROGRAMS_PUBLISH: "programs.publish",
  PROGRAMS_APPROVE: "programs.approve",

  // ── Donation Management ──────────────────────────────────────────
  DONATIONS_READ: "donations.read",
  DONATIONS_CREATE: "donations.create",

  // ── Payment Management ───────────────────────────────────────────
  PAYMENTS_READ: "payments.read",
  PAYMENTS_MANAGE: "payments.manage",

  // ── Distribution Management ──────────────────────────────────────
  DISTRIBUTIONS_READ: "distributions.read",
  DISTRIBUTIONS_MANAGE: "distributions.manage",
  DISTRIBUTIONS_UPLOAD: "distributions.upload",

  // ── Audit Logs ───────────────────────────────────────────────────
  AUDIT_READ: "audit.read",

  // ── Reports ──────────────────────────────────────────────────────
  REPORTS_READ: "reports.read",
  REPORTS_FINANCIAL: "reports.financial",

  // ── RBAC Management ──────────────────────────────────────────────
  ROLES_READ: "roles.read",
  ROLES_MANAGE: "roles.manage",
  PERMISSIONS_MANAGE: "permissions.manage",

  // ── System Settings ──────────────────────────────────────────────
  SETTINGS_MANAGE: "settings.manage",

  // ── Lembaga Management ───────────────────────────────────────────
  LEMBAGA_READ: "lembaga.read",
  LEMBAGA_APPROVE: "lembaga.approve",
  LEMBAGA_MANAGE: "lembaga.manage",

  // ── Volunteer Management ─────────────────────────────────────────
  VOLUNTEERS_MANAGE: "volunteers.manage",

  // ── Withdrawal Management ──────────────────────────────────────────
  WITHDRAWALS_READ: "withdrawals.read",
  WITHDRAWALS_CREATE: "withdrawals.create",
  WITHDRAWALS_MANAGE: "withdrawals.manage",

  // ── Accounting (COA) ─────────────────────────────────────────────────
  COA_READ: "coa.read",

  // ── Journal ────────────────────────────────────────────────────────
  JOURNAL_READ: "journal.read",
  JOURNAL_CREATE: "journal.create",
  JOURNAL_POST: "journal.post",
  JOURNAL_VOID: "journal.void",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
