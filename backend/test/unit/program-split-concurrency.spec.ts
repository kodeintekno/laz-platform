import { describe, expect, it, vi } from "vitest";
import { ProgramsService } from "../../src/modules/programs/programs.service";
import { AmilService } from "../../src/modules/amil/amil.service";

const actor = { id: "staff", lembagaId: "tenant", permissions: [] } as any;
const input = {
  title: "Program", description: "Program description", targetAmount: 100000,
  category: "ZAKAT", status: "PENDING_REVIEW", institutionPercentage: 12.5,
  requestedPlatformPercentage: 0, platformChangeReason: "More funds for beneficiaries",
} as any;

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

// Model atomic conditional writes and pause a request after its initial read.
// No database, external service, or production data is used.
function setup() {
  let row: any = {
    id: "program", lembagaId: "tenant", createdById: "staff", title: "Program",
    category: "ZAKAT", status: "PENDING_REVIEW", imageUrl: null,
    amilPlatformPercentage: 5, amilInstitutionPercentage: 5, amilMaxTotalPercentage: 12.5,
    requestedAmilPlatformPercentage: null, amilPlatformChangeReason: null, amilLockedAt: null,
  };
  let review: any = { id: "review", status: "PENDING", institutionPercentage: 5 };
  const read = vi.fn(async () => ({ ...row }));
  const matches = (where: any) => Object.entries(where).every(([key, value]) => {
    const actual = row[key];
    return actual instanceof Date && value instanceof Date
      ? actual.getTime() === value.getTime() : actual === value;
  });
  const tx = {
    program: {
      update: vi.fn(async ({ data }: any) => { row = { ...row, ...data }; return { ...row }; }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        if (!matches(where)) return { count: 0 };
        row = { ...row, ...data };
        return { count: 1 };
      }),
      findUniqueOrThrow: read,
    },
    programReviewHistory: {
      findFirst: vi.fn(async () => review.status === "PENDING" ? { id: review.id } : null),
      update: vi.fn(async ({ data }: any) => { review = { ...review, ...data }; }),
      create: vi.fn(async ({ data }: any) => { review = { id: "review", status: "PENDING", ...data }; }),
      updateMany: vi.fn(async ({ data }: any) => { review = { ...review, ...data }; }),
    },
  };
  const prisma = {
    user: { findUnique: vi.fn(async () => ({ lembagaId: "tenant" })) },
    program: { findUnique: read },
    $transaction: vi.fn(async (run: any) => run(tx)),
  };
  const audit = { log: vi.fn() };
  const notifications = { notifyUser: vi.fn(), notifyRole: vi.fn() };
  const amil = Object.create(AmilService.prototype);
  const service = new ProgramsService({ findById: read } as any, audit as any, prisma as any, amil as any, notifications as any);
  const pauseNext = () => {
    const entered = deferred();
    const release = deferred();
    prisma.$transaction.mockImplementationOnce(async (run: any) => {
      entered.resolve();
      await release.promise;
      return run(tx);
    });
    return { entered: entered.promise, release: release.resolve };
  };
  return { service, tx, audit, notifications, pauseNext, row: () => row, review: () => review };
}

describe("program donation split concurrency", () => {
  it.each(["approve", "reject"] as const)("rejects stale %s after a pending edit without changing history or notifying", async (decision) => {
    const h = setup();
    const gate = h.pauseNext();
    const pending = decision === "approve"
      ? h.service.approveProgram("program", "reviewer")
      : h.service.rejectProgram("program", "Revise documents", "reviewer");
    const rejected = expect(pending).rejects.toMatchObject({ code: "PROGRAM_CHANGED", status: 409 });
    await gate.entered;
    await h.service.updateProgram("program", input, actor);
    const review = { ...h.review() };
    gate.release();
    await rejected;
    expect(h.row()).toMatchObject({ status: "PENDING_REVIEW", requestedAmilPlatformPercentage: 0, amilInstitutionPercentage: 12.5 });
    expect(h.review()).toEqual(review);
    expect(h.audit.log).toHaveBeenCalledTimes(1);
    expect(h.notifications.notifyUser).not.toHaveBeenCalled();
  });

  it.each(["approve", "reject"] as const)("rejects a stale edit after %s without overwriting the decision", async (decision) => {
    const h = setup();
    const gate = h.pauseNext();
    const pending = h.service.updateProgram("program", input, actor);
    const rejected = expect(pending).rejects.toMatchObject({ code: "PROGRAM_CHANGED", status: 409 });
    await gate.entered;
    if (decision === "approve") await h.service.approveProgram("program", "reviewer");
    else await h.service.rejectProgram("program", "Revise documents", "reviewer");
    const row = { ...h.row() };
    const review = { ...h.review() };
    gate.release();
    await rejected;
    expect(h.row()).toEqual(row);
    expect(h.review()).toEqual(review);
    expect(h.audit.log).toHaveBeenCalledTimes(1);
  });

  it("approves a fresh edited proposal as one valid split and preserves the proposal in history", async () => {
    const h = setup();
    await h.service.updateProgram("program", input, actor);
    await h.service.approveProgram("program", "reviewer");
    expect(h.row()).toMatchObject({ status: "PUBLISHED", amilPlatformPercentage: 0,
      amilInstitutionPercentage: 12.5, requestedAmilPlatformPercentage: null, amilPlatformChangeReason: null,
      amilLockedAt: expect.any(Date) });
    expect(h.review()).toMatchObject({ status: "APPROVED", requestedPlatformPercentage: 0,
      institutionPercentage: 12.5, platformChangeReason: input.platformChangeReason });
    await expect(h.service.updateProgram("program", input, actor)).resolves.toBeDefined();
    await expect(h.service.updateProgram("program", { ...input, institutionPercentage: 10 }, actor))
      .rejects.toMatchObject({ code: "PROGRAM_AMIL_LOCKED" });
  });

  it("keeps an approved split locked after resubmission and rejection", async () => {
    const h = setup();
    await h.service.approveProgram("program", "reviewer");
    const lock = h.row().amilLockedAt;
    await h.service.updateProgram("program", { ...input, institutionPercentage: 5, requestedPlatformPercentage: 5 }, actor);
    await h.service.rejectProgram("program", "Revise documents", "reviewer");
    expect(h.row().amilLockedAt).toEqual(lock);
    await expect(h.service.updateProgram("program", input, actor))
      .rejects.toMatchObject({ code: "PROGRAM_AMIL_LOCKED" });
  });
});
