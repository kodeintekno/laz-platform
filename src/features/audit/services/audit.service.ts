import { auditRepository } from "@/features/audit/repositories/audit.repository";
import { logger } from "@/lib/logger";
import type { CreateAuditLogInput } from "@/features/audit/types/audit.types";

/**
 * Audit Service — Phase 2.
 *
 * The single entry point for creating audit logs.
 * All services that mutate data call this after successful mutations.
 *
 * RULES:
 * - Never expose update or delete.
 * - Audit failures must NOT cause the parent transaction to fail.
 *   Always wrap in try/catch and log the error instead.
 */
export const auditService = {
  /**
   * Log an admin/system mutation.
   * Swallows errors so audit failures never break the main flow.
   */
  async log(input: CreateAuditLogInput): Promise<void> {
    try {
      await auditRepository.create(input);
    } catch (err) {
      // Audit failure is logged but never thrown — it must not break mutations
      logger.error({ err, input }, "Failed to write audit log");
    }
  },
};
