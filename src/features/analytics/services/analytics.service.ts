import { analyticsRepository } from "../repositories/analytics.repository";

export const analyticsService = {
  async getDashboardOverview() {
    const [metrics, recentDonations, recentDistributions] = await Promise.all([
      analyticsRepository.getDashboardMetrics(),
      analyticsRepository.getRecentDonations(),
      analyticsRepository.getRecentDistributions(),
    ]);

    return {
      metrics,
      recentDonations,
      recentDistributions,
    };
  },
};
