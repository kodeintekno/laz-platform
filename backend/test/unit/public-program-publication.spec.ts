import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { ProgramStatus } from "@prisma/client";
import { ProgramsRepository } from "../../src/modules/programs/programs.repository";
import { ProgramsService } from "../../src/modules/programs/programs.service";
import { ProgramsController } from "../../src/modules/programs/programs.controller";
import { PublicController } from "../../src/modules/public/public.controller";

const unpublished = Object.values(ProgramStatus).filter((status) => status !== "PUBLISHED");

describe("public program publication boundary", () => {
  let record: any;
  let findFirst: ReturnType<typeof vi.fn>;
  let publicController: PublicController;
  let staffController: ProgramsController;

  beforeEach(() => {
    record = {
      id: "program-1", slug: "known-program", status: "PUBLISHED", title: "Program",
      description: "Program content", donations: [], distributions: [], _count: { donations: 0 },
    };
    // An id/slug-only lookup intentionally returns unpublished records, as
    // Prisma would. Tests exercise the real controller/service/repository.
    findFirst = vi.fn(async ({ where }) => where.slug === record.slug
      && (where.status === undefined || where.status === record.status) ? record : null);
    const repository = new ProgramsRepository({ program: { findFirst } } as any);
    const service = new ProgramsService(repository, {} as any, {} as any, {} as any);
    publicController = new PublicController(service, {} as any, {} as any);
    staffController = new ProgramsController(service);
  });

  it.each(unpublished)("returns 404 for known %s slugs without returning internal content", async (status) => {
    record.status = status;
    record.description = "private-unpublished-content";
    record.rejectionReason = "private-review-reason";
    await expect(publicController.programBySlug(record.slug)).rejects.toBeInstanceOf(NotFoundException);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: record.slug, status: "PUBLISHED" } }));
  });

  it("preserves published detail and its public donation mapping", async () => {
    record.donations = [{ id: "donation-1", donorName: "Private name", isAnonymous: true, amount: 1000, createdAt: "date", message: "Public message" }];
    const result = await publicController.programBySlug(record.slug);
    expect(result).toMatchObject({ id: record.id, title: "Program", status: "PUBLISHED", _count: { donations: 0 } });
    expect(result.donations[0].donorName).toBe("Hamba Allah");
  });

  it("stops serving a previously published slug after unpublishing and permits republishing", async () => {
    await expect(publicController.programBySlug(record.slug)).resolves.toBeDefined();
    record.status = "DRAFT";
    await expect(publicController.programBySlug(record.slug)).rejects.toBeInstanceOf(NotFoundException);
    record.status = "PUBLISHED";
    await expect(publicController.programBySlug(record.slug)).resolves.toBeDefined();
  });

  it("uses the same 404 for missing and unpublished programs", async () => {
    record.status = "PENDING_REVIEW";
    const responses = await Promise.all([record.slug, "nonexistent"].map((slug) =>
      publicController.programBySlug(slug).catch((error) => ({ status: error.getStatus(), body: error.getResponse() }))));
    expect(responses[0]).toEqual(responses[1]);
    expect(responses[0]).toMatchObject({ status: 404 });
  });

  it.each(unpublished)("keeps %s accessible through the separate authenticated detail path", async (status) => {
    record.status = status;
    await expect(staffController.detail(record.slug)).resolves.toEqual(record);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: record.slug } }));
  });
});
