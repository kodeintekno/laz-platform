import { paymentsRepository } from "../repositories/payments.repository";

/**
 * Payments Service.
 * Orchestrates payments business logic and data querying.
 */
export const paymentsService = {
  /**
   * Fetch paginated and searchable payments list.
   */
  async getPayments(page: number = 1, limit: number = 10, search?: string, lazId?: string) {
    return paymentsRepository.findManyPaged(page, limit, search, lazId);
  },
};
