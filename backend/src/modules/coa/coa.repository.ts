import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { coaTemplateFor } from "./coa.template";

@Injectable()
export class CoaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByLembaga(lembagaId: string) {
    return this.prisma.chartOfAccount.findMany({
      where: { lembagaId, isActive: true },
      orderBy: { code: "asc" },
    });
  }

  async findPlatform() {
    return this.prisma.chartOfAccount.findMany({
      where: { accountingBook: { ownerType: "PLATFORM" }, isActive: true },
      orderBy: { code: "asc" },
    });
  }

  async syncCoaForLembaga(lembagaId: string): Promise<void> {
    await this.syncBook("LEMBAGA", lembagaId);
  }

  async syncPlatformCoa(): Promise<void> {
    await this.syncBook("PLATFORM");
  }

  async syncAllApprovedLembagaCoas(): Promise<void> {
    const lembagas = await this.prisma.lembaga.findMany({
      where: { status: "APPROVED" },
      select: { id: true },
    });
    for (const lembaga of lembagas) {
      await this.syncBook("LEMBAGA", lembaga.id);
    }
  }

  private async syncBook(ownerType: "LEMBAGA" | "PLATFORM", lembagaId?: string) {
    const template = coaTemplateFor(ownerType);

    await this.prisma.$transaction(async (tx) => {
      const book = ownerType === "LEMBAGA"
        ? await tx.accountingBook.upsert({
            where: { lembagaId: lembagaId! },
            update: { name: `Buku Lembaga ${lembagaId}` },
            create: { ownerType, lembagaId: lembagaId!, name: `Buku Lembaga ${lembagaId}` },
          })
        : (await tx.accountingBook.findFirst({ where: { ownerType: "PLATFORM" } }))
          ?? await tx.accountingBook.create({ data: { ownerType, name: "Buku Platform" } });

      await tx.chartOfAccount.updateMany({
        where: { accountingBookId: book.id, isSystem: true },
        data: { isActive: false },
      });

      for (const account of template) {
        await tx.chartOfAccount.upsert({
          where: { accountingBookId_code: { accountingBookId: book.id, code: account.code } },
          update: {
            key: account.key,
            name: account.name,
            accountType: account.accountType,
            normalBalance: account.normalBalance,
            isHeader: account.isHeader,
            parentCode: account.parentCode,
            level: account.level,
            isSystem: true,
            isEditable: false,
            isDeletable: false,
            isActive: true,
          },
          create: {
            accountingBookId: book.id,
            lembagaId: ownerType === "LEMBAGA" ? lembagaId : null,
            key: account.key,
            code: account.code,
            name: account.name,
            accountType: account.accountType,
            normalBalance: account.normalBalance,
            isHeader: account.isHeader,
            parentCode: account.parentCode,
            level: account.level,
            isSystem: true,
            isEditable: false,
            isDeletable: false,
            isActive: true,
          },
        });
      }
    });
  }

  async countByLembaga(lembagaId: string): Promise<number> {
    return this.prisma.chartOfAccount.count({ where: { lembagaId, isActive: true } });
  }

  async findAccountForLembaga(lembagaId: string, id: string) {
    return this.prisma.chartOfAccount.findFirst({ where: { id, lembagaId } });
  }

  async findAccountByCode(lembagaId: string, code: string) {
    return this.prisma.chartOfAccount.findFirst({ where: { lembagaId, code } });
  }

  async createCustomAccount(data: {
    lembagaId: string;
    accountingBookId: string;
    key: string;
    code: string;
    name: string;
    accountType: "ASSET" | "LIABILITY" | "FUND" | "REVENUE" | "EXPENSE";
    normalBalance: "DEBIT" | "CREDIT";
    parentCode: string;
    level: number;
  }) {
    return this.prisma.chartOfAccount.create({
      data: { ...data, isHeader: false, isSystem: false, isEditable: true, isDeletable: true },
    });
  }

  async updateCustomAccount(id: string, name: string) {
    return this.prisma.chartOfAccount.update({ where: { id }, data: { name } });
  }

  async countAccountUsage(id: string) {
    const [journalDetails, bankAccounts] = await Promise.all([
      this.prisma.journalDetail.count({ where: { accountId: id } }),
      this.prisma.lembagaBankAccount.count({ where: { chartOfAccountId: id } }),
    ]);
    return journalDetails + bankAccounts;
  }

  async deactivateCustomAccount(id: string) {
    return this.prisma.chartOfAccount.update({ where: { id }, data: { isActive: false } });
  }
}
