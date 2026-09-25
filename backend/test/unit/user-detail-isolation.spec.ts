import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { UsersController } from "../../src/modules/users/users.controller";
import { UsersService } from "../../src/modules/users/users.service";
import { UsersRepository } from "../../src/modules/users/users.repository";
import { PERMISSIONS } from "../../../shared/constants/permissions";

const staff = { id: "staff-a", lembagaId: "tenant-a", permissions: [PERMISSIONS.USERS_READ] };
const records = [
  { id: "staff-a", lembagaId: "tenant-a", name: "Own account" },
  { id: "coworker-a", lembagaId: "tenant-a", name: "Coworker", role: { id: "role-a", name: "LEMBAGA_ADMIN" }, lembaga: { id: "tenant-a", name: "A" } },
  { id: "staff-b", lembagaId: "tenant-b", email: "private-b@example.test", password: "foreign-hash" },
  { id: "platform", lembagaId: null, email: "private-platform@example.test", password: "platform-hash" },
];

describe("user detail tenant isolation", () => {
  let findUnique: ReturnType<typeof vi.fn>;
  let controller: UsersController;
  let service: UsersService;
  beforeEach(() => {
    // Respect the actual query predicate: an id-only query exposes the fixture.
    findUnique = vi.fn(async ({ where }) => records.find((record) => record.id === where.id
      && (where.lembagaId === undefined || record.lembagaId === where.lembagaId)) ?? null);
    service = new UsersService(new UsersRepository({ user: { findUnique } } as any), {} as any);
    controller = new UsersController(service);
  });

  it.each(["staff-b", "platform"])("does not return the foreign account %s", async (id) => {
    await expect((controller.detail as any)(id, staff)).rejects.toBeInstanceOf(NotFoundException);
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id, lembagaId: "tenant-a" } }));
  });

  it.each(["staff-a", "coworker-a"])("preserves own-Lembaga account detail for %s", async (id) => {
    await expect((controller.detail as any)(id, staff)).resolves.toEqual(records.find((r) => r.id === id));
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id, lembagaId: "tenant-a" },
      include: { role: { select: { id: true, name: true } }, lembaga: { select: { id: true, name: true } } },
    }));
  });

  it.each([null, undefined, ""])("does not interpret missing tenant %j as platform access", async (lembagaId) => {
    await expect((controller.detail as any)("platform", { ...staff, lembagaId })).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("does not use platform finance read permission as global account access", async () => {
    await expect((controller.detail as any)("staff-b", {
      ...staff, permissions: [PERMISSIONS.USERS_READ, PERMISSIONS.PLATFORM_FINANCE_READ],
    })).rejects.toBeInstanceOf(NotFoundException);
  });

  it("denies tenantless finance staff even when granted users.read", async () => {
    await expect((controller.detail as any)("staff-b", {
      ...staff, lembagaId: null, roleName: "FINANCE_PLATFORM", permissions: [PERMISSIONS.USERS_READ, PERMISSIONS.PLATFORM_FINANCE_READ],
    })).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it.each(["staff-b", "platform"])("preserves Super Admin access to %s", async (id) => {
    await expect((controller.detail as any)(id, { id: "admin", roleName: "SUPER_ADMIN", lembagaId: null, permissions: [] }))
      .resolves.toEqual(records.find((r) => r.id === id));
  });

  it("retains the missing-account 404 and does not reveal foreign existence", async () => {
    const errors = await Promise.all(["staff-b", "absent"].map((id) =>
      (controller.detail as any)(id, staff).catch((error: any) => ({ status: error.getStatus(), response: error.getResponse() }))));
    expect(errors[0]).toEqual(errors[1]);
    expect(errors[0].status).toBe(404);
    expect(JSON.stringify(errors)).not.toContain("foreign-hash");
    expect(JSON.stringify(errors)).not.toContain("private-b@example.test");
  });

  it.each([undefined, { ...staff, permissions: [] }])("requires an authorized actor at the service boundary", async (actor) => {
    await expect((service.getUserById as any)("staff-b", actor)).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
