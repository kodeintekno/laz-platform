import { describe, expect, it, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { Prisma, ProgramCategory } from "@prisma/client";
import { AmilService } from "../../src/modules/amil/amil.service";

const category = ProgramCategory.ZAKAT;
const institution = "lembaga-1";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

// Model transaction-scoped advisory locks, with controllable read barriers.
// Actual service methods execute; no database or external service is accessed.
function setup(existing = true) {
  const globals = new Map(Object.values(ProgramCategory).map((key) => [key, {
    category: key, maxTotalPercentage: 20, defaultPlatformPercentage: 1,
  }]));
  const settings = new Map<string, any>();
  const key = (lembagaId: string, value: string) => `${lembagaId}:${value}`;
  if (existing) settings.set(key(institution, category), {
    lembagaId: institution, category, institutionPercentage: 10, platformPercentage: 1,
  });
  let request: any = {
    id: "request", lembagaId: institution, category, status: "PENDING",
    institutionPercentage: 10, requestedPlatformPercentage: 5,
  };
  const locks = new Map<string, Promise<void>>();
  let barrier: { kind: "institution" | "global-list"; entered: ReturnType<typeof deferred>; resume: ReturnType<typeof deferred> } | undefined;
  const pause = (kind: "institution" | "global-list") => {
    const entry = { kind, entered: deferred(), resume: deferred() };
    barrier = entry;
    return entry;
  };
  const waitAt = async (kind: "institution" | "global-list") => {
    if (barrier?.kind !== kind) return;
    const active = barrier;
    barrier = undefined;
    active.entered.resolve();
    await active.resume.promise;
  };
  const delegates = {
    amilGlobalSetting: {
      findUnique: vi.fn(async ({ where }: any) => {
        const row = globals.get(where.category);
        return row ? { ...row } : null;
      }),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const row = globals.has(where.category) ? { ...globals.get(where.category)!, ...update } : { ...create };
        globals.set(where.category, row);
        return { ...row };
      }),
    },
    amilInstitutionSetting: {
      findUnique: vi.fn(async ({ where }: any) => {
        const scope = where.lembagaId_category;
        const row = settings.get(key(scope.lembagaId, scope.category));
        const copy = row ? { ...row } : null;
        await waitAt("institution");
        return copy;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        const rows = [...settings.values()].filter((row) => row.category === where.category).map((row) => ({ ...row }));
        await waitAt("global-list");
        return rows;
      }),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const scope = where.lembagaId_category;
        const rowKey = key(scope.lembagaId, scope.category);
        const row = settings.has(rowKey) ? { ...settings.get(rowKey), ...update } : { ...create };
        settings.set(rowKey, row);
        return { ...row };
      }),
    },
    amilPlatformChangeRequest: {
      findUnique: vi.fn(async () => ({ ...request })),
      updateMany: vi.fn(async ({ where, data }: any) => {
        if (request.status !== where.status) return { count: 0 };
        request = { ...request, ...data };
        return { count: 1 };
      }),
    },
  };
  const prisma = {
    ...delegates,
    $transaction: vi.fn(async (work: any) => {
      const releases: Array<() => void> = [];
      const tx = {
        ...delegates,
        $executeRaw: vi.fn(async (sql: Prisma.Sql) => {
          expect(sql.sql).toContain("pg_advisory_xact_lock");
          const lockKey = String(sql.values[0]);
          const previous = locks.get(lockKey) ?? Promise.resolve();
          const done = deferred();
          locks.set(lockKey, previous.then(() => done.promise));
          await previous;
          releases.push(done.resolve);
          return 1;
        }),
      };
      try { return await work(tx); }
      finally { releases.reverse().forEach((release) => release()); }
    }),
  };
  const service = new AmilService(prisma as any, { log: vi.fn() } as any);
  const state = () => ({ ...settings.get(key(institution, category)) });
  return { service, prisma, pause, state, globals, request: () => ({ ...request }) };
}

const settleQueue = () => new Promise<void>((resolve) => setImmediate(resolve));
const outcome = (promise: Promise<unknown>) => promise.then((value) => ({ value, error: undefined }), (error) => ({ value: undefined, error }));

describe("Amil settings writer concurrency (BAL-002)", () => {
  it.each([true, false])("does not restore stale platform share after a privileged write (existing row: %s)", async (existing) => {
    const ctx = setup(existing);
    const gate = ctx.pause("institution");
    const tenant = ctx.service.updateInstitutionSetting(institution, category, 19);
    await gate.entered.promise;
    const admin = ctx.service.updateInstitutionSetting(institution, category, 10, 5);
    await settleQueue();
    gate.resume.resolve();
    await Promise.all([tenant, admin]);
    expect(ctx.state()).toMatchObject({ platformPercentage: 5, institutionPercentage: 10 });
  });

  it("validates a waiting tenant against the newly committed platform share", async () => {
    const ctx = setup();
    const gate = ctx.pause("institution");
    const admin = ctx.service.updateInstitutionSetting(institution, category, 10, 5);
    await gate.entered.promise;
    const tenant = outcome(ctx.service.updateInstitutionSetting(institution, category, 19));
    await settleQueue();
    gate.resume.resolve();
    await admin;
    expect((await tenant).error).toBeInstanceOf(BadRequestException);
    expect(ctx.state()).toMatchObject({ platformPercentage: 5, institutionPercentage: 10 });
  });

  it("coordinates platform-change approval with a waiting tenant update", async () => {
    const ctx = setup();
    const gate = ctx.pause("institution");
    const approval = ctx.service.approvePlatformChangeRequest("request", "reviewer");
    await gate.entered.promise;
    const tenant = outcome(ctx.service.updateInstitutionSetting(institution, category, 19));
    await settleQueue();
    gate.resume.resolve();
    await approval;
    expect((await tenant).error).toBeInstanceOf(BadRequestException);
    expect(ctx.state()).toMatchObject({ platformPercentage: 5, institutionPercentage: 10 });
    expect(ctx.request().status).toBe("APPROVED");
  });

  it("revalidates approval after a tenant consumes the remaining allocation", async () => {
    const ctx = setup();
    const gate = ctx.pause("institution");
    const tenant = ctx.service.updateInstitutionSetting(institution, category, 19);
    await gate.entered.promise;
    const approval = outcome(ctx.service.approvePlatformChangeRequest("request", "reviewer"));
    await settleQueue();
    gate.resume.resolve();
    await tenant;
    expect((await approval).error).toBeInstanceOf(BadRequestException);
    expect(ctx.state()).toMatchObject({ platformPercentage: 1, institutionPercentage: 19 });
    expect(ctx.request().status).toBe("PENDING");
  });

  it("validates a waiting tenant against a newly lowered global maximum", async () => {
    const ctx = setup();
    const gate = ctx.pause("global-list");
    const global = ctx.service.updateGlobalSetting(category, 15, 1);
    await gate.entered.promise;
    const tenant = outcome(ctx.service.updateInstitutionSetting(institution, category, 18));
    await settleQueue();
    gate.resume.resolve();
    await global;
    expect((await tenant).error).toBeInstanceOf(BadRequestException);
    expect(ctx.state()).toMatchObject({ platformPercentage: 1, institutionPercentage: 10 });
    expect(ctx.globals.get(category)!.maxTotalPercentage).toBe(15);
  });

  it("rejects lowering the maximum below a tenant update that committed first", async () => {
    const ctx = setup();
    const gate = ctx.pause("institution");
    const tenant = ctx.service.updateInstitutionSetting(institution, category, 18);
    await gate.entered.promise;
    const global = outcome(ctx.service.updateGlobalSetting(category, 15, 1));
    await settleQueue();
    gate.resume.resolve();
    await tenant;
    expect((await global).error).toBeInstanceOf(BadRequestException);
    expect(ctx.globals.get(category)!.maxTotalPercentage).toBe(20);
  });

  it("validates approval against a newly lowered global maximum", async () => {
    const ctx = setup();
    const gate = ctx.pause("global-list");
    const global = ctx.service.updateGlobalSetting(category, 12, 1);
    await gate.entered.promise;
    const approval = outcome(ctx.service.approvePlatformChangeRequest("request", "reviewer"));
    await settleQueue();
    gate.resume.resolve();
    await global;
    expect((await approval).error).toBeInstanceOf(BadRequestException);
    expect(ctx.state()).toMatchObject({ platformPercentage: 1, institutionPercentage: 10 });
    expect(ctx.request().status).toBe("PENDING");
  });

  it("omits platformPercentage from existing-row tenant updates", async () => {
    const ctx = setup();
    await ctx.service.updateInstitutionSetting(institution, category, 12.25);
    expect(ctx.prisma.amilInstitutionSetting.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: { institutionPercentage: 12.25 },
    }));
    expect(ctx.state()).toMatchObject({ platformPercentage: 1, institutionPercentage: 12.25 });
  });

  it("preserves first-setting defaults and explicit privileged overrides", async () => {
    const ctx = setup(false);
    await ctx.service.updateInstitutionSetting(institution, category, 12.25);
    expect(ctx.state()).toMatchObject({ platformPercentage: 1, institutionPercentage: 12.25 });
    await ctx.service.updateInstitutionSetting(institution, category, 10, 5.25);
    expect(ctx.state()).toMatchObject({ platformPercentage: 5.25, institutionPercentage: 10 });
    await ctx.service.updateInstitutionSetting(institution, category, 20, 0);
    expect(ctx.state()).toMatchObject({ platformPercentage: 0, institutionPercentage: 20 });
  });

  it("can initialize a missing global setting and then create institutional settings", async () => {
    const ctx = setup(false);
    ctx.globals.delete(category);
    await ctx.service.updateGlobalSetting(category, 20, 5);
    await ctx.service.updateInstitutionSetting(institution, category, 10);
    expect(ctx.state()).toMatchObject({ platformPercentage: 5, institutionPercentage: 10 });
  });

  it("still claims a platform change only once under concurrent approval", async () => {
    const ctx = setup();
    const results = await Promise.all([
      outcome(ctx.service.approvePlatformChangeRequest("request", "reviewer-1")),
      outcome(ctx.service.approvePlatformChangeRequest("request", "reviewer-2")),
    ]);
    expect(results.filter((result) => !result.error)).toHaveLength(1);
    expect(results.filter((result) => result.error?.code === "AMIL_REQUEST_ALREADY_REVIEWED")).toHaveLength(1);
    expect(ctx.request().status).toBe("APPROVED");
  });

  it("uses current post-lock reads even when database defaults differ", async () => {
    const ctx = setup();
    await ctx.service.updateInstitutionSetting(institution, category, 12);
    await ctx.service.updateGlobalSetting(category, 20, 1);
    await ctx.service.approvePlatformChangeRequest("request", "reviewer");
    for (const call of ctx.prisma.$transaction.mock.calls as any[]) {
      expect(call[1]).toMatchObject({ isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    }
    expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it("does not block writes in another category", async () => {
    const ctx = setup();
    const gate = ctx.pause("institution");
    const pending = ctx.service.updateInstitutionSetting(institution, category, 12);
    await gate.entered.promise;
    try {
      await ctx.service.updateInstitutionSetting(institution, ProgramCategory.INFAK_SEDEKAH, 10);
    } finally { gate.resume.resolve(); }
    await pending;
  });

  it.each([-1, 101, 1.001, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid institutional percentage %s without writing", async (value) => {
    const ctx = setup();
    await expect(ctx.service.updateInstitutionSetting(institution, category, value)).rejects.toBeInstanceOf(BadRequestException);
    expect(ctx.prisma.amilInstitutionSetting.upsert).not.toHaveBeenCalled();
  });
});
