import { Controller, Get, Post, Patch, Param, Body, Query } from "@nestjs/common";
import { JournalService } from "./journal.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import { AppError } from "../../common/errors/app.error";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { journalSchema, voidJournalSchema, type JournalInput, type VoidJournalInput } from "../../../../shared/validations/journal.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";
import { hasPermission } from "../../../../shared/lib/permissions";

@Controller("api/journal")
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  @RequirePermission(PERMISSIONS.JOURNAL_READ)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("lembagaId") queryLembagaId?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "10",
    @Query("search") search?: string,
    @Query("scope") scope?: string,
  ) {
    if (scope === "platform") {
      if (!hasPermission(user, PERMISSIONS.PLATFORM_FINANCE_READ)) {
        throw new AppError("FORBIDDEN", "Buku Platform hanya untuk staf keuangan platform", 403);
      }
      return this.journalService.getJournals(null, Number(page), Number(limit), search);
    }
    const lembagaId = resolveLembagaScope(user, queryLembagaId);
    if (!lembagaId) {
      throw new AppError("LEMBAGA_REQUIRED", "Parameter lembagaId diperlukan untuk SUPER_ADMIN", 400);
    }
    
    return this.journalService.getJournals(lembagaId, Number(page), Number(limit), search);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.JOURNAL_READ)
  async getDetail(
    @Param("id") id: string,
    @CurrentUser() user: RBACSessionUser,
    @Query("lembagaId") queryLembagaId?: string,
    @Query("scope") scope?: string,
  ) {
    if (scope === "platform") {
      if (!hasPermission(user, PERMISSIONS.PLATFORM_FINANCE_READ)) {
        throw new AppError("FORBIDDEN", "Buku Platform hanya untuk staf keuangan platform", 403);
      }
      return this.journalService.getJournalById(id, null);
    }
    const lembagaId = resolveLembagaScope(user, queryLembagaId);
    if (!lembagaId) {
      throw new AppError("LEMBAGA_REQUIRED", "Parameter lembagaId diperlukan", 400);
    }

    const data = await this.journalService.getJournalById(id, lembagaId);
    return data;
  }

  @Post()
  @RequirePermission(PERMISSIONS.JOURNAL_CREATE)
  async createJournal(
    @Body(new ZodValidationPipe(journalSchema)) body: JournalInput,
    @CurrentUser() user: RBACSessionUser,
    @Query("lembagaId") queryLembagaId?: string,
  ) {
    const lembagaId = resolveLembagaScope(user, queryLembagaId);
    if (!lembagaId) {
      throw new AppError("LEMBAGA_REQUIRED", "Parameter lembagaId diperlukan", 400);
    }

    const data = await this.journalService.createJournal(lembagaId, body, user.id);
    return { data, message: "Jurnal berhasil disimpan dan diposting" };
  }



  @Post(":id/void")
  @RequirePermission(PERMISSIONS.JOURNAL_VOID)
  async voidJournal(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(voidJournalSchema)) body: VoidJournalInput,
    @CurrentUser() user: RBACSessionUser,
    @Query("lembagaId") queryLembagaId?: string,
  ) {
    const lembagaId = resolveLembagaScope(user, queryLembagaId);
    if (!lembagaId) {
      throw new AppError("LEMBAGA_REQUIRED", "Parameter lembagaId diperlukan", 400);
    }

    const data = await this.journalService.voidJournal(id, lembagaId, body, user.id);
    return { data, message: "Jurnal berhasil dibatalkan (void)" };
  }
}
