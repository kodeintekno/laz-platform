import { beforeEach, describe, expect, it, vi } from "vitest";
import { lastValueFrom, of } from "rxjs";
import { UsersRepository } from "../../src/modules/users/users.repository";
import { UsersService } from "../../src/modules/users/users.service";
import { UsersController } from "../../src/modules/users/users.controller";
import { UserRepository as AuthUserRepository } from "../../src/modules/auth/user.repository";
import { TransformInterceptor } from "../../src/common/interceptors/transform.interceptor";

vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(async () => "new-password-hash") } }));
vi.mock("../../src/config/session", () => ({ revokeUserSessions: vi.fn(async () => undefined) }));

function project(row: any, select: any): any {
  if (!select || !row) return row;
  return Object.fromEntries(Object.entries(select).filter(([, value]) => value).map(([key, value]: any) =>
    [key, value === true ? row[key] : project(row[key], value.select)]));
}

describe("user management response privacy", () => {
  let record: any;
  let prisma: any;
  let repository: UsersRepository;
  let controller: UsersController;
  let audit: any;
  beforeEach(() => {
    record = {
      id: "target", name: "Staff", email: "staff@example.test", password: "$2b$12$private-hash",
      status: "ACTIVE", roleId: "role-1", lembagaId: "tenant", withdrawalApprovalLimit: 1234,
      avatarUrl: "avatar", avatarPublicId: "asset", phoneNumber: "081234567890",
      emailNotifications: true, waNotifications: false, isPlatformAdmin: false,
      emailVerified: null, lastLoginAt: null, createdAt: new Date(), updatedAt: new Date(),
      role: { id: "role-1", name: "LEMBAGA_ADMIN" }, lembaga: { id: "tenant", name: "Tenant" },
      futureCredentialField: "future-secret",
    };
    const mutate = vi.fn(async ({ data, select }: any) => {
      record = { ...record, ...data };
      return project(record, select);
    });
    prisma = { user: {
      findMany: vi.fn(async ({ select }) => [project(record, select)]), count: vi.fn(async () => 1),
      findUnique: vi.fn(async ({ where, select }) => where.email && where.email !== record.email ? null : project(record, select)),
      create: mutate, update: mutate, delete: vi.fn(async ({ select }) => project(record, select)),
    }, role: { findUnique: vi.fn(async ({ where }) => ({ id: where.id, name: "LEMBAGA_ADMIN" })) } };
    repository = new UsersRepository(prisma);
    audit = { log: vi.fn(async () => undefined) };
    controller = new UsersController(new UsersService(repository, audit));
  });

  for (const roleName of ["LEMBAGA_ADMIN", "SUPER_ADMIN"]) {
    it.each(["list", "detail", "create", "update", "delete", "changeRole", "unchangedRole"])(`${roleName} %s response excludes credentials`, async (operation) => {
      const actor: any = { id: "operator", roleName, lembagaId: "tenant", permissions: ["users.read"] };
      const input: any = { name: "New name", email: record.email, roleId: "role-1", lembagaId: "tenant", status: "ACTIVE", password: "supplied-password" };
      let result: any;
      switch (operation) {
        case "list": result = await controller.list(actor); break;
        case "detail": result = await controller.detail("target", actor); break;
        case "create": result = await controller.create({ ...input, email: "new@example.test" }, actor); break;
        case "update": result = await controller.update("target", input, actor); break;
        case "delete": result = await controller.remove("target", actor); break;
        default: result = await controller.changeRole("target", { roleId: operation === "unchangedRole" ? "role-1" : "role-2" }, actor);
      }
      const envelope: any = await lastValueFrom(new TransformInterceptor().intercept({} as any, { handle: () => of(result) }));
      const user = operation === "list" ? envelope.data[0] : envelope.data;
      expect(user).not.toHaveProperty("password");
      expect(user).not.toHaveProperty("futureCredentialField");
      expect(user).toMatchObject({ id: "target", status: "ACTIVE", role: { name: "LEMBAGA_ADMIN" } });
      expect(user).toHaveProperty("withdrawalApprovalLimit");
      expect(user).toHaveProperty("avatarPublicId", "asset");
      expect(user).toHaveProperty("waNotifications", false);
      expect(JSON.stringify(envelope)).not.toContain("private-hash");
      expect(JSON.stringify(envelope)).not.toContain("new-password-hash");
      expect(JSON.stringify(audit.log.mock.calls)).not.toContain("password-hash");
      if (["create", "update"].includes(operation)) expect(record.password).toBe("new-password-hash");
      if (operation === "list") expect(envelope.meta).toMatchObject({ total: 1, page: 1, limit: 10 });
    });
  }

  it("keeps management email lookups credential-free", async () => {
    const result = await repository.findByEmail(record.email);
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("futureCredentialField");
  });

  it("retains server-only password access in the separate authentication repository", async () => {
    const auth = new AuthUserRepository(prisma);
    expect((await auth.findByEmail(record.email))?.password).toBe(record.password);
  });

  it("omits even null passwords and preserves nullable relationships", async () => {
    record.password = null;
    record.lembagaId = null;
    record.lembaga = null;
    const result = await repository.findById("target");
    expect(result).not.toHaveProperty("password");
    expect(result?.lembaga).toBeNull();
    expect(prisma.user.findUnique.mock.calls[0][0].select).not.toHaveProperty("password");
  });
});
