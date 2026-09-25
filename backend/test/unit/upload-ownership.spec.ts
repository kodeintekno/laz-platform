import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryProvider } from "../../src/lib/upload/cloudinary.provider";
import { UploadsController } from "../../src/modules/uploads/uploads.controller";
import { SettingsService } from "../../src/modules/settings/settings.service";
import { LembagaRepository } from "../../src/modules/lembaga/lembaga.repository";
import { ProgramsService } from "../../src/modules/programs/programs.service";

const actor = { id: "staff-a", lembagaId: "lembaga-a", permissions: [] };
const scope = { userId: actor.id, lembagaId: actor.lembagaId };
const publicId = "shared-folder/photo";
const asset = (tenant = "lembaga-a", user = "staff-a", resourceType = "image") => ({
  public_id: publicId, resource_type: resourceType,
  context: { custom: { laz_owner_version: "1", laz_owner_user: user, laz_owner_lembaga: tenant } },
});

describe("Cloudinary deletion ownership boundary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(cloudinary, "config").mockReturnValue({ cloud_name: "test" } as any);
    vi.spyOn(cloudinary.api, "resource").mockResolvedValue(asset());
    vi.spyOn(cloudinary.uploader, "destroy").mockResolvedValue({ result: "ok" });
  });

  it("blocks a foreign public ID through the actual upload controller", async () => {
    vi.mocked(cloudinary.api.resource).mockResolvedValue(asset("lembaga-b", "staff-b"));
    const controller = new UploadsController(new CloudinaryProvider(), {} as any);
    await expect((controller.remove as any)(publicId, actor)).rejects.toBeInstanceOf(ForbiddenException);
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it("allows a same-Lembaga staff member to delete an owned image", async () => {
    vi.mocked(cloudinary.api.resource).mockResolvedValue(asset("lembaga-a", "coworker"));
    await expect((new CloudinaryProvider().delete as any)(publicId, scope)).resolves.toBeUndefined();
    expect(cloudinary.uploader.destroy).toHaveBeenCalledExactlyOnceWith(publicId, { resource_type: "image" });
  });

  it.each([
    { userId: "staff-a", lembagaId: "lembaga-b" },
    { userId: "platform-user", lembagaId: null },
    undefined,
  ])("denies reassigned uploaders, platform/null scope and missing authority: %j", async (owner) => {
    await expect((new CloudinaryProvider().delete as any)(publicId, owner)).rejects.toBeInstanceOf(ForbiddenException);
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it.each([{}, { context: { custom: { laz_owner_version: "1" } } }])(
    "preserves legacy and anonymous uploads without proven ownership", async (metadata) => {
      vi.mocked(cloudinary.api.resource).mockResolvedValue({ public_id: publicId, resource_type: "image", ...metadata });
      await expect((new CloudinaryProvider().delete as any)(publicId, scope)).rejects.toBeInstanceOf(ForbiddenException);
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    },
  );

  it("does not let an authorized image authorize a foreign raw asset with the same ID", async () => {
    vi.mocked(cloudinary.api.resource).mockResolvedValueOnce(asset())
      .mockResolvedValueOnce(asset("lembaga-b", "staff-b", "raw"));
    vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({ result: "not found" });
    await expect((new CloudinaryProvider().delete as any)(publicId, scope)).rejects.toBeInstanceOf(ForbiddenException);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
  });

  it("fails closed on lookup failures rather than attempting raw destruction", async () => {
    vi.mocked(cloudinary.api.resource).mockRejectedValue({ error: { http_code: 500 } });
    await expect((new CloudinaryProvider().delete as any)(publicId, scope)).rejects.toBeDefined();
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it("looks up and authorizes a raw document when the image does not exist", async () => {
    vi.mocked(cloudinary.api.resource).mockRejectedValueOnce({ error: { http_code: 404 } })
      .mockResolvedValueOnce(asset("lembaga-a", "staff-a", "raw"));
    await new CloudinaryProvider().delete(publicId, scope);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledExactlyOnceWith(publicId, { resource_type: "raw" });
  });

  it("keeps missing-asset deletion idempotent without invoking destroy", async () => {
    vi.mocked(cloudinary.api.resource).mockRejectedValue({ http_code: 404 });
    await expect(new CloudinaryProvider().delete(publicId, scope)).resolves.toBeUndefined();
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it("allows a platform user's own upload but not another platform user's upload", async () => {
    vi.mocked(cloudinary.api.resource).mockResolvedValue(asset("", "platform-a"));
    await new CloudinaryProvider().delete(publicId, { userId: "platform-a" });
    vi.mocked(cloudinary.uploader.destroy).mockClear();
    await expect(new CloudinaryProvider().delete(publicId, { userId: "platform-b" }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it.each(["shared-folder%2Fphoto", "shared-folder/../photo", "shared-folder/photo.webp"])(
    "does not authorize a different returned public ID for input %s", async (alias) => {
      await expect(new CloudinaryProvider().delete(alias, scope)).rejects.toBeInstanceOf(ForbiddenException);
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    },
  );

  it.each([actor, undefined])("persists only server ownership during upload, including pre-login uploads: %j", async (user) => {
    const upload = vi.spyOn(cloudinary.uploader, "upload_stream").mockImplementation(((options: any, done: any) => ({
      end: () => done(null, { public_id: publicId, secure_url: "https://example.test/photo", resource_type: "image" }),
    })) as any);
    const processed = { buffer: Buffer.from("processed"), mimetype: "image/webp", originalSize: 20, processedSize: 9 };
    const controller = new UploadsController(new CloudinaryProvider(), { process: vi.fn().mockResolvedValue(processed) } as any);
    const response = await controller.upload({} as any, "lembaga-b/forged-folder", user as any);
    const options = upload.mock.calls[0][0] as any;
    expect(options.overwrite).toBe(false);
    expect(options.context).toEqual(user ? {
      laz_owner_version: "1", laz_owner_user: "staff-a", laz_owner_lembaga: "lembaga-a",
    } : { laz_owner_version: "1" });
    expect(response).toEqual({ url: "https://example.test/photo", publicId, resourceType: "image", originalSize: 20, processedSize: 9 });
  });

  it.each([false, true])("avatar replacement respects independently stored ownership (foreign=%s)", async (foreign) => {
    vi.mocked(cloudinary.api.resource).mockResolvedValue(asset(foreign ? "lembaga-b" : "lembaga-a"));
    const user = {
      findUnique: vi.fn().mockResolvedValue({ id: actor.id, lembagaId: actor.lembagaId, avatarPublicId: publicId }),
      update: vi.fn().mockResolvedValue({ avatarUrl: "https://example.test/new" }),
    };
    const result = await new SettingsService({ user } as any, { log: vi.fn() } as any)
      .updateAvatar(actor.id, "https://example.test/new", "new-photo");
    expect(result.avatarUrl).toBe("https://example.test/new");
    expect(user.update).toHaveBeenCalledOnce();
    expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(foreign ? 0 : 1);
  });

  it.each(["update", "delete"] as const)("protects a poisoned Lembaga logo during %s while preserving the record operation", async (operation) => {
    vi.mocked(cloudinary.api.resource).mockResolvedValue(asset("lembaga-b"));
    const lembaga = {
      findUnique: vi.fn().mockResolvedValue({ id: actor.lembagaId, logoPublicId: publicId }),
      update: vi.fn().mockResolvedValue({ id: actor.lembagaId }), delete: vi.fn().mockResolvedValue({ id: actor.lembagaId }),
    };
    const repository = new LembagaRepository({ lembaga } as any, new CloudinaryProvider());
    if (operation === "update") await repository.update(actor.lembagaId, { logoPublicId: "new-logo" });
    else await repository.delete(actor.lembagaId);
    expect(lembaga[operation]).toHaveBeenCalledOnce();
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it.each(["update", "delete"] as const)("preserves cleanup of the executor's platform-owned logo on %s", async (operation) => {
    vi.mocked(cloudinary.api.resource).mockResolvedValue(asset("", "platform-a"));
    const lembaga = {
      findUnique: vi.fn().mockResolvedValue({ logoPublicId: publicId }),
      update: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue({}),
    };
    const repository = new LembagaRepository({ lembaga } as any, new CloudinaryProvider());
    if (operation === "update") await repository.update("lembaga-a", { logoPublicId: "new-logo" }, "platform-a");
    else await repository.delete("lembaga-a", "platform-a");
    expect(cloudinary.uploader.destroy).toHaveBeenCalledOnce();
  });

  it.each([false, true])("program image replacement respects asset ownership (foreign=%s)", async (foreign) => {
    vi.mocked(cloudinary.api.resource).mockResolvedValue(asset(foreign ? "lembaga-b" : "lembaga-a"));
    const old = {
      id: "program-a", lembagaId: actor.lembagaId, status: "DRAFT", category: "INFAQ",
      imageUrl: `https://res.cloudinary.com/test/image/upload/v123/${publicId}.webp`,
      amilPlatformPercentage: 5, amilInstitutionPercentage: 5, amilMaxTotalPercentage: 20,
      requestedAmilPlatformPercentage: null,
    };
    const update = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ lembagaId: actor.lembagaId }) },
      program: { findUnique: vi.fn().mockResolvedValue(old) },
      $transaction: vi.fn((run) => run({ program: { updateMany: update,
        findUniqueOrThrow: vi.fn().mockResolvedValue({ ...old, imageUrl: null }) } })),
    };
    const service = new ProgramsService({} as any, { log: vi.fn() } as any, prisma as any,
      { validateProgramAmilSnapshot: vi.fn() } as any);
    await service.updateProgram(old.id, { status: "DRAFT", category: "INFAQ", image: "" } as any, actor);
    expect(update).toHaveBeenCalledOnce();
    expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(foreign ? 0 : 1);
  });
});
