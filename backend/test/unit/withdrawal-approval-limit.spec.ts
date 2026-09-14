import { describe, it, expect, vi } from "vitest";
import { UsersService } from "../../src/modules/users/users.service";
import { withdrawalApprovalLimitSchema } from "../../../shared/validations/users.schema";

vi.mock("../../src/config/session", () => ({ revokeUserSessions: vi.fn() }));

describe("withdrawal approval limit settings", () => {
  it.each([-1, 1.5, Infinity, NaN, true, null, "", "-1", "1.5", 10000000000000])("rejects invalid limit %s", (limit) => {
    expect(withdrawalApprovalLimitSchema.safeParse(limit).success).toBe(false);
  });

  it("accepts FormData rupiah values and zero", () => {
    expect(withdrawalApprovalLimitSchema.parse("50000000")).toBe(50000000);
    expect(withdrawalApprovalLimitSchema.parse(0)).toBe(0);
  });

  it("rejects limit changes by non-super-admins before writing", async () => {
    const repository = { update: vi.fn(), create: vi.fn() };
    const service = new UsersService(repository as any, {} as any);
    await expect(service.updateUser("finance", { withdrawalApprovalLimit: 50000000 } as any, "staff", undefined, false)).rejects.toThrow("Hanya Super Admin");
    await expect(service.createUser({ withdrawalApprovalLimit: 50000000 } as any, "staff", undefined, false)).rejects.toThrow("Hanya Super Admin");
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it.each([50000000, 0, undefined])("saves limit %s and audits old/new values", async (limit) => {
    const existing = { id: "finance", name: "Finance B", email: "finance@example.com", roleId: "finance-role", role: { name: "FINANCE_PLATFORM" }, status: "ACTIVE", lembagaId: null, withdrawalApprovalLimit: 10000000 };
    const repository = {
      findById: vi.fn().mockResolvedValue(existing),
      findRoleById: vi.fn().mockResolvedValue(existing.role),
      update: vi.fn(async (_id, data) => ({ ...existing, ...data })),
    };
    const audit = { log: vi.fn() };
    const service = new UsersService(repository as any, audit as any);
    await service.updateUser("finance", { ...existing, withdrawalApprovalLimit: limit } as any, "super", undefined, true);
    expect(repository.update).toHaveBeenCalledWith("finance", expect.objectContaining({ withdrawalApprovalLimit: limit ?? 10000000 }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      oldData: expect.objectContaining({ withdrawalApprovalLimit: 10000000 }),
      newData: expect.objectContaining({ withdrawalApprovalLimit: limit ?? 10000000 }),
    }));
  });
});
