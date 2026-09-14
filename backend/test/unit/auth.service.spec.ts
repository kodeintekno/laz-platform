import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import { AuthService } from "../../src/modules/auth/auth.service";
import { AppError } from "../../src/common/errors/app.error";
import { ConfigService } from "@nestjs/config";
import { AllExceptionsFilter } from "../../src/common/filters/all-exceptions.filter";

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

const ACTIVE_USER = {
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  password: "hashed_password",
  status: "ACTIVE",
  roleId: "role-1",
  lembagaId: "lembaga-1",
  avatarUrl: null,
  avatarPublicId: null,
  lembaga: { status: "APPROVED", rejectionReason: null },
  role: {
    name: "LEMBAGA_ADMIN",
    rolePermissions: [{ permission: { key: "donations.read" } }],
  },
};

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof makeUserRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository = makeUserRepository();
    service = new AuthService(userRepository as any, new ConfigService({ SUPER_ADMIN_WHATSAPP_NUMBER: "" }));
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

    it("returns null when user has no password", async () => {
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
        roleName: "LEMBAGA_ADMIN",
        permissions: ["donations.read"],
        lembagaId: "lembaga-1",
      });
    });

    it("calls updateLastLogin after successful login (fire-and-forget)", async () => {
      userRepository.findByEmail.mockResolvedValue(ACTIVE_USER);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.signIn(credentials);

      expect(userRepository.updateLastLogin).toHaveBeenCalledWith("user-1");
    });

    it("throws AppError with LEMBAGA_PENDING when the LEMBAGA_ADMIN's lembaga is still pending", async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...ACTIVE_USER,
        lembaga: { status: "PENDING", rejectionReason: null },
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(service.signIn(credentials)).rejects.toMatchObject({
        code: "LEMBAGA_PENDING",
      });
    });

    it("throws AppError with LEMBAGA_REJECTED (including the reason) when the lembaga was rejected", async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...ACTIVE_USER,
        lembaga: { status: "REJECTED", rejectionReason: "Dokumen tidak lengkap" },
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(service.signIn(credentials)).rejects.toMatchObject({
        code: "LEMBAGA_REJECTED",
        message: expect.stringContaining("Dokumen tidak lengkap"),
      });
    });

    it("does not gate SUPER_ADMIN on lembaga status (no lembaga attached)", async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...ACTIVE_USER,
        lembagaId: null,
        lembaga: null,
        role: { name: "SUPER_ADMIN", rolePermissions: [] },
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.signIn(credentials);
      expect(result).toMatchObject({ roleName: "SUPER_ADMIN" });
    });

    it("returns an encoded WhatsApp contact through the error envelope for a rejected Lembaga", async () => {
      service = new AuthService(userRepository as any, new ConfigService({ SUPER_ADMIN_WHATSAPP_NUMBER: "6281234567890" }));
      userRepository.findByEmail.mockResolvedValue({
        ...ACTIVE_USER,
        lembaga: { name: "Yayasan A & B", status: "REJECTED", rejectionReason: "Dokumen #1 kurang\nPerbaiki izin & alamat." },
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      const error = await service.signIn(credentials).catch((err) => err);
      expect(error).toBeInstanceOf(AppError);
      expect(error.getStatus()).toBe(403);
      const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      new AllExceptionsFilter().catch(error, { switchToHttp: () => ({ getResponse: () => response }) } as any);
      const body = response.json.mock.calls[0][0];
      const url = new URL(body.error.details.whatsappUrl);
      expect(url.origin + url.pathname).toBe("https://wa.me/6281234567890");
      expect(url.searchParams.get("text")).toContain("Yayasan A & B");
      expect(url.searchParams.get("text")).toContain("Dokumen #1 kurang\nPerbaiki izin & alamat.");
      expect([...url.searchParams.keys()]).toEqual(["text"]);
      expect(userRepository.updateLastLogin).not.toHaveBeenCalled();
    });

    it("does not reveal rejection contact when password is incorrect", async () => {
      userRepository.findByEmail.mockResolvedValue({ ...ACTIVE_USER, lembaga: { name: "Rahasia", status: "REJECTED", rejectionReason: "Dokumen kurang" } });
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      expect(await service.signIn(credentials)).toBeNull();
    });

    it.each(["", "081234567890", "invalid"])("omits WhatsApp link when number is unavailable or invalid: %s", async (phone) => {
      service = new AuthService(userRepository as any, new ConfigService({ SUPER_ADMIN_WHATSAPP_NUMBER: phone }));
      userRepository.findByEmail.mockResolvedValue({ ...ACTIVE_USER, lembaga: { name: "Lembaga Uji", status: "REJECTED", rejectionReason: null } });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      const error = await service.signIn(credentials).catch((err) => err);
      expect(error.code).toBe("LEMBAGA_REJECTED");
      expect(error.details).toBeUndefined();
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
        permissions: ["donations.read"],
      });
    });

    it("returns empty permissions when user has no role", async () => {
      userRepository.findById.mockResolvedValue({ ...ACTIVE_USER, role: null, roleId: null });

      const result = await service.getUserById("user-1");

      expect(result?.permissions).toEqual([]);
    });
  });
});
