import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { DonationsService } from "./donations.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { resolveLazScope } from "../../common/utils/laz-scope";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import {
  adminDonationSchema,
  donationSchema,
  type AdminDonationInput,
  type DonationInput,
} from "../../../../shared/validations/donations.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/donations")
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  /**
   * Donasi publik — guest atau user login (@Public + req.user opsional).
   * Pengganti createDonationAction.
   */
  @Post("public")
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async createPublic(
    @Body(new ZodValidationPipe(donationSchema)) body: DonationInput,
    @Req() req: Request,
  ) {
    const user = req.user;

    // Server-side validation for guests
    if (!user) {
      if (!body.donorName || body.donorName.trim() === "") {
        throw new BadRequestException("Nama donatur wajib diisi");
      }
      if (!body.donorEmail || body.donorEmail.trim() === "") {
        throw new BadRequestException("Email donatur wajib diisi");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.donorEmail)) {
        throw new BadRequestException("Format email tidak valid");
      }
    } else {
      // Auto-populate donor details from session if user is logged in
      if (!body.donorName && user.name) {
        body.donorName = user.name;
      }
      if (!body.donorEmail && user.email) {
        body.donorEmail = user.email;
      }
    }

    const { donation } = await this.donationsService.createDonation(body, user?.id);
    return { donationId: donation.id };
  }

  @Get()
  @RequirePermission(PERMISSIONS.DONATIONS_READ)
  async list(
    @CurrentUser() user: RBACSessionUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("lazId") lazId?: string,
  ) {
    const { items, metadata } = await this.donationsService.getDashboardDonations(
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
      resolveLazScope(user, lazId),
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

  @Patch(":id")
  @RequirePermission(PERMISSIONS.DONATIONS_UPDATE)
  async updateAdmin(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminDonationSchema)) body: AdminDonationInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.donationsService.updateAdminDonation(id, body, user.id);
  }

  /** Pengganti generateMockWebhookPayloadAction. */
  @Post(":id/mock-webhook")
  @RequirePermission(PERMISSIONS.PAYMENTS_MANAGE)
  async mockWebhook(@Param("id") id: string) {
    return { payload: await this.donationsService.generateMockWebhookPayload(id) };
  }
}
