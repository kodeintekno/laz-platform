import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { VolunteersService } from "./volunteers.service";
import { VolunteerApplicationsService } from "./volunteer-applications.service";
import { VolunteerActivitiesService } from "./volunteer-activities.service";
import { VolunteerAuthGuard } from "./volunteer-auth.guard";
import { CurrentVolunteer } from "../../common/decorators/current-volunteer.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import {
  volunteerApplicationSchema,
  volunteerLoginSchema,
  volunteerProfileSchema,
  volunteerRegistrationSchema,
  volunteerReportSchema,
  type VolunteerApplicationInput,
  type VolunteerLoginInput,
  type VolunteerProfileInput,
  type VolunteerRegistrationInput,
  type VolunteerReportInput,
} from "../../../../shared/validations/volunteers.schema";
import type { VolunteerSessionUser } from "../../../../shared/types/volunteer";

@Controller("api/volunteers")
export class VolunteersController {
  constructor(
    private readonly volunteersService: VolunteersService,
    private readonly applicationsService: VolunteerApplicationsService,
    private readonly activitiesService: VolunteerActivitiesService,
  ) {}

  /**
   * Registrasi publik relawan. Body JSON — foto/KTP/CV di-upload terlebih
   * dahulu via POST /api/upload (pola sama dengan FileUpload di form lain),
   * URL hasil upload dikirim sebagai field biasa di sini.
   */
  @Post("register")
  @Public()
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async register(
    @Body(new ZodValidationPipe(volunteerRegistrationSchema)) body: VolunteerRegistrationInput,
    @Req() req: Request,
  ) {
    const volunteer = await this.volunteersService.register(body);
    await this.establishSession(req, volunteer.id);
    return volunteer;
  }

  @Post("login")
  @Public()
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async login(
    @Body(new ZodValidationPipe(volunteerLoginSchema)) body: VolunteerLoginInput,
    @Req() req: Request,
  ) {
    const volunteer = await this.volunteersService.signIn(body);
    if (!volunteer) {
      throw new UnauthorizedException("Email atau password salah");
    }
    await this.establishSession(req, volunteer.id);
    return volunteer;
  }

  @Post("logout")
  @Public()
  @UseGuards(VolunteerAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await new Promise<void>((resolve, reject) =>
      req.session.destroy((err) => (err ? reject(err) : resolve())),
    );
    res.clearCookie("laz.sid");
    return { loggedOut: true };
  }

  @Get("me")
  @Public()
  @UseGuards(VolunteerAuthGuard)
  me(@CurrentVolunteer() volunteer: VolunteerSessionUser) {
    return volunteer;
  }

  /** Profil lengkap (untuk halaman edit profil relawan). */
  @Get("profile")
  @Public()
  @UseGuards(VolunteerAuthGuard)
  async profile(@CurrentVolunteer() volunteer: VolunteerSessionUser) {
    const fullProfile = await this.volunteersService.getFullProfile(volunteer.id);
    if (!fullProfile) throw new NotFoundException("Profil relawan tidak ditemukan");
    return fullProfile;
  }

  @Patch("profile")
  @Public()
  @UseGuards(VolunteerAuthGuard)
  async updateProfile(
    @Body(new ZodValidationPipe(volunteerProfileSchema)) body: VolunteerProfileInput,
    @CurrentVolunteer() volunteer: VolunteerSessionUser,
  ) {
    return this.volunteersService.updateProfile(volunteer.id, body);
  }

  /** "Cari Kegiatan" — kegiatan relawan OPEN, publik, lintas-lembaga. */
  @Get("activities")
  @Public()
  async activities() {
    return this.activitiesService.getOpenActivities();
  }

  @Post("applications")
  @Public()
  @UseGuards(VolunteerAuthGuard)
  async apply(
    @Body(new ZodValidationPipe(volunteerApplicationSchema)) body: VolunteerApplicationInput,
    @CurrentVolunteer() volunteer: VolunteerSessionUser,
  ) {
    return this.applicationsService.apply(volunteer.id, body.activityId);
  }

  /**
   * "Pendaftaran Saya" / "Kegiatan Saya" / "Riwayat & Kontribusi" — dipilah
   * lewat query `scope` supaya satu endpoint melayani ketiga menu dashboard.
   */
  @Get("applications")
  @Public()
  @UseGuards(VolunteerAuthGuard)
  async myApplications(
    @CurrentVolunteer() volunteer: VolunteerSessionUser,
    @Query("scope") scope?: "pending" | "active" | "completed" | "all",
  ) {
    if (scope === "pending") return this.applicationsService.getPendingApplications(volunteer.id);
    if (scope === "active") return this.applicationsService.getActiveApplications(volunteer.id);
    if (scope === "completed") return this.applicationsService.getCompletedApplications(volunteer.id);
    return this.applicationsService.getOwnApplications(volunteer.id);
  }

  /** Relawan mengirim laporan/tugas selesai untuk kegiatan yang sedang diikuti. */
  @Post("applications/:id/report")
  @Public()
  @UseGuards(VolunteerAuthGuard)
  async submitReport(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(volunteerReportSchema)) body: VolunteerReportInput,
    @CurrentVolunteer() volunteer: VolunteerSessionUser,
  ) {
    return this.applicationsService.submitReport(id, volunteer.id, {
      reportText: body.reportText,
      reportFileUrl: body.reportFileUrl || undefined,
      reportFilePublicId: body.reportFilePublicId || undefined,
    });
  }

  /** Data lengkap untuk mencetak Surat Tugas Relawan (PDF di frontend). */
  @Get("applications/:id/assignment-letter-data")
  @Public()
  @UseGuards(VolunteerAuthGuard)
  async assignmentLetterData(
    @Param("id") id: string,
    @CurrentVolunteer() volunteer: VolunteerSessionUser,
  ) {
    return this.applicationsService.getAssignmentLetterData(id, volunteer.id);
  }

  private establishSession(req: Request, volunteerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        req.session.volunteerId = volunteerId;
        req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
      });
    });
  }
}
