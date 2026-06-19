import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import { AuthService } from "../../src/modules/auth/auth.service";
import { AppError } from "../../src/common/errors/app.error";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

const makeUserRepository = () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  findRoleByName: vi.fn(),
  create: vi.fn(),
  updateLastLogin: vi.fn().mockResolvedValue(undefined),
});

const makeAuditService = () => ({
  log: vi.fn().mockResolvedValue(undefined),
});

const makePrismaService = () => ({
  laz: { findFirst: vi.fn() },
});

const ACTIVE_USER = {
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  password: "hashed_password",
  status: "ACTIVE",
  roleId: "role-1",
  lazId: "laz-1",
  avatarUrl: null,
  avatarPublicId: null,
  role: {
    name: "DONATUR",
    rolePermissions: [{ permission: { key: "donation:read" } }],
  },
};

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof makeUserRepository>;
  let auditService: ReturnType<typeof makeAuditService>;
  let prismaService: ReturnType<typeof makePrismaService>;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository = makeUserRepository();
    auditService = makeAuditService();
    prismaService = makePrismaService();
    service = new AuthService(
      userRepository as any,
      auditService as any,
      prismaService as any,
    );
  });

  // ──────────────────────────────────────────────
  // signIn
  // ──────────────────────────────────────────────

  describe("signIn", () => {
    const credentials = { email: "user@example.com", password: "pass123" };

    it("returns null when user not found", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      expect(await service.signIn(credentials)).toBeNull();
    });

    it("returns null when user has no password (OAuth user)", async () => {
      userRepository.findByEmail.mockResolvedValue({ ...ACTIVE_USER, password: null });

      expect(await service.signIn(credentials)).toBeNull();
    });

    it("throws AppError with ACCOUNT_INACTIVE when user is not active", async () => {
      userRepository.findByEmail.mockResolvedValue({ ...ACTIVE_USER, status: "INACTIVE" });

      await expect(service.signIn(credentials)).rejects.toMatchObject({
        code: "ACCOUNT_INACTIVE",
      });
      await expect(service.signIn(credentials)).rejects.toBeInstanceOf(AppError);
    });

    it("returns null when password does not match", async () => {
      userRepository.findByEmail.mockResolvedValue(ACTIVE_USER);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      expect(await service.signIn(credentials)).toBeNull();
    });

    it("returns session user shape on valid credentials", async () => {
      userRepository.findByEmail.mockResolvedValue(ACTIVE_USER);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.signIn(credentials);

      expect(result).toMatchObject({
        id: "user-1",
        email: "user@example.com",
        name: "Test User",
        roleName: "DONATUR",
        permissions: ["donation:read"],
        lazId: "laz-1",
      });
    });

    it("calls updateLastLogin after successful login (fire-and-forget)", async () => {
      userRepository.findByEmail.mockResolvedValue(ACTIVE_USER);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.signIn(credentials);

      expect(userRepository.updateLastLogin).toHaveBeenCalledWith("user-1");
    });
  });

  // ──────────────────────────────────────────────
  // register
  // ──────────────────────────────────────────────

  describe("register", () => {
    const registerData = { email: "new@example.com", name: "New User", password: "pass123" };

    it("throws AppError with EMAIL_TAKEN when email already exists", async () => {
      userRepository.findByEmail.mockResolvedValue(ACTIVE_USER);

      await expect(service.register(registerData)).rejects.toMatchObject({
        code: "EMAIL_TAKEN",
      });
    });

    it("throws AppError with MISSING_ROLE when DONATUR role not found", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findRoleByName.mockResolvedValue(null);

      await expect(service.register(registerData)).rejects.toMatchObject({
        code: "MISSING_ROLE",
      });
    });

    it("throws AppError with MISSING_LAZ when no LAZ tenant exists", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findRoleByName.mockResolvedValue({ id: "role-1" });
      prismaService.laz.findFirst.mockResolvedValue(null);

      await expect(service.register(registerData)).rejects.toMatchObject({
        code: "MISSING_LAZ",
      });
    });

    it("creates user with hashed password and writes audit log", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findRoleByName.mockResolvedValue({ id: "role-1" });
      prismaService.laz.findFirst.mockResolvedValue({ id: "laz-1" });
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_pw" as never);
      userRepository.create.mockResolvedValue({ id: "new-user", email: registerData.email });

      await expect(service.register(registerData)).resolves.toBeUndefined();
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerData.email,
          password: "hashed_pw",
          lazId: "laz-1",
          roleId: "role-1",
        }),
      );
      expect(auditService.log).toHaveBeenCalledOnce();
    });
  });

  // ──────────────────────────────────────────────
  // getUserById
  // ──────────────────────────────────────────────

  describe("getUserById", () => {
    it("returns null when user not found", async () => {
      userRepository.findById.mockResolvedValue(null);

      expect(await service.getUserById("ghost")).toBeNull();
    });

    it("returns null when user is inactive", async () => {
      userRepository.findById.mockResolvedValue({ ...ACTIVE_USER, status: "INACTIVE" });

      expect(await service.getUserById("user-1")).toBeNull();
    });

    it("returns session user for active user", async () => {
      userRepository.findById.mockResolvedValue(ACTIVE_USER);

      const result = await service.getUserById("user-1");

      expect(result).toMatchObject({
        id: "user-1",
        email: "user@example.com",
        permissions: ["donation:read"],
      });
    });

    it("returns empty permissions when user has no role", async () => {
      userRepository.findById.mockResolvedValue({ ...ACTIVE_USER, role: null, roleId: null });

      const result = await service.getUserById("user-1");

      expect(result?.permissions).toEqual([]);
    });
  });
});
