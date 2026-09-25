import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  const writes = vi.fn();
  const users = new Map<string, any>();
  const beforeUserUpsert = vi.fn();
  let finish = () => {};
  const models = new Map<string, any>();
  const prisma = new Proxy({}, {
    get(_target, name: string) {
      if (name === "$disconnect") return async () => finish();
      if (!models.has(name)) models.set(name, new Proxy({}, {
        get(_model, method: string) {
          return async (args: any) => {
            if (method === "findFirst") return null;
            if (method === "aggregate") return { _sum: {} };
            writes(name, method, args);
            if (name === "user" && method === "upsert") {
              beforeUserUpsert(args);
              const existing = users.get(args.where.email);
              const row = existing ? { ...existing, ...args.update } : { id: `${args.where.email}-id`, ...args.create };
              users.set(args.where.email, row);
              return row;
            }
            if (name === "role" && method === "upsert") return { id: `role-${args.create.name}`, ...args.create };
            return { id: `${name}-id`, ...(args.create ?? args.data) };
          };
        },
      }));
      return models.get(name);
    },
  });
  return { prisma, writes, users, beforeUserUpsert, complete: (callback: () => void) => { finish = callback; } };
});

// Run the actual seed entry point only against these in-memory doubles.
vi.mock("@prisma/client", () => ({ PrismaClient: class { constructor() { return harness.prisma; } } }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: class {} }));
vi.mock("dotenv/config", () => ({}));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(async (value: string) => `hashed:${value}`) } }));

const adminSecret = "unit-test-admin-secret-7361";
const financeSecret = "unit-test-finance-secret-9824";

async function runSeed() {
  const completed = new Promise<void>((resolve) => harness.complete(resolve));
  await import("../../prisma/seed");
  await completed;
}

describe("production seed credential boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    harness.writes.mockClear();
    harness.users.clear();
    harness.beforeUserUpsert.mockReset();
    vi.stubEnv("SEED_ADMIN_EMAIL", "seed-admin@example.test");
    vi.stubEnv("SEED_FINANCE_EMAIL", "seed-finance@example.test");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SEED_ADMIN_PASSWORD", adminSecret);
    vi.stubEnv("SEED_FINANCE_PASSWORD", financeSecret);
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

  it.each([
    ["SEED_ADMIN_PASSWORD", undefined], ["SEED_FINANCE_PASSWORD", undefined],
    ["SEED_ADMIN_PASSWORD", ""], ["SEED_FINANCE_PASSWORD", "   "],
    ["SEED_ADMIN_PASSWORD", "Admin@123456"], ["SEED_FINANCE_PASSWORD", "Finance@123456"],
    ["SEED_ADMIN_PASSWORD", "DevAdmin@123"], ["SEED_FINANCE_PASSWORD", "x".repeat(73)],
  ])("rejects unsafe %s before any database writes (%s)", async (key, value) => {
    vi.stubEnv(key!, value);
    await runSeed();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(harness.writes).not.toHaveBeenCalled();
    expect(String(vi.mocked(console.error).mock.calls)).not.toContain(adminSecret);
    expect(String(vi.mocked(console.error).mock.calls)).not.toContain(financeSecret);
  });

  it("creates only explicitly credentialed platform users and reference data in production", async () => {
    await runSeed();
    expect(process.exit).not.toHaveBeenCalled();
    const users = harness.writes.mock.calls.filter(([model]) => model === "user");
    expect(users).toHaveLength(2);
    expect(users.map(([, , args]) => args.create.password)).toEqual([`hashed:${adminSecret}`, `hashed:${financeSecret}`]);
    expect(users.every(([, , args]) => args.create.lembagaId === null)).toBe(true);
    expect(harness.writes.mock.calls.some(([model]) => model === "permission")).toBe(true);
    expect(harness.writes.mock.calls.some(([model]) => model === "chartOfAccount")).toBe(true);
    expect(harness.writes.mock.calls.some(([model]) => ["lembaga", "volunteer", "program", "donation", "distribution"].includes(model))).toBe(false);
    expect(String(vi.mocked(console.log).mock.calls)).not.toContain(adminSecret);
    expect(String(vi.mocked(console.log).mock.calls)).not.toContain(financeSecret);
  });

  it("does not enable development defaults when NODE_ENV is missing", async () => {
    vi.stubEnv("NODE_ENV", undefined);
    vi.stubEnv("SEED_ADMIN_PASSWORD", undefined);
    await runSeed();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(harness.writes).not.toHaveBeenCalled();
  });

  it("preserves explicit development fixtures and fallback credentials", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SEED_ADMIN_PASSWORD", undefined);
    vi.stubEnv("SEED_FINANCE_PASSWORD", undefined);
    await runSeed();
    expect(process.exit).not.toHaveBeenCalled();
    expect(harness.writes.mock.calls.some(([model]) => model === "lembaga")).toBe(true);
    expect(harness.writes.mock.calls.some(([model]) => model === "volunteer")).toBe(true);
    expect(harness.writes.mock.calls.find(([model]) => model === "user")?.[2].create.password).toBe("hashed:Admin@123456");
  });

  it.each(["ADMIN", "FINANCE"])("refuses an existing tenant registrant at the %s seed email", async (account) => {
    const email = process.env[`SEED_${account}_EMAIL`]!;
    const registrant = { id: "registrant", email, name: "Tenant staff", roleId: "role-LEMBAGA_ADMIN",
      lembagaId: "pending-tenant", status: "ACTIVE", password: "attacker-chosen-hash" };
    harness.users.set(email, registrant);
    await runSeed();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(harness.users.get(email)).toEqual(registrant);
  });

  it.each(["ADMIN", "FINANCE"])("cannot promote a registrant racing provisioning of %s", async (account) => {
    const email = process.env[`SEED_${account}_EMAIL`]!;
    const registrant = { id: "racing-user", email, roleId: "role-LEMBAGA_ADMIN", lembagaId: "pending-tenant",
      status: "ACTIVE", password: "attacker-chosen-hash" };
    harness.beforeUserUpsert.mockImplementation((args) => {
      if (args.where.email === email) harness.users.set(email, registrant);
    });
    await runSeed();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(harness.users.get(email)).toEqual(registrant);
  });

  it.each(["ADMIN", "FINANCE"])("preserves existing matching %s identity, password and disabled status on rerun", async (account) => {
    const email = process.env[`SEED_${account}_EMAIL`]!;
    const existing = { id: "trusted-user", email, roleId: `role-${account === "ADMIN" ? "SUPER_ADMIN" : "FINANCE_PLATFORM"}`,
      lembagaId: null, status: "INACTIVE", password: "rotated-platform-hash", name: "Operator name" };
    harness.users.set(email, existing);
    await runSeed();
    expect(process.exit).not.toHaveBeenCalled();
    expect(harness.users.get(email)).toEqual(existing);
  });

  it.each(["ADMIN", "FINANCE"])("fails closed on a concurrent unique-email conflict for %s", async (account) => {
    const email = process.env[`SEED_${account}_EMAIL`]!;
    const registrant = { id: "racing-user", email, roleId: "role-LEMBAGA_ADMIN", lembagaId: "tenant",
      status: "ACTIVE", password: "attacker-chosen-hash" };
    harness.beforeUserUpsert.mockImplementation((args) => {
      if (args.where.email === email) {
        harness.users.set(email, registrant);
        throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
      }
    });
    await runSeed();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(harness.users.get(email)).toEqual(registrant);
    expect(harness.writes.mock.calls.filter(([model, , args]) => model === "user" && args.where?.email === email)).toHaveLength(1);
  });

  it.each([
    { roleId: "role-FINANCE_PLATFORM", lembagaId: null },
    { roleId: "role-SUPER_ADMIN", lembagaId: "tenant" },
    { roleId: null, lembagaId: null },
  ])("rejects an incompatible existing administrator identity: %j", async (identity) => {
    const email = process.env.SEED_ADMIN_EMAIL!;
    const existing = { id: "collision", email, status: "ACTIVE", password: "unchanged", ...identity };
    harness.users.set(email, existing);
    await runSeed();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(harness.users.get(email)).toEqual(existing);
  });
});
