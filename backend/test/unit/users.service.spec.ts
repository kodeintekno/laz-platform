import { describe, it, expect, beforeEach, vi } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { UsersService } from "../../src/modules/users/users.service";
import { AppError } from "../../src/common/errors/app.error";

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn() },
}));

vi.mock("../../src/config/session", () => ({
  revokeUserSessions: vi.fn().mockResolvedValue(undefined),
  getSession: vi.fn(),
}));

const makeUsersRepository = () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  findMany: vi.fn(),
  findRoles: vi.fn(),
  findAllLembagas: vi.fn(),
  findRoleById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateRole: vi.fn(),
  delete: vi.fn(),
  countSuperAdmins: vi.fn(),
});

const makeAuditService = () => ({
  log: vi.fn().mockResolvedValue(undefined),
});

const REGULAR_USER = {
  id: "user-2",
  name: "Regular User",
  email: "regular@example.com",
  password: "hash",
  status: "ACTIVE",
  roleId: "role-user",
  lembagaId: "lembaga-1",
  role: { name: "LEMBAGA_ADMIN" },
};

const SUPER_ADMIN_USER = {
  id: "super-1",
  name: "Super Admin",
  email: "super@example.com",
  password: "hash",
  status: "ACTIVE",
  roleId: "role-super",
  lembagaId: "lembaga-1",
  role: { name: "SUPER_ADMIN" },
};

describe("UsersService", () => {
  let service: UsersService;
  let usersRepository: ReturnType<typeof makeUsersRepository>;
  let auditService: ReturnType<typeof makeAuditService>;

  beforeEach(() => {
    vi.clearAllMocks();
    usersRepository = makeUsersRepository();
    usersRepository.findRoleById.mockResolvedValue({ id: "role-user", name: "LEMBAGA_ADMIN" });
    auditService = makeAuditService();
    service = new UsersService(usersRepository as any, auditService as any);
  });

  // ──────────────────────────────────────────────
  // createUser
  // ──────────────────────────────────────────────

  describe("createUser", () => {
    const input = {
      name: "New User",
      email: "new@example.com",
      password: "pass123",
      roleId: "role-1",
      lembagaId: "lembaga-1",
      status: "ACTIVE" as const,
    };

    it("throws EMAIL_TAKEN when email already exists", async () => {
      usersRepository.findByEmail.mockResolvedValue(REGULAR_USER);

      await expect(service.createUser(input, "admin-1", "lembaga-1")).rejects.toMatchObject({
        code: "EMAIL_TAKEN",
      });
    });

    it("throws LEMBAGA_REQUIRED when no lembaga can be determined", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      const inputNoLembaga = { ...input, lembagaId: undefined };

      await expect(
        service.createUser(inputNoLembaga as any, "admin-1", undefined, false),
      ).rejects.toMatchObject({ code: "LEMBAGA_REQUIRED" });
    });

    it("creates user with hashed password and emits audit log", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_pw" as never);
      const created = { ...REGULAR_USER, id: "new-user" };
      usersRepository.create.mockResolvedValue(created);

      const result = await service.createUser(input, "admin-1", "lembaga-1");

      expect(result).toEqual(created);
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: input.email, password: "hashed_pw" }),
      );
      expect(auditService.log).toHaveBeenCalledOnce();
    });

    it("super admin can assign arbitrary lembagaId from input", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      usersRepository.create.mockResolvedValue({ ...REGULAR_USER, lembagaId: "lembaga-other" });

      await service.createUser({ ...input, lembagaId: "lembaga-other" }, "admin-1", undefined, true);

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ lembagaId: "lembaga-other" }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // updateUser
  // ──────────────────────────────────────────────

  describe("updateUser", () => {
    const updateInput = {
      name: "Updated",
      email: "regular@example.com",
      roleId: "role-user",
      status: "ACTIVE" as const,
      lembagaId: "lembaga-1",
    };

    it("throws NotFoundException when user does not exist", async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateUser("ghost", updateInput, "admin-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws ForbiddenException when non-super-admin edits cross-tenant user", async () => {
      usersRepository.findById.mockResolvedValue({ ...REGULAR_USER, lembagaId: "lembaga-other" });

      await expect(
        service.updateUser("user-2", updateInput, "admin-1", "lembaga-1", false),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("throws EMAIL_TAKEN when new email already belongs to another user", async () => {
      usersRepository.findById.mockResolvedValue(REGULAR_USER);
      const inputWithNewEmail = { ...updateInput, email: "taken@example.com" };
      usersRepository.findByEmail.mockResolvedValue({ id: "other-user" });

      await expect(
        service.updateUser("user-2", inputWithNewEmail, "admin-1", "lembaga-1", false),
      ).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
    });

    it("throws LAST_SUPER_ADMIN when demoting the only super admin", async () => {
      usersRepository.findById.mockResolvedValue(SUPER_ADMIN_USER);
      usersRepository.countSuperAdmins.mockResolvedValue(1);
      const demoInput = { ...updateInput, roleId: "role-user" }; // changing role

      await expect(
        service.updateUser("super-1", demoInput, "admin-1", "lembaga-1", true),
      ).rejects.toMatchObject({ code: "LAST_SUPER_ADMIN" });
    });

    it("updates user and revokes sessions when role changes", async () => {
      const { revokeUserSessions } = await import("../../src/config/session");
      usersRepository.findById.mockResolvedValue(REGULAR_USER);
      const newRoleInput = { ...updateInput, roleId: "role-new" };
      usersRepository.update.mockResolvedValue({ ...REGULAR_USER, roleId: "role-new" });

      await service.updateUser("user-2", newRoleInput, "admin-1", "lembaga-1", false);

      expect(revokeUserSessions).toHaveBeenCalledWith("user-2");
      expect(auditService.log).toHaveBeenCalledOnce();
    });

    it("updates user without revoking sessions when no sensitive field changes", async () => {
      const { revokeUserSessions } = await import("../../src/config/session");
      usersRepository.findById.mockResolvedValue(REGULAR_USER);
      usersRepository.update.mockResolvedValue({ ...REGULAR_USER, name: "Updated" });

      await service.updateUser("user-2", updateInput, "admin-1", "lembaga-1", false);

      expect(revokeUserSessions).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // deleteUser
  // ──────────────────────────────────────────────

  describe("deleteUser", () => {
    it("throws NotFoundException when user does not exist", async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.deleteUser("ghost", "admin-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("throws ForbiddenException when trying to delete own account", async () => {
      usersRepository.findById.mockResolvedValue(REGULAR_USER);

      await expect(
        service.deleteUser("user-2", "user-2", "lembaga-1"),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("throws ForbiddenException when non-super-admin deletes cross-tenant user", async () => {
      usersRepository.findById.mockResolvedValue({ ...REGULAR_USER, lembagaId: "lembaga-other" });

      await expect(
        service.deleteUser("user-2", "admin-1", "lembaga-1", false),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("throws LAST_SUPER_ADMIN when deleting the only super admin", async () => {
      usersRepository.findById.mockResolvedValue(SUPER_ADMIN_USER);
      usersRepository.countSuperAdmins.mockResolvedValue(1);

      await expect(
        service.deleteUser("super-1", "admin-1", "lembaga-1", true),
      ).rejects.toMatchObject({ code: "LAST_SUPER_ADMIN" });
    });

    it("deletes user and revokes sessions on success", async () => {
      const { revokeUserSessions } = await import("../../src/config/session");
      usersRepository.findById.mockResolvedValue(REGULAR_USER);
      usersRepository.delete.mockResolvedValue(REGULAR_USER);

      const result = await service.deleteUser("user-2", "admin-1", "lembaga-1", false);

      expect(result).toEqual(REGULAR_USER);
      expect(revokeUserSessions).toHaveBeenCalledWith("user-2");
      expect(auditService.log).toHaveBeenCalledOnce();
    });
  });

  // ──────────────────────────────────────────────
  // changeRole
  // ──────────────────────────────────────────────

  describe("changeRole", () => {
    it("throws NotFoundException when user does not exist", async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.changeRole("ghost", "role-new", "admin-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("returns user unchanged when same role assigned", async () => {
      usersRepository.findById.mockResolvedValue(REGULAR_USER);

      const result = await service.changeRole("user-2", REGULAR_USER.roleId, "admin-1", "lembaga-1", false);

      expect(result).toEqual(REGULAR_USER);
      expect(usersRepository.updateRole).not.toHaveBeenCalled();
    });

    it("throws LAST_SUPER_ADMIN when changing the only super admin's role", async () => {
      usersRepository.findById.mockResolvedValue(SUPER_ADMIN_USER);
      usersRepository.countSuperAdmins.mockResolvedValue(1);

      await expect(
        service.changeRole("super-1", "role-user", "admin-1", undefined, true),
      ).rejects.toMatchObject({ code: "LAST_SUPER_ADMIN" });
    });

    it("changes role and revokes sessions", async () => {
      const { revokeUserSessions } = await import("../../src/config/session");
      usersRepository.findById.mockResolvedValue(REGULAR_USER);
      const updated = { ...REGULAR_USER, roleId: "role-new", role: { name: "MANAGER" } };
      usersRepository.updateRole.mockResolvedValue(updated);

      const result = await service.changeRole("user-2", "role-new", "admin-1", "lembaga-1", false);

      expect(result).toEqual(updated);
      expect(revokeUserSessions).toHaveBeenCalledWith("user-2");
      expect(auditService.log).toHaveBeenCalledOnce();
    });
  });
});
