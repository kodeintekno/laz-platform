import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class JournalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(lembagaId: string, page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.JournalWhereInput = { lembagaId };
    
    if (search) {
      where.OR = [
        { journalNo: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.journal.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ journalDate: "desc" }, { journalNo: "desc" }],
        include: {
          createdBy: { select: { name: true } },
          postedBy: { select: { name: true } },
          details: {
            include: {
              account: { select: { code: true, name: true, normalBalance: true } }
            }
          }
        },
      }),
      this.prisma.journal.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, lembagaId: string) {
    return this.prisma.journal.findFirst({
      where: { id, lembagaId },
      include: {
        createdBy: { select: { name: true } },
        postedBy: { select: { name: true } },
        program: { select: { title: true } },
        details: {
          include: {
            account: { select: { code: true, name: true, normalBalance: true } }
          }
        }
      },
    });
  }

  async createJournal(
    lembagaId: string, 
    journalNo: string, 
    data: any, 
    userId: string
  ) {
    return this.prisma.journal.create({
      data: {
        lembagaId,
        journalNo,
        journalDate: new Date(data.journalDate),
        description: data.description,
        sourceType: "MANUAL",
        programId: data.programId,
        status: "POSTED",
        createdById: userId,
        postedById: userId,
        postedAt: new Date(),
        details: {
          create: data.details.map((d: any) => ({
            accountId: d.accountId,
            debit: d.debit,
            credit: d.credit,
            description: d.description,
          }))
        }
      },
      include: {
        details: true
      }
    });
  }



  async updateStatus(id: string, lembagaId: string, status: "POSTED" | "VOID", userId: string) {
    return this.prisma.journal.update({
      where: { id, lembagaId },
      data: {
        status,
        ...(status === "POSTED" ? {
          postedById: userId,
          postedAt: new Date(),
        } : {})
      }
    });
  }
}
