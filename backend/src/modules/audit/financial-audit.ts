import type { Prisma } from "@prisma/client";

/** Explicit financial linkage shared by balance, journal and state-change events. */
export async function setFinancialAuditContext(tx: Prisma.TransactionClient, data: {
  paymentId?: string; donationId?: string; withdrawalId?: string; payoutId?: string;
  gatewayReference?: string; amount?: number;
}) {
  const correlation = data.donationId ? `donation:${data.donationId}` : `withdrawal:${data.withdrawalId}`;
  await tx.$executeRaw`SELECT set_config('app.audit_financial', ${JSON.stringify(data)}, true), set_config('app.audit_correlation', ${correlation}, true)`;
}
