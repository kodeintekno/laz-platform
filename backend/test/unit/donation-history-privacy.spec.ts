import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Prisma } from "@prisma/client";
import { lastValueFrom, of } from "rxjs";
import { DonationsController } from "../../src/modules/donations/donations.controller";
import { DonationsService } from "../../src/modules/donations/donations.service";
import { DonationsRepository } from "../../src/modules/donations/donations.repository";
import { AuthGuard } from "../../src/common/guards/auth.guard";
import { PermissionsGuard } from "../../src/common/guards/permissions.guard";
import { TransformInterceptor } from "../../src/common/interceptors/transform.interceptor";
import { ZodValidationPipe } from "../../src/common/pipes/zod-validation.pipe";
import { donationHistoryQuerySchema } from "../../../shared/validations/donations.schema";

const phone = "081234567890";
const date = new Date("2026-10-07T00:00:00Z");
const allocations = {
  platformFee: new Prisma.Decimal("5000"), institutionAmount: new Prisma.Decimal("95000"),
  platformPercentage: new Prisma.Decimal("5"), institutionPercentage: new Prisma.Decimal("5"),
  amilPlatformAmount: new Prisma.Decimal("5000"), amilInstitutionAmount: new Prisma.Decimal("5000"),
  netAmount: new Prisma.Decimal("90000"),
};

function project(row: any, select: any): any {
  if (!row || !select) return row;
  return Object.fromEntries(Object.entries(select).filter(([, value]) => value).map(([key, value]: any) =>
    [key, value === true ? row[key] : project(row[key], value.select)]));
}

describe("AUTH-001 public donation history projection", () => {
  let records: any[];
  let findMany: ReturnType<typeof vi.fn>;
  let count: ReturnType<typeof vi.fn>;
  let findUnique: ReturnType<typeof vi.fn>;
  let controller: DonationsController;
  let context: ExecutionContext;
  let authLookup: ReturnType<typeof vi.fn>;
  let authGuard: AuthGuard;
  let permissionsGuard: PermissionsGuard;

  beforeEach(() => {
    records = ["tenant-a", "tenant-b"].map((lembagaId, index) => ({
      id: `donation-${index}`, lembagaId, programId: `program-${index}`,
      donorName: "Private donor", donorEmail: "private@example.test", donorPhone: phone,
      amount: new Prisma.Decimal("100000"), status: index === 0 ? "PAID" : "PENDING",
      message: index === 0 ? "Semoga bermanfaat" : null, isAnonymous: true,
      createdAt: date, updatedAt: date, ...allocations,
      program: { title: `Program ${index}`, slug: `program-${index}`, amilPlatformPercentage: 5, futurePrivateField: "private-program-field" },
      lembaga: { name: `Lembaga ${index}`, slug: lembagaId, bankAccountNumber: "private-bank-account" },
      payment: { gatewayRef: "private-provider-ref", metadata: { secret: "private-metadata" } },
      futurePrivateField: "must-not-leak",
    }));
    findMany = vi.fn(async ({ where, skip, take, select }: any) => records
      .filter((row) => row.donorPhone === where.donorPhone).slice(skip, skip + take)
      .map((row) => project(row, select)));
    count = vi.fn(async ({ where }: any) => records.filter((row) => row.donorPhone === where.donorPhone).length);
    findUnique = vi.fn(async ({ where, select }: any) => project(records.find((row) =>
      row.id === where.id && (where.lembagaId === undefined || row.lembagaId === where.lembagaId)), select) ?? null);
    const repository = new DonationsRepository({ donation: { findMany, count, findUnique } } as any);
    controller = new DonationsController(new DonationsService(repository, {} as any));
    const reflector = new Reflector();
    authLookup = vi.fn();
    authGuard = new AuthGuard(reflector, { getUserById: authLookup } as any);
    permissionsGuard = new PermissionsGuard(reflector);
    context = {
      getHandler: () => DonationsController.prototype.history, getClass: () => DonationsController,
      switchToHttp: () => ({ getRequest: () => ({ session: {} }) }),
    } as any;
  });

  async function response(query: Record<string, unknown> = { phone }) {
    expect(await authGuard.canActivate(context)).toBe(true);
    expect(permissionsGuard.canActivate(context)).toBe(true);
    const parsed = new ZodValidationPipe(donationHistoryQuerySchema).transform(query);
    const value = await controller.history(parsed);
    const envelope = await lastValueFrom(new TransformInterceptor().intercept(context, { handle: () => of(value) }));
    return JSON.parse(JSON.stringify(envelope));
  }

  function publicRow(index: number) {
    return {
      id: `donation-${index}`, amount: "100000", status: index === 0 ? "PAID" : "PENDING",
      createdAt: date.toISOString(), message: index === 0 ? "Semoga bermanfaat" : null,
      program: { title: `Program ${index}`, slug: `program-${index}` },
      lembaga: { name: `Lembaga ${index}`, slug: index === 0 ? "tenant-a" : "tenant-b" },
    };
  }

  it("keeps anonymous cross-Lembaga history while excluding all financial allocations from JSON", async () => {
    const body = await response();
    expect(body).toEqual({
      success: true, data: [publicRow(0), publicRow(1)],
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
    for (const row of body.data) for (const field of Object.keys(allocations)) expect(row).not.toHaveProperty(field);
    expect(authLookup).not.toHaveBeenCalled();
  });

  it("does not retrieve allocation columns or payment records for the public query", async () => {
    await response();
    const query = findMany.mock.calls[0][0];
    expect(query.where).toEqual({ donorPhone: phone });
    expect(query.include).toBeUndefined();
    expect(query.select).toBeDefined();
    for (const field of [...Object.keys(allocations), "payment"]) expect(query.select).not.toHaveProperty(field);
    expect(query.select.program).toEqual({ select: { title: true, slug: true } });
    expect(query.select.lembaga).toEqual({ select: { name: true, slug: true } });
  });

  it("still redacts allocations and extra nested/scalar fields if persistence returns a wider row", async () => {
    // Match the public-program privacy precedent: test the final response
    // boundary even when a persistence mock ignores its query projection.
    findMany.mockResolvedValue(records);
    const body = await response();
    expect(body.data).toEqual([publicRow(0), publicRow(1)]);
    for (const secret of ["private@example.test", "private-provider-ref", "private-metadata",
      "must-not-leak", "private-program-field", "private-bank-account"]) {
      expect(JSON.stringify(body)).not.toContain(secret);
    }
  });

  it("preserves pagination, date ordering and the matching-phone count", async () => {
    records.push({ ...records[0], id: "different-phone", donorPhone: "089876543210" });
    const body = await response({ phone, page: "2", limit: "1", lembagaId: "tenant-a" });
    expect(body.data).toEqual([publicRow(1)]);
    expect(body.meta).toEqual({ total: 2, page: 2, limit: 1, totalPages: 2 });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { donorPhone: phone }, skip: 1, take: 1, orderBy: { createdAt: "desc" },
    }));
    expect(count).toHaveBeenCalledWith({ where: { donorPhone: phone } });
  });

  it.each(["081234567890", "6281234567890", "+6281234567890"])("preserves exact matching for supported phone form %s", async (input) => {
    records.forEach((row) => { row.donorPhone = input; });
    expect((await response({ phone: input })).data).toEqual([publicRow(0), publicRow(1)]);
    expect(count).toHaveBeenCalledWith({ where: { donorPhone: input } });
  });

  it("preserves an empty history response and its pagination metadata", async () => {
    const body = await response({ phone: "089876543210" });
    expect(body).toEqual({ success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } });
  });

  it("rejects invalid phone input before querying", async () => {
    await expect(response({ phone: "invalid" })).rejects.toThrow();
    expect(findMany).not.toHaveBeenCalled();
    expect(count).not.toHaveBeenCalled();
  });

  it("preserves authorized own-tenant allocations and rejects foreign administrative detail", async () => {
    const actor = { id: "staff-a", lembagaId: "tenant-a", permissions: ["donations.read"] } as any;
    const own = await controller.detail("donation-0", actor);
    for (const [field, amount] of Object.entries(allocations)) expect(own).toHaveProperty(field, amount);
    await expect(controller.detail("donation-1", actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(findUnique).toHaveBeenLastCalledWith(expect.objectContaining({ where: { id: "donation-1", lembagaId: "tenant-a" } }));
  });
});
