import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { auditContext } from "../../src/modules/audit/audit-context";
import { PaymentsRepository } from "../../src/modules/payments/payments.repository";
import { WithdrawalsRepository } from "../../src/modules/withdrawals/withdrawals.repository";
import type { AutoJournalService } from "../../src/modules/journal/auto-journal.service";
import type { AmilService } from "../../src/modules/amil/amil.service";

describe.skipIf(!process.env.TEST_DATABASE_URL)("Financial audit context (PostgreSQL)", () => {
  it("links payment, donation, balances and journal; links withdrawal reservation to approval and payout", async () => {
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    const prisma = new PrismaService();
    process.env.NODE_ENV = previousNodeEnv;
    const requestId = randomUUID();
    const request = { path: "/api/webhooks/xendit/payment", method: "POST", ip: "127.0.0.1", get: () => "integration-test" } as unknown as Request;
    const rollback = new Error("rollback fixtures");
    try {
      const batchId = randomUUID();
      await expect(prisma.$transaction([
        prisma.auditLog.create({ data: { id: batchId, action: "BATCH_TEST", entity: "Test" } }),
        prisma.auditLog.create({ data: { id: batchId, action: "BATCH_TEST", entity: "Test" } }),
      ])).rejects.toMatchObject({ code: "P2002" });
      expect(await prisma.auditLog.count({ where: { id: batchId } })).toBe(0);
      await expect(prisma.user.update({ where: { id: randomUUID() }, data: { name: "no mutation" } })).rejects.toMatchObject({ code: "P2025" });
      await expect(auditContext.run({ request, requestId }, () => prisma.$transaction(async (tx) => {
        const institution = await tx.lembaga.create({ data: { name: "Audit flow", slug: randomUUID() } });
        const role = await tx.role.create({ data: { name: randomUUID() } });
        const user = await tx.user.create({ data: { roleId: role.id, email: `${randomUUID()}@audit.test`, lembagaId: institution.id } });
        const program = await tx.program.create({ data: { lembagaId: institution.id, createdById: user.id, title: "Audit flow", slug: randomUUID(), description: "Audit test", targetAmount: 1000000, category: "INFAK_SEDEKAH", amilPlatformPercentage: 5, amilInstitutionPercentage: 5, amilMaxTotalPercentage: 20 } });
        const book = await tx.accountingBook.create({ data: { name: "Audit book", ownerType: "LEMBAGA", lembagaId: institution.id } });
        const donation = await tx.donation.create({ data: { lembagaId: institution.id, programId: program.id, amount: 100000 } });
        const payment = await tx.payment.create({ data: { donationId: donation.id, lembagaId: institution.id, amount: 100000 } });
        const scoped = { ...tx, $transaction: (work: any) => work(tx) } as PrismaService;
        const journalService = {
          createDonationJournal: async () => tx.journal.create({ data: { accountingBookId: book.id, lembagaId: institution.id, journalNo: randomUUID(), journalDate: new Date(), description: "Donation audit", sourceId: donation.id, sourceType: "DONATION", status: "POSTED" } }),
          createWithdrawalCompletionJournal: vi.fn(),
        } as unknown as AutoJournalService;
        const payments = new PaymentsRepository(scoped, journalService, { calculateSplitFromProgramSnapshot: () => ({ platformPercentage: 5, institutionPercentage: 5, amilPlatformAmount: 5000, amilInstitutionAmount: 5000, netAmount: 90000 }) } as unknown as AmilService);
        const outcome = { paymentId: payment.id, donationId: donation.id, programId: program.id, amount: 100000, newPaymentStatus: "SUCCESS" as const, newDonationStatus: "PAID" as const, xenditPaymentId: "gateway-payment-test" };
        await payments.updatePaymentAndDonationStatus(outcome);
        const flow = await tx.auditLog.findMany({ where: { requestId, correlationId: `donation:${donation.id}` } });
        expect(flow.map(log => log.action)).toEqual(expect.arrayContaining(["PAYMENT_CREATED", "DONATION_CREATED", "PAYMENT_PAID", "DONATION_PAID", "BALANCE_CHANGED", "JOURNAL_CREATED", "DONATION_STATUS_CHANGED", "PLATFORM_FEE_RECORDED", "AMIL_FUNDS_ALLOCATED", "PROGRAM_FUNDS_ALLOCATED"]));
        const balance = flow.find(log => log.entity === "InstitutionBalance")!;
        expect(balance.transactionData).toMatchObject({ donationId: donation.id, paymentId: payment.id, balanceAfter: 95000, gatewayReference: "gateway-payment-test" });
        expect(balance.actor).toBe("WEBHOOK");
        const count = flow.length;
        expect(await payments.updatePaymentAndDonationStatus(outcome)).toMatchObject({ success: false });
        expect(await tx.auditLog.count({ where: { requestId, correlationId: `donation:${donation.id}` } })).toBe(count);
        const coa = await tx.chartOfAccount.create({ data: { accountingBookId: book.id, lembagaId: institution.id, code: "110301", key: "AUDIT_BANK", name: "Bank test", accountType: "ASSET", normalBalance: "DEBIT" } });
        const bank = await tx.lembagaBankAccount.create({ data: { chartOfAccountId: coa.id, lembagaId: institution.id, bankCode: "ID_BCA", accountNumber: "1234567890", accountHolder: "Audit" } });
        const withdrawals = new WithdrawalsRepository(scoped, journalService);
        const withdrawal = await withdrawals.createWithdrawal(institution.id, program.id, 20000, user.id, bank.id, "ID_BCA", "1234567890", "Audit");
        await withdrawals.approveWithdrawal(withdrawal.id, user.id);
        const payout = await withdrawals.createPayoutRecord(withdrawal, randomUUID(), `payout-${withdrawal.id}`);
        await withdrawals.updatePayoutStatus(withdrawal.id, "gateway-payout-test", "PROCESSING", "PROCESSING");
        await withdrawals.updatePayoutStatusAndFinalize(payout.id, withdrawal.id, institution.id, false, null, 20000, "SUCCEEDED", "COMPLETED");
        const withdrawalFlow = await tx.auditLog.findMany({ where: { requestId, correlationId: `withdrawal:${withdrawal.id}` } });
        expect(withdrawalFlow.map(log => log.action)).toEqual(expect.arrayContaining(["WITHDRAWAL_CREATED", "WITHDRAWAL_APPROVED", "WITHDRAWAL_PROCESSING", "WITHDRAWAL_PAID", "PAYOUT_CREATED", "PAYOUT_PAID", "BALANCE_CHANGED"]));
        const reserved = withdrawalFlow.find(log => log.entity === "InstitutionBalance" && (log.changes as any).balance)!;
        expect(reserved.transactionData).toMatchObject({ withdrawalId: withdrawal.id, balanceBefore: 95000, balanceAfter: 75000, balanceDelta: { balance: -20000 } });
        expect(JSON.stringify(withdrawalFlow)).not.toContain("1234567890");
        throw rollback;
      }, { timeout: 20000 }))).rejects.toBe(rollback);
      expect(await prisma.auditLog.count({ where: { requestId } })).toBe(0);
    } finally {
      await prisma.$disconnect();
      process.env.DATABASE_URL = originalUrl;
    }
  }, 30000);
});
