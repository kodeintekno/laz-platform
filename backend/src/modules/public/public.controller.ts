import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { ProgramsService } from "../programs/programs.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { LembagaService } from "../lembaga/lembaga.service";

/**
 * Endpoint publik (marketplace, homepage & halaman program) — pengganti
 * fetch server-component Next.js.
 */
@Controller("api/public")
export class PublicController {
  constructor(
    private readonly programsService: ProgramsService,
    private readonly analyticsService: AnalyticsService,
    private readonly lembagaService: LembagaService,
  ) {}

  @Get("programs")
  @Public()
  async programs(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("lembagaId") lembagaId?: string,
    @Query("lembagaSlug") lembagaSlug?: string,
    @Query("sort") sort?: "newest" | "most-funded" | "ending-soon",
  ) {
    const { items, metadata } = await this.programsService.getPublishedPrograms({
      page: Number(page) || 1,
      limit: Number(limit) || 12,
      search: search || undefined,
      category: category || undefined,
      lembagaId: lembagaId || undefined,
      lembagaSlug: lembagaSlug || undefined,
      sort: sort || undefined,
    });
    return { data: items, meta: metadata };
  }

  @Get("programs/:slug")
  @Public()
  async programBySlug(@Param("slug") slug: string) {
    const program = await this.programsService.getProgramBySlug(slug);
    if (!program) throw new NotFoundException("Program tidak ditemukan");
    return program;
  }

  /** Direktori publik seluruh lembaga APPROVED. */
  @Get("lembaga")
  @Public()
  async lembagaDirectory(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    const { items, metadata } = await this.lembagaService.getPublicDirectory(
      Number(page) || 1,
      Number(limit) || 12,
      search || undefined,
    );
    return { data: items, meta: metadata };
  }

  /** Profil publik satu lembaga APPROVED + program + statistik. */
  @Get("lembaga/:slug")
  @Public()
  async lembagaProfile(@Param("slug") slug: string) {
    const lembaga = await this.lembagaService.getPublicProfile(slug);
    if (!lembaga) throw new NotFoundException("Lembaga tidak ditemukan");
    return lembaga;
  }

  @Get("stats")
  @Public()
  async stats() {
    return this.analyticsService.getDashboardMetrics();
  }
}
