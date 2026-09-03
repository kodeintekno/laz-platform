import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramsService } from "../../src/modules/programs/programs.service";

const pendingProgram = {
  id: "program-1",
  lembagaId: "lembaga-1",
  createdById: "creator-1",
  title: "Program Pendidikan",
  status: "PENDING_REVIEW",
  amilPlatformPercentage: 5,
  requestedAmilPlatformPercentage: 3,
  amilInstitutionPercentage: 7,
  amilMaxTotalPercentage: 12.5,
  amilPlatformChangeReason: "Agar dana program untuk penerima manfaat lebih besar",
  amilLockedAt: null,
};

describe("ProgramsService unified program approval", () => {
  let repository: any;
  let audit: any;
  let tx: any;
  let prisma: any;
  let amil: any;
  let notifications: any;
  let service: ProgramsService;

  beforeEach(() => {
    repository = { findById: vi.fn().mockResolvedValue(pendingProgram) };
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    tx = {
      program: {
        create: vi.fn((input: any) => Promise.resolve({
          id: "program-new",
          slug: input.data.slug,
          title: input.data.title,
          status: input.data.status,
          ...input.data,
        })),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          ...pendingProgram,
          status: "PUBLISHED",
          amilPlatformPercentage: 3,
          amilLockedAt: new Date(),
        }),
      },
      programReviewHistory: {
        findFirst: vi.fn().mockResolvedValue({ id: "review-1" }),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ lembagaId: "lembaga-1" }) },
      $transaction: vi.fn((callback: any) => callback(tx)),
    };
    amil = {
      getProgramAmilContext: vi.fn().mockResolvedValue({
        platformPercentage: 5,
        institutionPercentage: 18,
        maxTotalPercentage: 20,
      }),
      validateProgramAmilSnapshot: vi.fn(),
    };
    notifications = {
      notifyRole: vi.fn().mockResolvedValue(undefined),
      notifyUser: vi.fn().mockResolvedValue(undefined),
    };
    service = new ProgramsService(repository, audit, prisma, amil, notifications);
  });

  it("creates the platform proposal and review history together with the submitted program", async () => {
    await service.createProgram({
      title: "Program Pendidikan Baru",
      description: "Program pendidikan bagi anak-anak yang membutuhkan bantuan.",
      targetAmount: 10_000_000,
      category: "ZAKAT",
      status: "PENDING_REVIEW",
      requestedPlatformPercentage: 2,
      platformChangeReason: "Agar dana program untuk penerima manfaat lebih besar",
      institutionPercentage: 18,
    }, {
      id: "creator-1",
      lembagaId: "lembaga-1",
      roleName: "LEMBAGA_ADMIN",
      permissions: [],
    } as any);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(amil.validateProgramAmilSnapshot).toHaveBeenCalledWith(2, 18, 20);
    expect(tx.program.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amilPlatformPercentage: 5,
        amilInstitutionPercentage: 18,
        requestedAmilPlatformPercentage: 2,
        amilPlatformChangeReason: "Agar dana program untuk penerima manfaat lebih besar",
      }),
    });
    expect(tx.programReviewHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        programId: "program-new",
        defaultPlatformPercentage: 5,
        institutionPercentage: 18,
        requestedPlatformPercentage: 2,
      }),
    });
  });

  it("approves the program and requested platform percentage in one transaction", async () => {
    await service.approveProgram("program-1", "super-admin-1");

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(amil.validateProgramAmilSnapshot).toHaveBeenCalledWith(3, 7, 12.5);
    expect(tx.program.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "program-1", status: "PENDING_REVIEW" },
      data: expect.objectContaining({
        status: "PUBLISHED",
        amilPlatformPercentage: 3,
        approvedById: "super-admin-1",
      }),
    }));
    expect(tx.programReviewHistory.update).toHaveBeenCalledWith({
      where: { id: "review-1" },
      data: expect.objectContaining({ status: "APPROVED" }),
    });
  });

  it("stores the mandatory rejection reason in both program and review history", async () => {
    tx.program.findUniqueOrThrow.mockResolvedValue({
      ...pendingProgram,
      status: "REJECTED",
      rejectionReason: "Dokumen program belum lengkap",
    });

    await service.rejectProgram("program-1", "Dokumen program belum lengkap", "super-admin-1");

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.program.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: "REJECTED",
        rejectionReason: "Dokumen program belum lengkap",
      }),
    }));
    expect(tx.programReviewHistory.update).toHaveBeenCalledWith({
      where: { id: "review-1" },
      data: expect.objectContaining({
        status: "REJECTED",
        rejectionReason: "Dokumen program belum lengkap",
      }),
    });
  });
});
