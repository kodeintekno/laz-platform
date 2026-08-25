import { Controller, Post, Get, Body, Param, UseGuards, Req, Query, HttpCode, ParseIntPipe } from "@nestjs/common";
import { WithdrawalsService } from "./withdrawals.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { Request } from "express";

@Controller("api/withdrawals")
@UseGuards(AuthGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) { }

  // ==========================================
  // INSTITUTION ENDPOINTS
  // ==========================================

  @Post()
  @RequirePermission("withdrawals.create")
  async createWithdrawal(@Req() req: Request, @Body() body: { amount: number }) {
    const user = req.user!;
    // Must be part of a lembaga to request withdrawal
    if (!user.lembagaId) {
      throw new Error("User does not belong to an institution.");
    }

    return this.withdrawalsService.createWithdrawal(
      user.lembagaId,
      user.id,
      body.amount
    );
  }

  @Get("mine")
  @RequirePermission("withdrawals.read")
  async getMyWithdrawals(
    @Req() req: Request,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const user = req.user!;
    if (!user.lembagaId) {
      throw new Error("User does not belong to an institution.");
    }

    return this.withdrawalsService.getLembagaWithdrawals(
      user.lembagaId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  // ==========================================
  // SUPER ADMIN ENDPOINTS
  // ==========================================

  @Get()
  @RequirePermission("withdrawals.manage")
  async getAllWithdrawals(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.withdrawalsService.getAllWithdrawals(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Get("payouts")
  @RequirePermission("withdrawals.manage")
  async getAllPayouts(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.withdrawalsService.getAllPayouts(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Post(":id/approve")
  @HttpCode(200)
  @RequirePermission("withdrawals.manage")
  async approveWithdrawal(@Req() req: Request, @Param("id") id: string) {
    return this.withdrawalsService.approveWithdrawal(id, req.user!.id);
  }

  @Post(":id/reject")
  @HttpCode(200)
  @RequirePermission("withdrawals.manage")
  async rejectWithdrawal(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { reason: string }
  ) {
    return this.withdrawalsService.rejectWithdrawal(id, req.user!.id, body.reason);
  }

  @Post(":id/retry-payout")
  @HttpCode(200)
  @RequirePermission("withdrawals.manage")
  async retryPayout(@Param("id") id: string) {
    return this.withdrawalsService.retryPayout(id);
  }
}
