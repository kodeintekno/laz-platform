import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { COA_TEMPLATE } from "./coa.template";

@Injectable()
export class CoaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ambil semua COA milik satu lembaga, diurutkan berdasarkan kode akun.
   */
  async findByLembaga(lembagaId: string) {
    return this.prisma.chartOfAccount.findMany({
      where: { lembagaId, isActive: true },
      orderBy: { code: "asc" },
    });
  }

  /**
   * Seed semua akun COA template untuk satu lembaga.
   * Menggunakan $transaction dan createMany untuk memastikan operasi atomik.
   * Idempotent — skipDuplicates: true.
   */
  async seedCoaForLembaga(lembagaId: string): Promise<void> {
    const payload = COA_TEMPLATE.map((row) => ({
      lembagaId,
      code: row.code,
      name: row.name,
      accountType: row.accountType,
      normalBalance: row.normalBalance,
      isHeader: row.isHeader,
      parentCode: row.parentCode,
      level: row.level,
      isSystem: true,
      isEditable: false,
      isDeletable: false,
      isActive: true,
    }));

    await this.prisma.$transaction(async (tx) => {
      await tx.chartOfAccount.createMany({
        data: payload,
        skipDuplicates: true,
      });
    });
  }

  /** Hitung jumlah akun COA milik lembaga (untuk diagnostik). */
  async countByLembaga(lembagaId: string): Promise<number> {
    return this.prisma.chartOfAccount.count({ where: { lembagaId } });
  }
}
