import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { DonationsController } from "../../src/modules/donations/donations.controller";
import { DonationsService } from "../../src/modules/donations/donations.service";
import { DonationsRepository } from "../../src/modules/donations/donations.repository";
import { PERMISSIONS } from "../../../shared/constants/permissions";

const staff = { id: "staff-a", lembagaId: "tenant-a", permissions: [PERMISSIONS.DONATIONS_READ] };
const records = [
  { id: "own", lembagaId: "tenant-a", programId: "program-a", donorName: "Own donor", donorPhone: "081234567890", donorEmail: "own@example.test", amount: 100000, netAmount: 90000, message: "Own message", status: "PAID" },
  { id: "foreign", lembagaId: "tenant-b", programId: "program-b", donorName: "Foreign donor", donorPhone: "089876543210", donorEmail: "foreign@example.test", amount: 200000, netAmount: 180000, message: "Private message", status: "PAID" },
];

describe("administrative donation detail isolation", () => {
  let findUnique: ReturnType<typeof vi.fn>;
  let controller: DonationsController;
  let service: DonationsService;
  beforeEach(() => {
    findUnique = vi.fn(async ({ where, select }) => {
      const record = records.find((row) => row.id === where.id && (where.lembagaId === undefined || row.lembagaId === where.lembagaId));
      if (!record) return null;
      return select ? Object.fromEntries(Object.entries(record).filter(([key]) => select[key])) : record;
    });
    service = new DonationsService(new DonationsRepository({ donation: { findUnique } } as any), {} as any);
    controller = new DonationsController(service);
  });

  it("excludes another tenant in the database query before retrieving contacts or allocations", async () => {
    await expect((controller.detail as any)("foreign", staff)).rejects.toBeInstanceOf(NotFoundException);
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "foreign", lembagaId: "tenant-a" } }));
  });

  it("preserves own-tenant administrative fields through an explicit projection", async () => {
    await expect((controller.detail as any)("own", staff)).resolves.toEqual(records[0]);
    expect(findUnique.mock.calls[0][0].select).toMatchObject({ id: true, lembagaId: true, donorEmail: true, donorPhone: true, netAmount: true });
    expect(findUnique.mock.calls[0][0].select.payment).toBeUndefined();
  });

  it.each([null, undefined, ""])("rejects missing tenant %j without querying", async (lembagaId) => {
    await expect((controller.detail as any)("foreign", { ...staff, lembagaId })).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it.each([undefined, { ...staff, permissions: [] }])("requires an authorized actor at the service boundary", async (actor) => {
    await expect((service.getDonationById as any)("foreign", actor)).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it.each([
    { id: "super", roleName: "SUPER_ADMIN", lembagaId: null, permissions: [] },
    { id: "finance", roleName: "FINANCE_PLATFORM", lembagaId: null, permissions: [PERMISSIONS.DONATIONS_READ, PERMISSIONS.PLATFORM_FINANCE_READ] },
  ])("preserves authorized cross-Lembaga finance access for $roleName", async (actor) => {
    await expect((controller.detail as any)("foreign", actor)).resolves.toEqual(records[1]);
  });

  it("does not grant global access from a finance role name without its permission", async () => {
    await expect((controller.detail as any)("foreign", { ...staff, roleName: "FINANCE_PLATFORM", lembagaId: null }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns identical 404 responses for foreign and nonexistent donations", async () => {
    const errors = await Promise.all(["foreign", "missing"].map((id) =>
      (controller.detail as any)(id, staff).catch((error: any) => ({ status: error.getStatus(), response: error.getResponse() }))));
    expect(errors[0]).toEqual(errors[1]);
    expect(errors[0].status).toBe(404);
    expect(JSON.stringify(errors)).not.toContain("foreign@example.test");
  });
});
