import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { ProgramsService } from "../programs/programs.service";
import { AnalyticsService } from "../analytics/analytics.service";

/**
 * Endpoint publik (homepage & halaman program) — pengganti fetch
 * server-component Next.js.
 */
@Controller("api/public")
export class PublicController {
  constructor(
    private readonly programsService: ProgramsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get("programs")
  @Public()
  async programs() {
    return this.programsService.getPublishedPrograms();
  }

  @Get("programs/:slug")
  @Public()
  async programBySlug(@Param("slug") slug: string) {
    const program = await this.programsService.getProgramBySlug(slug);
    if (!program) throw new NotFoundException("Program tidak ditemukan");
    return program;
  }

  @Get("stats")
  @Public()
  async stats() {
    return this.analyticsService.getDashboardMetrics();
  }
}
