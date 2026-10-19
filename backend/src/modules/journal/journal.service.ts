import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { JournalRepository } from "./journal.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";
import { hasBalancedJournalAmounts, journalAmountToMinorUnits, type JournalInput, type VoidJournalInput } from "../../../../shared/validations/journal.schema";
import { AutoJournalService } from "./auto-journal.service";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import { hasAllPermissions } from "../../../../shared/lib/permissions";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Injectable()
export class JournalService {
  constructor(
    private readonly journalRepository: JournalRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly autoJournalService: AutoJournalService,
  ) {}

  async getJournals(lembagaId: string | null, page: number, limit: number, search?: string) {
    return this.journalRepository.findMany(lembagaId, page, limit, search);
  }

  async getJournalById(id: string, lembagaId: string | null) {
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

  async createJournal(lembagaId: string, data: JournalInput, actor: RBACSessionUser) {
    // Manual creation immediately posts, so both permissions are required.
    if (!actor?.id || !hasAllPermissions(actor, [PERMISSIONS.JOURNAL_CREATE, PERMISSIONS.JOURNAL_POST])) {
      throw new AppError("FORBIDDEN", "Akses ditolak", 403);
    }
    const userId = actor.id;
    await this.validateJournalLines(lembagaId, data);
    
    // Internal callers must enforce the same stored precision as the API.
    if (data.details.some((detail) => journalAmountToMinorUnits(detail.debit) === null || journalAmountToMinorUnits(detail.credit) === null)) {
      throw new AppError("INVALID_JOURNAL_AMOUNT", "Nominal jurnal harus berada dalam batas penyimpanan dan maksimal 2 angka desimal", 400);
    }
    if (!hasBalancedJournalAmounts(data.details)) {
       throw new AppError("UNBALANCED_JOURNAL", "Jurnal tidak balance", 400);
    }
    
    const journalDate = new Date(data.journalDate);
    const book = await this.prisma.accountingBook.findUnique({ where: { lembagaId } });
    if (!book) {
      throw new AppError("ACCOUNTING_BOOK_NOT_FOUND", "Buku akuntansi lembaga belum tersedia", 500);
    }
    const journalNo = await this.prisma.$transaction((tx) =>
      this.autoJournalService.generateJournalNo(tx, book.id, journalDate)
    );

    const journal = await this.journalRepository.createJournal(book.id, lembagaId, journalNo, data, userId);

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

    // Automatic journals must stay aligned with their source accounting.
    if (existing.sourceType !== "MANUAL") {
      throw new AppError("AUTOMATIC_JOURNAL_LOCKED", "Jurnal otomatis tidak dapat dibatalkan secara manual", 400);
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
