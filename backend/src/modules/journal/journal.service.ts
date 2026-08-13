import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { JournalRepository } from "./journal.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";
import type { JournalInput, VoidJournalInput } from "../../../../shared/validations/journal.schema";
import { AutoJournalService } from "./auto-journal.service";

@Injectable()
export class JournalService {
  constructor(
    private readonly journalRepository: JournalRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly autoJournalService: AutoJournalService,
  ) {}

  async getJournals(lembagaId: string, page: number, limit: number, search?: string) {
    return this.journalRepository.findMany(lembagaId, page, limit, search);
  }

  async getJournalById(id: string, lembagaId: string) {
    const journal = await this.journalRepository.findById(id, lembagaId);
    if (!journal) {
      throw new NotFoundException("Jurnal tidak ditemukan");
    }
    return journal;
  }

  /**
   * Validasi business rules jurnal sebelum disave.
   * Dipanggil saat create dan edit.
   */
  private async validateJournalLines(lembagaId: string, data: JournalInput) {
    // Schema Zod sudah memastikan balance (D=K) dan tidak D+K di satu baris, dsb.
    // Di sini kita cek apakah account valid (milik lembaga ini, bukan header).
    
    const accountIds = [...new Set(data.details.map(d => d.accountId))];
    
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { id: { in: accountIds } }
    });

    if (accounts.length !== accountIds.length) {
      throw new AppError("INVALID_ACCOUNT", "Satu atau lebih akun tidak ditemukan", 400);
    }

    for (const acc of accounts) {
      if (acc.lembagaId !== lembagaId) {
        throw new AppError("INVALID_ACCOUNT_TENANT", `Akun ${acc.code} bukan milik lembaga ini`, 403);
      }
      if (acc.isHeader) {
        throw new AppError("HEADER_ACCOUNT_USED", `Akun ${acc.code} adalah akun header dan tidak dapat digunakan di jurnal`, 400);
      }
      if (!acc.isActive) {
        throw new AppError("INACTIVE_ACCOUNT", `Akun ${acc.code} sedang tidak aktif`, 400);
      }
    }
    
    if (data.programId) {
      const program = await this.prisma.program.findUnique({
        where: { id: data.programId }
      });
      if (!program || program.lembagaId !== lembagaId) {
        throw new AppError("INVALID_PROGRAM", "Program tidak valid atau bukan milik lembaga ini", 400);
      }
    }
  }

  // generateJournalNo dipindahkan ke AutoJournalService

  async createJournal(lembagaId: string, data: JournalInput, userId: string) {
    await this.validateJournalLines(lembagaId, data);
    
    // Validasi balance sebelum membuat jurnal
    const totalDebit = data.details.reduce((sum, d) => sum + Number(d.debit), 0);
    const totalCredit = data.details.reduce((sum, d) => sum + Number(d.credit), 0);
    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
       throw new AppError("UNBALANCED_JOURNAL", "Jurnal tidak balance", 400);
    }
    
    const journalDate = new Date(data.journalDate);
    const journalNo = await this.prisma.$transaction((tx) => 
      this.autoJournalService.generateJournalNo(tx, lembagaId, journalDate)
    );

    const journal = await this.journalRepository.createJournal(lembagaId, journalNo, data, userId);

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entity: "Journal",
      entityId: journal.id,
      newData: { journalNo: journal.journalNo, status: journal.status },
    });

    return journal;
  }



  async voidJournal(id: string, lembagaId: string, data: VoidJournalInput, userId: string) {
    const existing = await this.getJournalById(id, lembagaId);
    
    if (existing.status !== "POSTED") {
      throw new AppError("JOURNAL_NOT_POSTED", "Hanya jurnal berstatus POSTED yang dapat dibatalkan (void)", 400);
    }

    const journal = await this.journalRepository.updateStatus(id, lembagaId, "VOID", userId);

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE, // Represents VOID in this context
      entity: "Journal",
      entityId: journal.id,
      newData: { status: "VOID", reason: data.reason },
    });

    return journal;
  }
}
