import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LembagaService } from "./lembaga.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import {
  lembagaAdminSchema,
  lembagaProfileSchema,
  lembagaRegistrationSchema,
  lembagaRejectSchema,
  type LembagaAdminInput,
  type LembagaProfileInput,
  type LembagaRegistrationInput,
  type LembagaRejectInput,
} from "../../../../shared/validations/lembaga.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";
import type { LembagaStatus, LembagaDocumentType } from "@prisma/client";

@Controller("api/lembaga")
export class LembagaController {
  constructor(private readonly lembagaService: LembagaService) {}

  @Get()
  @RequirePermission(PERMISSIONS.LEMBAGA_MANAGE)
  async list(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: LembagaStatus,
  ) {
    const { items, total, totalPages } = await this.lembagaService.getLembagas(
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
      status || undefined,
    );
    return {
      data: items,
      meta: {
        total,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        totalPages,
      },
    };
  }

  /** Dropdown Lembaga APPROVED — cukup login (dipakai form user). */
  @Get("options")
  async options() {
    return this.lembagaService.getOptions();
  }

  /** Profil lembaga milik akun yang sedang login (LEMBAGA_ADMIN). */
  @Get("me")
  @RequirePermission(PERMISSIONS.LEMBAGA_READ)
  async myProfile(@CurrentUser() user: RBACSessionUser) {
    if (!user.lembagaId) {
      throw new BadRequestException("Akun ini tidak terhubung dengan lembaga manapun");
    }
    const lembaga = await this.lembagaService.getById(user.lembagaId);
    if (!lembaga) throw new NotFoundException("Lembaga tidak ditemukan");
    return lembaga;
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.LEMBAGA_MANAGE)
  async detail(@Param("id") id: string) {
    const lembaga = await this.lembagaService.getById(id);
    if (!lembaga) throw new NotFoundException("Lembaga tidak ditemukan");
    return lembaga;
  }

  /**
   * Registrasi publik: lembaga baru (status PENDING) + akun admin pertamanya.
   * Body JSON — file (logo/officePhoto/dokumen) di-upload terlebih dahulu via
   * POST /api/upload (pola yang sama dengan FileUpload di form lembaga/program
   * lain), lalu URL hasil upload dikirim sebagai field biasa di sini.
   */
  @Post("register")
  @Public()
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async register(
    @Body(new ZodValidationPipe(lembagaRegistrationSchema)) body: LembagaRegistrationInput,
  ) {
    const documents: Array<{
      type: LembagaDocumentType;
      fileUrl: string;
      filePublicId?: string;
    }> = [];
    if (body.aktaYayasanUrl) {
      documents.push({ type: "AKTA_YAYASAN", fileUrl: body.aktaYayasanUrl, filePublicId: body.aktaYayasanPublicId });
    }
    if (body.skKemenkumhamUrl) {
      documents.push({ type: "SK_KEMENKUMHAM", fileUrl: body.skKemenkumhamUrl, filePublicId: body.skKemenkumhamPublicId });
    }
    if (body.npwpUrl) {
      documents.push({ type: "NPWP", fileUrl: body.npwpUrl, filePublicId: body.npwpPublicId });
    }
    if (body.otherDocumentUrl) {
      documents.push({ type: "OTHER", fileUrl: body.otherDocumentUrl, filePublicId: body.otherDocumentPublicId });
    }

    return this.lembagaService.registerLembaga({
      name: body.name,
      picName: body.picName,
      picPhone: body.picPhone || undefined,
      address: body.address,
      description: body.description || undefined,
      website: body.website || undefined,
      izinYayasanNumber: body.izinYayasanNumber || undefined,
      logoUrl: body.logoUrl || undefined,
      logoPublicId: body.logoPublicId || undefined,
      officePhotoUrl: body.officePhotoUrl || undefined,
      officePhotoPublicId: body.officePhotoPublicId || undefined,
      adminName: body.adminName,
      adminEmail: body.adminEmail,
      adminPassword: body.adminPassword,
      documents,
    });
  }

  @Patch(":id/approve")
  @RequirePermission(PERMISSIONS.LEMBAGA_APPROVE)
  async approve(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.lembagaService.approveLembaga(id, user.id);
  }

  @Patch(":id/reject")
  @RequirePermission(PERMISSIONS.LEMBAGA_APPROVE)
  async reject(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(lembagaRejectSchema)) body: LembagaRejectInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.lembagaService.rejectLembaga(id, body.reason, user.id);
  }

  /** Self-edit profil lembaga sendiri (LEMBAGA_ADMIN). */
  @Patch("me")
  @RequirePermission(PERMISSIONS.LEMBAGA_READ)
  async updateMyProfile(
    @Body(new ZodValidationPipe(lembagaProfileSchema)) body: LembagaProfileInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    if (!user.lembagaId) {
      throw new BadRequestException("Akun ini tidak terhubung dengan lembaga manapun");
    }
    return this.lembagaService.updateProfile(user.lembagaId, body, user.id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.LEMBAGA_MANAGE)
  async create(
    @Body(new ZodValidationPipe(lembagaAdminSchema)) body: LembagaAdminInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.lembagaService.createLembaga(body, user.id);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.LEMBAGA_MANAGE)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(lembagaAdminSchema)) body: LembagaAdminInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.lembagaService.updateLembaga(id, body, user.id);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.LEMBAGA_MANAGE)
  async remove(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.lembagaService.deleteLembaga(id, user.id);
  }
}
