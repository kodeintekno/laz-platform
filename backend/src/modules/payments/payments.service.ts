import { Injectable } from "@nestjs/common";
import { PaymentsRepository } from "./payments.repository";

/**
 * Payments Service — orchestrates payments business logic and data querying.
 */
@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  /**
   * Fetch paginated and searchable payments list.
   */
  async getPayments(page: number = 1, limit: number = 10, search?: string, lembagaId?: string) {
    return this.paymentsRepository.findManyPaged(page, limit, search, lembagaId);
  }
}
