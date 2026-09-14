import { describe, it, expect, vi } from "vitest";
import { UsersController } from "../../src/modules/users/users.controller";
import { UsersRepository } from "../../src/modules/users/users.repository";

describe("User categories", () => {
  it("prevents tenant staff from listing global volunteers", async () => {
    const service = { getVolunteers: vi.fn() };
    const controller = new UsersController(service as any);
    await expect(controller.list({ roleName: "LEMBAGA_ADMIN", lembagaId: "a" } as any, "1", "10", undefined, undefined, "volunteer")).rejects.toThrow("Super Admin");
    expect(service.getVolunteers).not.toHaveBeenCalled();
  });

  it("lists volunteers for super admins with search and pagination", async () => {
    const result = { items: [{ id: "volunteer" }], metadata: { total: 1 } };
    const service = { getVolunteers: vi.fn().mockResolvedValue(result) };
    const controller = new UsersController(service as any);
    await expect(controller.list({ roleName: "SUPER_ADMIN" } as any, "2", "10", "Budi", undefined, "volunteer")).resolves.toEqual({ data: result.items, meta: result.metadata });
    expect(service.getVolunteers).toHaveBeenCalledWith(2, 10, "Budi");
  });

  it.each([["lembaga", "LEMBAGA_ADMIN"], ["finance", "FINANCE_PLATFORM"]])("filters %s before pagination and count", async (_category, roleName) => {
    const prisma = { user: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) } };
    const repository = new UsersRepository(prisma as any);
    await repository.findMany(2, 10, "Budi", undefined, roleName);
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.AND).toContainEqual({ role: { name: roleName } });
    expect(prisma.user.count).toHaveBeenCalledWith({ where });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });

  it("only selects directory fields for volunteers", async () => {
    const prisma = { volunteer: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) } };
    await new UsersRepository(prisma as any).findVolunteers(1, 10);
    expect(prisma.volunteer.findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: { id: true, name: true, email: true, phone: true, status: true },
    }));
  });
});
