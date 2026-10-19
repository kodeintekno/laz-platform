import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ProgramStatus } from "@prisma/client";
import { ProgramsController } from "../../src/modules/programs/programs.controller";
import { ProgramsService } from "../../src/modules/programs/programs.service";
import { ProgramsRepository } from "../../src/modules/programs/programs.repository";
import { PERMISSIONS } from "../../../shared/constants/permissions";

const staff = {
  id: "staff-a", roleName: "LEMBAGA_ADMIN", lembagaId: "tenant-a",
  permissions: [PERMISSIONS.PROGRAMS_READ],
};
const allocations = {
  platformFee: 5000, institutionAmount: 95000, platformPercentage: 5,
  institutionPercentage: 10, amilPlatformAmount: 5000,
  amilInstitutionAmount: 10000, netAmount: 85000,
};

describe("administrative program detail isolation (BAL-001)", () => {
  let records: any[];
  let findFirst: ReturnType<typeof vi.fn>;
  let repository: ProgramsRepository;
  let service: ProgramsService;
  let controller: ProgramsController;

  beforeEach(() => {
    records = [
      { id: "own", slug: "own-program", lembagaId: "tenant-a", status: "DRAFT",
        donations: [{ id: "own-donation", lembagaId: "tenant-a", ...allocations }] },
      { id: "foreign", slug: "foreign-program", lembagaId: "tenant-b", status: "PUBLISHED",
        donations: [{ id: "foreign-donation", lembagaId: "tenant-b", ...allocations }] },
    ];
    findFirst = vi.fn(async ({ where }) => records.find((row) =>
      row.slug === where.slug && (where.lembagaId === undefined || row.lembagaId === where.lembagaId)) ?? null);
    repository = new ProgramsRepository({ program: { findFirst } } as any);
    service = new ProgramsService(repository, {} as any, {} as any, {} as any);
    controller = new ProgramsController(service);
  });

  it.each(Object.values(ProgramStatus))("blocks foreign %s program allocations before retrieval", async (status) => {
    records[1].status = status;
    await expect(controller.detail("foreign-program", staff)).rejects.toBeInstanceOf(NotFoundException);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: "foreign-program", lembagaId: "tenant-a" },
    }));
  });

  it("preserves own-Lembaga administrative allocation fields", async () => {
    await expect(controller.detail("own-program", staff)).resolves.toEqual(records[0]);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: "own-program", lembagaId: "tenant-a" },
    }));
  });

  it("selects the owned program when another Lembaga uses the same slug", async () => {
    records[1].slug = records[0].slug;
    records.reverse(); // The foreign row would win a slug-only findFirst.
    const own = records.find((row) => row.lembagaId === staff.lembagaId);
    await expect(controller.detail("own-program", staff)).resolves.toEqual(own);
  });

  it.each([null, undefined, ""])("rejects missing staff Lembaga %j without querying", async (lembagaId) => {
    await expect(controller.detail("foreign-program", { ...staff, lembagaId })).rejects.toBeInstanceOf(ForbiddenException);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it.each([undefined, { ...staff, id: "" }, { ...staff, permissions: [] }])(
    "requires an authorized actor for direct service and repository calls", async (actor) => {
      await expect(service.getProgramBySlug("foreign-program", actor as any)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(repository.getProgramBySlug("foreign-program", actor as any)).rejects.toBeInstanceOf(ForbiddenException);
      expect(findFirst).not.toHaveBeenCalled();
    },
  );

  it.each([
    { id: "super", roleName: "SUPER_ADMIN", lembagaId: null, permissions: [] },
    { id: "finance", roleName: "FINANCE_PLATFORM", lembagaId: null,
      permissions: [PERMISSIONS.PROGRAMS_READ, PERMISSIONS.PLATFORM_FINANCE_READ] },
    { ...staff, permissions: [PERMISSIONS.PROGRAMS_READ, PERMISSIONS.PLATFORM_FINANCE_READ] },
  ])("preserves permission-authorized cross-Lembaga detail for $roleName", async (actor) => {
    await expect(controller.detail("foreign-program", actor)).resolves.toEqual(records[1]);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "foreign-program" } }));
  });

  it("does not grant cross-Lembaga access from a finance role name alone", async () => {
    await expect(controller.detail("foreign-program", { ...staff, roleName: "FINANCE_PLATFORM" }))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it("still requires programs.read when platform finance permission is present", async () => {
    await expect(controller.detail("foreign-program", {
      ...staff, lembagaId: null, permissions: [PERMISSIONS.PLATFORM_FINANCE_READ],
    })).rejects.toBeInstanceOf(ForbiddenException);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("does not disclose whether a foreign slug exists", async () => {
    const responses = await Promise.all(["foreign-program", "missing-program"].map((slug) =>
      controller.detail(slug, staff).catch((error) => ({ status: error.getStatus(), body: error.getResponse() }))));
    expect(responses[0]).toEqual(responses[1]);
    expect(responses[0]).toMatchObject({ status: 404 });
    expect(JSON.stringify(responses)).not.toContain("foreign-donation");
  });
});
