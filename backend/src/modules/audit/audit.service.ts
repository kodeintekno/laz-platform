import { Injectable, Logger } from "@nestjs/common";
import { AuditRepository } from "./audit.repository";
import type { CreateAuditLogInput } from "./audit.types";

/**
 * Audit Service — single entry point for creating audit logs.
 * All services that mutate data call this after successful mutations.
 *
 * RULES:
 * - Never expose update or delete.
 * - Audit failures must NOT cause the parent transaction to fail.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  /**
   * Log an admin/system mutation.
   * Swallows errors so audit failures never break the main flow.
   */
  async log(input: CreateAuditLogInput): Promise<void> {
    try {
      await this.auditRepository.create(input);
    } catch (err) {
      this.logger.error({ err, input }, "Failed to write audit log");
    }
  }

  /**
   * Retrieve paged and searchable audit logs.
   */
  async getLogs(
    page: number = 1,
    limit: number = 10,
    search?: string,
    lembagaId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.auditRepository.getAuditLogs(page, limit, search, lembagaId, startDate, endDate);
  }
}
