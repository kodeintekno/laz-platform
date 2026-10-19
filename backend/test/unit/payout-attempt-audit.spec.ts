import { describe, expect, it, vi } from "vitest";
import { WithdrawalsService } from "../../src/modules/withdrawals/withdrawals.service";
import { AppError } from "../../src/common/errors/app.error";
import { auditContext, contextData } from "../../src/modules/audit/audit-context";

function setup(platform = false) {
  const withdrawal = {
    id: "withdrawal-1", status: "APPROVED", approvedById: "approver", amount: 100000,
    lembagaId: platform ? null : "tenant", isPlatform: platform,
    bankCode: "ID_BCA", accountNumber: "1234567890", accountHolder: "Private holder",
  };
  const payout = { id: "payout-1", status: "REQUESTED", idempotencyKey: "stable-private-key", referenceId: "payout-withdrawal-1" };
  const rows: any[] = [];
  const contexts: any[] = [];
  const prisma: any = {
    withdrawal: { findUnique: vi.fn(async () => ({ ...withdrawal, payout })) },
    auditLog: { create: vi.fn(async ({ data }: any) => {
      const row = structuredClone(data);
      rows.push(row);
      contexts.push(contextData());
      return row;
    }) },
  };
  const repository: any = {
    approveWithdrawal: vi.fn(async () => withdrawal),
    createPayoutRecord: vi.fn(async () => payout),
    updatePayoutStatus: vi.fn(),
  };
  const gateway = { createPayout: vi.fn(async () => ({ payoutId: "gateway-1", status: "ACCEPTED" })) };
  const service = new WithdrawalsService(prisma, repository, gateway as any);
  return { withdrawal, payout, rows, contexts, prisma, repository, gateway, service };
}

const outcomes = (ctx: ReturnType<typeof setup>) => ctx.rows.filter((row) => row.action === "PAYOUT_ATTEMPT_OUTCOME");
const failure = () => new AppError("PAYOUT_GATEWAY_ERROR", "provider-secret and private bank data", 502);

describe("payout attempt audit (ACCT-002)", () => {
  it("persists a failed background outcome after approval returns, retaining initiating request context", async () => {
    const ctx = setup();
    let reject!: (error: unknown) => void;
    ctx.gateway.createPayout.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    const request: any = { session: { userId: "initiator" }, path: "/api/withdrawals/withdrawal-1/approve", method: "POST", ip: "127.0.0.1", get: () => "test-client" };
    await auditContext.run({ request, requestId: "approval-request" }, async () => {
      await expect(ctx.service.approveWithdrawal("withdrawal-1", "initiator")).resolves.toBe(ctx.withdrawal);
      await vi.waitFor(() => expect(ctx.gateway.createPayout).toHaveBeenCalledOnce());
      expect(outcomes(ctx)).toHaveLength(0);
      reject(failure());
      await vi.waitFor(() => expect(outcomes(ctx)).toHaveLength(1));
    });
    expect(outcomes(ctx)[0]).toMatchObject({
      userId: "initiator", lembagaId: "tenant", entity: "Withdrawal", entityId: "withdrawal-1",
      status: "FAILED", errorMessage: "PAYOUT_GATEWAY_ERROR", correlationId: "withdrawal:withdrawal-1",
      transactionData: { provider: "XENDIT", withdrawalId: "withdrawal-1", payoutId: "payout-1", amount: 100000, referenceId: "payout-withdrawal-1", processingResult: "UNKNOWN", phase: "GATEWAY" },
    });
    expect(ctx.contexts.at(-1)).toMatchObject({ requestId: "approval-request", userId: "initiator", ipAddress: "127.0.0.1" });
    expect(ctx.repository.updatePayoutStatus).not.toHaveBeenCalled();
    expect(ctx.withdrawal.status).toBe("APPROVED");
    expect(ctx.payout.status).toBe("REQUESTED");
  });

  it("appends distinct retry attempts while preserving the same payout and idempotency identity", async () => {
    const ctx = setup();
    const error = failure();
    ctx.gateway.createPayout.mockRejectedValue(error);
    for (let i = 0; i < 2; i++) await expect(ctx.service.retryPayout("withdrawal-1")).rejects.toBe(error);
    const records = outcomes(ctx);
    expect(records).toHaveLength(2);
    expect(new Set(records.map((row) => row.transactionData.attemptId)).size).toBe(2);
    expect(records[0].transactionData.idempotencyKeyHash).toMatch(/^[a-f0-9]{64}$/);
    expect(records[0].transactionData.idempotencyKeyHash).toBe(records[1].transactionData.idempotencyKeyHash);
    expect(records.every((row) => row.transactionData.payoutId === "payout-1")).toBe(true);
    for (const [params] of ctx.gateway.createPayout.mock.calls) expect(params).toMatchObject({ idempotencyKey: "stable-private-key" });
    expect(ctx.repository.updatePayoutStatus).not.toHaveBeenCalled();
  });

  it("records platform failures without assigning a Lembaga or storing provider secrets", async () => {
    const ctx = setup(true);
    ctx.gateway.createPayout.mockRejectedValue(Object.assign(new Error("provider-secret"), { headers: { authorization: "provider-secret" }, response: { accountNumber: "1234567890" } }));
    await expect(ctx.service.processApprovedWithdrawal(ctx.withdrawal)).rejects.toThrow("provider-secret");
    expect(outcomes(ctx)[0]).toMatchObject({ lembagaId: null, status: "FAILED", errorMessage: "PAYOUT_PROCESSING_ERROR" });
    const output = JSON.stringify(ctx.rows);
    for (const secret of ["provider-secret", "1234567890", "Private holder", "stable-private-key"]) expect(output).not.toContain(secret);
  });

  it.each(["FAILED", "CANCELLED", "REVERSED"])("records %s acknowledgement as rejected without terminal financial state", async (status) => {
    const ctx = setup();
    ctx.gateway.createPayout.mockResolvedValue({ payoutId: "gateway-1", status });
    await ctx.service.processApprovedWithdrawal(ctx.withdrawal);
    expect(outcomes(ctx)[0]).toMatchObject({ status: "FAILED", transactionData: { processingResult: "REJECTED_ACKNOWLEDGEMENT", gatewayStatus: status } });
    expect(ctx.repository.updatePayoutStatus).toHaveBeenCalledWith("withdrawal-1", "gateway-1", "REQUESTED", undefined);
  });

  it("bounds unexpected provider status text in the audit without changing acknowledgement handling", async () => {
    const ctx = setup();
    ctx.gateway.createPayout.mockResolvedValue({ payoutId: "gateway-1", status: "provider-secret" });
    await ctx.service.processApprovedWithdrawal(ctx.withdrawal);
    expect(outcomes(ctx)[0]).toMatchObject({ transactionData: { gatewayStatus: "UNRECOGNIZED" } });
    expect(JSON.stringify(ctx.rows)).not.toContain("provider-secret");
    expect(ctx.repository.updatePayoutStatus).toHaveBeenCalledWith("withdrawal-1", "gateway-1", "PROCESSING", "PROCESSING");
  });

  it.each(["ACCEPTED", "SUCCEEDED"])("preserves %s acknowledgement as PROCESSING, never final payment proof", async (status) => {
    const ctx = setup();
    ctx.gateway.createPayout.mockResolvedValue({ payoutId: "gateway-1", status });
    await ctx.service.processApprovedWithdrawal(ctx.withdrawal);
    expect(ctx.rows[0]).toMatchObject({ action: "PAYOUT_ATTEMPT_STARTED", status: "PENDING" });
    expect(outcomes(ctx)[0]).toMatchObject({ status: "SUCCESS", transactionData: { processingResult: "ACKNOWLEDGED", gatewayStatus: status } });
    expect(ctx.rows[0].transactionData.attemptId).toBe(outcomes(ctx)[0].transactionData.attemptId);
    expect(ctx.repository.updatePayoutStatus).toHaveBeenCalledWith("withdrawal-1", "gateway-1", "PROCESSING", "PROCESSING");
    expect(ctx.prisma.auditLog.create.mock.invocationCallOrder[0]).toBeLessThan(ctx.gateway.createPayout.mock.invocationCallOrder[0]);
  });

  it("records record-creation failure as not sent", async () => {
    const ctx = setup();
    const error = new Error("private database error");
    ctx.repository.createPayoutRecord.mockRejectedValue(error);
    await expect(ctx.service.processApprovedWithdrawal(ctx.withdrawal)).rejects.toBe(error);
    expect(outcomes(ctx)[0]).toMatchObject({ status: "FAILED", transactionData: { phase: "PREPARE", processingResult: "NOT_SENT" } });
    expect(ctx.gateway.createPayout).not.toHaveBeenCalled();
  });

  it("records unknown internal state when acknowledgement persistence fails", async () => {
    const ctx = setup();
    const error = new Error("private database error");
    ctx.repository.updatePayoutStatus.mockRejectedValue(error);
    await expect(ctx.service.processApprovedWithdrawal(ctx.withdrawal)).rejects.toBe(error);
    expect(outcomes(ctx)[0]).toMatchObject({ status: "FAILED", transactionData: { phase: "ACKNOWLEDGEMENT", processingResult: "UNKNOWN", gatewayStatus: "ACCEPTED", xenditPayoutId: "gateway-1" } });
  });

  it("does not dispatch a payout when the required attempt audit cannot persist", async () => {
    const ctx = setup();
    const error = new Error("audit unavailable");
    ctx.prisma.auditLog.create.mockRejectedValue(error);
    await expect(ctx.service.processApprovedWithdrawal(ctx.withdrawal)).rejects.toBe(error);
    expect(ctx.gateway.createPayout).not.toHaveBeenCalled();
    expect(ctx.repository.updatePayoutStatus).not.toHaveBeenCalled();
  });

  it("propagates an outcome write failure without reissuing the gateway request", async () => {
    const ctx = setup();
    const error = new Error("audit unavailable");
    ctx.prisma.auditLog.create.mockResolvedValueOnce({}).mockRejectedValueOnce(error);
    await expect(ctx.service.processApprovedWithdrawal(ctx.withdrawal)).rejects.toBe(error);
    expect(ctx.gateway.createPayout).toHaveBeenCalledOnce();
    expect(ctx.prisma.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it("records a skipped in-progress payout without dispatching it", async () => {
    const ctx = setup();
    ctx.payout.status = "PROCESSING";
    await ctx.service.processApprovedWithdrawal(ctx.withdrawal);
    expect(outcomes(ctx)[0]).toMatchObject({ status: "SUCCESS", transactionData: { processingResult: "SKIPPED" } });
    expect(ctx.gateway.createPayout).not.toHaveBeenCalled();
  });

  it("retains invalid-state rejection without starting a payout", async () => {
    const ctx = setup();
    ctx.withdrawal.status = "PENDING";
    await expect(ctx.service.processApprovedWithdrawal(ctx.withdrawal)).rejects.toMatchObject({ code: "INVALID_STATE" });
    expect(ctx.prisma.auditLog.create).not.toHaveBeenCalled();
    expect(ctx.gateway.createPayout).not.toHaveBeenCalled();
  });
});
