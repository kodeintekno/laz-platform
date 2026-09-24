import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException, type ExecutionContext } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { lastValueFrom, of } from "rxjs";
import { ProgramsRepository } from "../../src/modules/programs/programs.repository";
import { ProgramsService } from "../../src/modules/programs/programs.service";
import { ProgramsController } from "../../src/modules/programs/programs.controller";
import { PublicController } from "../../src/modules/public/public.controller";
import { TransformInterceptor } from "../../src/common/interceptors/transform.interceptor";

describe("public program donor privacy", () => {
  const date = new Date("2026-09-01T12:00:00Z");
  const donation = {
    id: "donation-1", donorName: "Private Donor", donorEmail: "private@example.test",
    donorPhone: "081234567890", isAnonymous: true, amount: new Prisma.Decimal("50000"),
    createdAt: date, message: "Semoga bermanfaat", status: "PAID",
    lembagaId: "tenant-1", programId: "program-1", platformFee: new Prisma.Decimal("2500"),
    payment: { gatewayRef: "private-provider-ref", metadata: { secret: "private-metadata" } },
    futurePrivateField: "must-not-leak",
  };
  let findFirst: ReturnType<typeof vi.fn>;
  let controller: PublicController;
  let staff: ProgramsController;

  beforeEach(() => {
    // Deliberately return extra fields even when Prisma select is present: the
    // public response boundary must allowlist fields rather than spread rows.
    findFirst = vi.fn().mockResolvedValue({
      id: "program-1", slug: "program", title: "Program", currentAmount: new Prisma.Decimal("50000"),
      donations: [donation], distributions: [], _count: { donations: 1 },
    });
    const repository = new ProgramsRepository({ program: { findFirst } } as any);
    const service = new ProgramsService(repository, {} as any, {} as any, {} as any);
    controller = new PublicController(service, {} as any, {} as any);
    staff = new ProgramsController(service);
  });

  async function response() {
    const value = await controller.programBySlug("program");
    const envelope = await lastValueFrom(new TransformInterceptor().intercept(
      {} as ExecutionContext, { handle: () => of(value) },
    ));
    return JSON.parse(JSON.stringify(envelope));
  }

  it("redacts anonymous identities in the serialized public response", async () => {
    const body = await response();
    expect(body.success).toBe(true);
    expect(body.data.donations).toEqual([{
      id: "donation-1", donorName: "Hamba Allah", isAnonymous: true,
      amount: "50000", createdAt: date.toISOString(), message: "Semoga bermanfaat",
    }]);
    for (const secret of [donation.donorName, donation.donorEmail, donation.donorPhone,
      "private-provider-ref", "private-metadata", "must-not-leak"]) {
      expect(JSON.stringify(body)).not.toContain(secret);
    }
    expect(body.data.title).toBe("Program");
    expect(body.data._count.donations).toBe(1);
  });

  it("keeps opted-in display names and messages but never contact or payment data", async () => {
    findFirst.mockResolvedValue({ donations: [{ ...donation, isAnonymous: false }] });
    const body = await response();
    expect(body.data.donations[0]).toEqual({
      id: donation.id, donorName: donation.donorName, isAnonymous: false,
      amount: "50000", createdAt: date.toISOString(), message: donation.message,
    });
  });

  it("does not fetch contact, payment or internal allocation fields for public detail", async () => {
    await response();
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: "program" },
      include: expect.objectContaining({ donations: {
        where: { status: "PAID" }, orderBy: { createdAt: "desc" }, take: 20,
        select: { id: true, donorName: true, isAnonymous: true, amount: true, createdAt: true, message: true },
      } }),
    }));
  });

  it("handles mixed donors and missing optional name/message without leaking identity", async () => {
    findFirst.mockResolvedValue({ donations: [
      donation, { ...donation, id: "donation-2", isAnonymous: false, donorName: null, message: null },
    ] });
    const body = await response();
    expect(body.data.donations.map((d: any) => d.donorName)).toEqual(["Hamba Allah", null]);
    expect(body.data.donations[1].message).toBeNull();
    expect(JSON.stringify(body)).not.toContain(donation.donorPhone);
  });

  it("preserves empty donation lists and missing-program 404 semantics", async () => {
    findFirst.mockResolvedValueOnce({ donations: [] }).mockResolvedValueOnce(null);
    expect((await response()).data.donations).toEqual([]);
    await expect(controller.programBySlug("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("keeps the authenticated program detail contract separate", async () => {
    const result = await staff.detail("program");
    expect(result?.donations[0]).toEqual(donation);
    expect(findFirst.mock.calls[0][0].include.donations.select).toBeUndefined();
  });
});
