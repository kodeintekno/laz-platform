import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { DonationsService } from "./donations.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { resolveLembagaScope } from "../../common/utils/lembaga-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import {
  adminDonationSchema,
  donationHistoryQuerySchema,
  donationSchema,
  type AdminDonationInput,
  type DonationHistoryQuery,
  type DonationInput,
} from "../../../../shared/validations/donations.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/donations")
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  /**
   * Donasi publik — selalu guest (tanpa akun donatur). Identitas donatur
   * adalah donorName/donorPhone/donorEmail langsung pada body request.
   */
  @Post("public")
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async createPublic(@Body(new ZodValidationPipe(donationSchema)) body: DonationInput) {
    const { donation } = await this.donationsService.createDonation(body);
    return { donationId: donation.id };
  }

  /**
   * Riwayat donasi berdasarkan nomor telepon — publik, lintas-lembaga,
   * tanpa login (donatur tidak memiliki akun).
   */
  @Get("history")
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async history(
    @Query(new ZodValidationPipe(donationHistoryQuerySchema)) query: DonationHistoryQuery,
  ) {
    const { items, metadata } = await this.donationsService.getDonationHistoryByPhone(
      query.phone,
      query.page,
      query.limit,
    );
    return { data: items, meta: metadata };
  }

  @Get()
  @RequirePermission(PERMISSIONS.DONATIONS_READ)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("lembagaId") lembagaId?: string,
  ) {
    const { items, metadata } = await this.donationsService.getDashboardDonations(
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
      resolveLembagaScope(user, lembagaId),
    );
    return { data: items, meta: metadata };
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.DONATIONS_READ)
  async detail(@Param("id") id: string) {
    const donation = await this.donationsService.getDonationById(id);
    if (!donation) throw new NotFoundException("Donasi tidak ditemukan");
    return donation;
  }

  @Post()
  @RequirePermission(PERMISSIONS.DONATIONS_CREATE)
  async createAdmin(
    @Body(new ZodValidationPipe(adminDonationSchema)) body: AdminDonationInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    const donation = await this.donationsService.createAdminDonation(body, user.id);
    return { donationId: donation.id };
  }

  /** Pengganti generateMockWebhookPayloadAction. */
  @Post(":id/mock-webhook")
  @RequirePermission(PERMISSIONS.PAYMENTS_MANAGE)
  async mockWebhook(@Param("id") id: string) {
    return { payload: await this.donationsService.generateMockWebhookPayload(id) };
  }
}
